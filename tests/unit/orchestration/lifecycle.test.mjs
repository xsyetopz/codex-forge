import { describe, expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	statSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sessionPaths } from "../../../plugins/codex-forge/scripts/hooks/orchestration/state.mjs";

const ROOT = resolve(import.meta.dir, "../../..");
const PLUGIN = join(ROOT, "plugins", "codex-forge");

function run(script, event, payload, runtime, runtimeExecutable = "bun") {
	const result = spawnSync(
		runtimeExecutable,
		[join(PLUGIN, "scripts", "hooks", "orchestration", script)],
		{
			cwd: ROOT,
			env: { ...process.env, CODEX_FORGE_RUNTIME_DIR: runtime },
			input: JSON.stringify({ hook_event_name: event, ...payload }),
			encoding: "utf8",
		},
	);
	if (result.status !== 0)
		throw new Error(result.stderr || `hook exited ${result.status}`);
	return result.stdout.trim() ? JSON.parse(result.stdout.trim()) : null;
}

function state(runtime, sessionId) {
	const path = join(runtime, `${sessionPaths(sessionId).key}.json`);
	return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function _audit(runtime, sessionId) {
	return join(runtime, `${sessionPaths(sessionId).key}.json.audit.jsonl`);
}

function pre(runtime, sessionId, tool_name, tool_input = {}, extra = {}) {
	return run(
		"pre-tool-use.mjs",
		"PreToolUse",
		{
			session_id: sessionId,
			tool_name,
			tool_input,
			...extra,
		},
		runtime,
	);
}

function _denialReason(output) {
	return output.hookSpecificOutput.permissionDecisionReason;
}

function start(runtime, sessionId, agent_id, agent_type) {
	return run(
		"subagent-start.mjs",
		"SubagentStart",
		{
			session_id: sessionId,
			agent_id,
			agent_type,
		},
		runtime,
	);
}

function stopAgent(runtime, sessionId, agent_id, agent_type, message) {
	return run(
		"subagent-stop.mjs",
		"SubagentStop",
		{
			session_id: sessionId,
			agent_id,
			agent_type,
			last_assistant_message: message,
		},
		runtime,
	);
}

function stopRoot(runtime, sessionId) {
	return run(
		"stop.mjs",
		"Stop",
		{ session_id: sessionId, stop_hook_active: false },
		runtime,
	);
}

function spawnAsync(script, event, payload, runtime) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(
			"bun",
			[join(PLUGIN, "scripts", "hooks", "orchestration", script)],
			{
				cwd: ROOT,
				env: { ...process.env, CODEX_FORGE_RUNTIME_DIR: runtime },
			},
		);
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => (stdout += chunk));
		child.stderr.on("data", (chunk) => (stderr += chunk));
		child.on("error", reject);
		child.on("close", (code) => {
			if (code !== 0) return reject(new Error(stderr || `hook exited ${code}`));
			resolvePromise(stdout.trim() ? JSON.parse(stdout.trim()) : null);
		});
		child.stdin.end(JSON.stringify({ hook_event_name: event, ...payload }));
	});
}

