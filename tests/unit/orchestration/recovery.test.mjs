import { describe, expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
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

function _stopRoot(runtime, sessionId) {
	return run(
		"stop.mjs",
		"Stop",
		{ session_id: sessionId, stop_hook_active: false },
		runtime,
	);
}

function _spawnAsync(script, event, payload, runtime) {
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
	test("keeps failed spawn and send attempts retryable without reserving identities", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-retry";
		pre(runtime, sessionId, "apply_patch", { command: "x" });
		expect(
			pre(
				runtime,
				sessionId,
				"spawn_agent",
				{
					agent_type: "forge-worker",
					message: "attempt one",
				},
				{ tool_use_id: "spawn-1" },
			),
		).toBeNull();
		expect(
			pre(
				runtime,
				sessionId,
				"spawn_agent",
				{
					agent_type: "forge-worker",
					message: "retry after failure",
				},
				{ tool_use_id: "spawn-2" },
			),
		).toBeNull();
		expect(state(runtime, sessionId).worker).toBeNull();
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(
			runtime,
			sessionId,
			"worker-1",
			"forge-worker",
			"candidate ready",
		);
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		stopAgent(
			runtime,
			sessionId,
			"reviewer-1",
			"forge-reviewer",
			"FORGE_REVIEW_RESULT: fail",
		);
		for (const message of ["repair attempt", "repair retry"])
			expect(
				pre(runtime, sessionId, "multi_agent_v1send_input", {
					target: "worker-1",
					message,
				}),
			).toBeNull();
		expect(state(runtime, sessionId).phase).toBe("repair_worker");
		stopAgent(runtime, sessionId, "worker-1", "forge-worker", "repaired");
		for (const message of ["recheck attempt", "recheck retry"])
			expect(
				pre(runtime, sessionId, "multi_agent_v1send_input", {
					target: "reviewer-1",
					message,
				}),
			).toBeNull();
		expect(state(runtime, sessionId).phase).toBe("awaiting_recheck");
	});
	test("rejects malformed, mixed, and out-of-phase follow-up targets", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-followup-targets";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(
			runtime,
			sessionId,
			"worker-1",
			"forge-worker",
			"candidate ready",
		);
		for (const input of [
			{ message: "missing target" },
			{ target: "unknown", message: "unknown" },
			{ targets: ["worker-1", "unknown"], message: "mixed" },
			{ target: "worker-1", message: "late worker follow-up" },
		])
			expect(
				pre(runtime, sessionId, "multi_agent_v1send_input", input)
					.hookSpecificOutput.permissionDecision,
			).toBe("deny");
	});
	test("rejects a reviewer lifecycle start before the worker stops", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-reviewer-order";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		expect(state(runtime, sessionId).integrity).toBe("reviewer_out_of_order");
		expect(state(runtime, sessionId).phase).toBe("blocked");
	});
	test("keeps repair and recheck on the same registered ids", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-repair";
		pre(runtime, sessionId, "apply_patch", { patch: "x" });
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(
			runtime,
			sessionId,
			"worker-1",
			"forge-worker",
			"candidate ready",
		);
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		stopAgent(
			runtime,
			sessionId,
			"reviewer-1",
			"forge-reviewer",
			"fix required\nFORGE_REVIEW_RESULT: fail",
		);
		expect(
			pre(runtime, sessionId, "multi_agent_v1resume_agent", { id: "worker-1" }),
		).toBeNull();
		const repair = pre(runtime, sessionId, "multi_agent_v1__send_input", {
			target: "worker-1",
			message: "repair",
		});
		expect(repair).toBeNull();
		start(runtime, sessionId, "worker-1", "forge-worker");
		expect(state(runtime, sessionId).worker.status).toBe("repair_running");
		expect(
			pre(runtime, sessionId, "multi_agent_v1.send_input", {
				target: "reviewer-1",
				message: "early recheck",
			}).hookSpecificOutput.permissionDecision,
		).toBe("deny");
		stopAgent(runtime, sessionId, "worker-1", "forge-worker", "repaired");
		expect(
			pre(runtime, sessionId, "multi_agent_v1send_input", {
				target: "reviewer-1",
				message: "recheck",
			}),
		).toBeNull();
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		expect(state(runtime, sessionId).reviewer.status).toBe("recheck_running");
		stopAgent(
			runtime,
			sessionId,
			"reviewer-1",
			"forge-reviewer",
			"rechecked\nFORGE_REVIEW_RESULT: pass",
		);
		const current = state(runtime, sessionId);
		expect(current.worker.id).toBe("worker-1");
		expect(current.reviewer.id).toBe("reviewer-1");
		expect(current.phase).toBe("reviewed");
	});
});