describe("legacy V1 Forge orchestration gate", () => {
	test("emits one terminal blocked-session recovery and does not loop on repeated Stop events", async () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const blockSession = (sessionId) => {
			pre(runtime, sessionId, "spawn_agent", {
				agent_type: "forge-worker",
				message: "change",
			});
			start(runtime, sessionId, `worker-${sessionId}`, "forge-worker");
			stopAgent(
				runtime,
				sessionId,
				`worker-${sessionId}`,
				"forge-worker",
				"candidate ready",
			);
			stopAgent(
				runtime,
				sessionId,
				`worker-${sessionId}`,
				"forge-worker",
				"duplicate stop",
			);
			expect(state(runtime, sessionId).integrity).toBe("worker_out_of_order");
		};
		const sessionId = "gate-worker-out-of-order-stop";
		blockSession(sessionId);

		const first = stopRoot(runtime, sessionId);
		expect(first.decision).toBe("block");
		expect(first.reason).toContain("Start a fresh session");
		expect(state(runtime, sessionId).stop_notice_emitted).toBe(true);
		for (let attempt = 0; attempt < 4; attempt += 1)
			expect(stopRoot(runtime, sessionId)).toBeNull();
		expect(state(runtime, sessionId).phase).toBe("blocked");

		const concurrentSession = "gate-worker-out-of-order-concurrent";
		blockSession(concurrentSession);
		const concurrent = await Promise.all([
			spawnAsync(
				"stop.mjs",
				"Stop",
				{ session_id: concurrentSession, stop_hook_active: false },
				runtime,
			),
			spawnAsync(
				"stop.mjs",
				"Stop",
				{ session_id: concurrentSession, stop_hook_active: false },
				runtime,
			),
			spawnAsync(
				"stop.mjs",
				"Stop",
				{ session_id: concurrentSession, stop_hook_active: false },
				runtime,
			),
		]);
		expect(
			concurrent.filter((output) => output?.decision === "block"),
		).toHaveLength(1);
		expect(concurrent.filter((output) => output === null)).toHaveLength(2);

		const secondSession = "gate-worker-out-of-order-independent";
		blockSession(secondSession);
		const secondFirst = stopRoot(runtime, secondSession);
		expect(secondFirst.decision).toBe("block");
		expect(secondFirst.reason).toContain("Start a fresh session");
		expect(stopRoot(runtime, secondSession)).toBeNull();
		expect(state(runtime, sessionId).stop_notice_emitted).toBe(true);
		expect(state(runtime, secondSession).stop_notice_emitted).toBe(true);

		const freshSession = "gate-worker-out-of-order-fresh";
		const fresh = pre(runtime, freshSession, "apply_patch", {
			patch: "fresh sequence",
		});
		expect(fresh.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(state(runtime, freshSession).phase).toBe("awaiting_worker");
		expect(state(runtime, freshSession).integrity).toBe("ok");
	});
	test("serializes concurrent worker attempts without a failed-call reservation", async () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-concurrent";
		const calls = await Promise.all(
			Array.from({ length: 8 }, (_, index) =>
				spawnAsync(
					"pre-tool-use.mjs",
					"PreToolUse",
					{
						session_id: sessionId,
						tool_name: "spawn_agent",
						tool_input: {
							agent_type: "forge-worker",
							message: `change ${index}`,
						},
						tool_use_id: `spawn-${index}`,
					},
					runtime,
				),
			),
		);
		const current = state(runtime, sessionId);
		expect(current.worker).toBeNull();
		expect(current.phase).toBe("awaiting_worker");
		expect(current.integrity).toBe("ok");
		expect(calls).toEqual(Array(8).fill(null));
	});
	test("allows a user-input or blocked-goal pause and reactivates on mutation", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-pause";
		pre(runtime, sessionId, "apply_patch", { command: "x" });
		expect(
			pre(runtime, sessionId, "request_user_input", { question: "continue?" }),
		).toBeNull();
		expect(state(runtime, sessionId).paused).toBe(true);
		expect(stopRoot(runtime, sessionId)).toBeNull();
		expect(
			pre(runtime, sessionId, "update_goal", { status: "complete" })
				.hookSpecificOutput.permissionDecision,
		).toBe("deny");
		expect(
			pre(runtime, sessionId, "apply_patch", { command: "x" })
				.hookSpecificOutput.permissionDecision,
		).toBe("deny");
		expect(state(runtime, sessionId).paused).toBe(false);
		expect(
			pre(runtime, sessionId, "update_goal", { status: "blocked" }),
		).toBeNull();
		expect(stopRoot(runtime, sessionId)).toBeNull();
	});
	test("fails closed for corruption, uses hashed 0600 state, and cleans expired sessions", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-corrupt";
		const path = join(runtime, `${sessionPaths(sessionId).key}.json`);
		writeFileSync(path, "{broken", { mode: 0o600 });
		chmodSync(path, 0o600);
		const denied = pre(runtime, sessionId, "apply_patch", { patch: "x" });
		expect(denied.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(readFileSync(path, "utf8")).toBe("{broken");
		expect(statSync(runtime).mode & 0o777).toBe(0o700);
		expect(statSync(path).mode & 0o777).toBe(0o600);
		writeFileSync(path, JSON.stringify({ version: 1 }));
		utimesSync(path, new Date(0), new Date(0));
		process.env.CODEX_FORGE_STATE_TTL_MS = "1";
		run(
			"session-start.mjs",
			"SessionStart",
			{ session_id: "cleanup-session" },
			runtime,
		);
		delete process.env.CODEX_FORGE_STATE_TTL_MS;
		expect(existsSync(path)).toBe(false);
	});
	test("preserves the resumed session while TTL cleanup removes other expired state", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const current = "gate-current-expired";
		const other = "gate-other-expired";
		pre(runtime, current, "apply_patch", { command: "x" });
		pre(runtime, other, "apply_patch", { command: "x" });
		const currentPath = join(runtime, `${sessionPaths(current).key}.json`);
		const otherPath = join(runtime, `${sessionPaths(other).key}.json`);
		utimesSync(currentPath, new Date(0), new Date(0));
		utimesSync(otherPath, new Date(0), new Date(0));
		process.env.CODEX_FORGE_STATE_TTL_MS = "1";
		run(
			"session-start.mjs",
			"SessionStart",
			{ session_id: current, source: "resume" },
			runtime,
		);
		delete process.env.CODEX_FORGE_STATE_TTL_MS;
		expect(existsSync(currentPath)).toBe(true);
		expect(existsSync(otherPath)).toBe(false);
	});
	test("fails closed without chmodding an insecure runtime directory", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		chmodSync(runtime, 0o755);
		const denied = pre(runtime, "gate-insecure-runtime", "apply_patch", {
			command: "x",
		});
		expect(denied.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(statSync(runtime).mode & 0o777).toBe(0o755);
	});
	test("removes the session record on SessionEnd", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-end";
		pre(runtime, sessionId, "apply_patch", { patch: "x" });
		expect(
			existsSync(join(runtime, `${sessionPaths(sessionId).key}.json`)),
		).toBe(true);
		run("session-end.mjs", "SessionEnd", { session_id: sessionId }, runtime);
		expect(
			existsSync(join(runtime, `${sessionPaths(sessionId).key}.json`)),
		).toBe(false);
	});
});
