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

function denialReason(output) {
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
	test("allows deterministic read-only and orchestration controls before activation", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-read-only";
		expect(
			pre(runtime, sessionId, "Bash", { command: "git status --short" }),
		).toBeNull();
		expect(pre(runtime, sessionId, "get_goal")).toBeNull();
		expect(
			pre(runtime, sessionId, "multi_agent_v1wait_agent", {
				targets: ["worker-1"],
			}),
		).toBeNull();
		expect(
			pre(runtime, sessionId, "multi_agent_v1__wait_agent", {
				targets: ["worker-1"],
			}),
		).toBeNull();
		expect(state(runtime, sessionId)).toBeNull();
	});
	test("runs the managed-hook lifecycle under stock Node as well as Bun", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-node-runtime";
		const denied = run(
			"pre-tool-use.mjs",
			"PreToolUse",
			{
				session_id: sessionId,
				tool_name: "apply_patch",
				tool_input: { command: "x" },
			},
			runtime,
			"node",
		);
		expect(denied.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(
			run(
				"pre-tool-use.mjs",
				"PreToolUse",
				{
					session_id: sessionId,
					tool_name: "spawn_agent",
					tool_input: { agent_type: "forge-worker", message: "change" },
				},
				runtime,
				"node",
			),
		).toBeNull();
		run(
			"subagent-start.mjs",
			"SubagentStart",
			{
				session_id: sessionId,
				agent_id: "worker-node",
				agent_type: "forge-worker",
			},
			runtime,
			"node",
		);
		run(
			"subagent-stop.mjs",
			"SubagentStop",
			{
				session_id: sessionId,
				agent_id: "worker-node",
				agent_type: "forge-worker",
				last_assistant_message: "candidate ready",
			},
			runtime,
			"node",
		);
		run(
			"pre-tool-use.mjs",
			"PreToolUse",
			{
				session_id: sessionId,
				tool_name: "spawn_agent",
				tool_input: { agent_type: "forge-reviewer", message: "review" },
			},
			runtime,
			"node",
		);
		run(
			"subagent-start.mjs",
			"SubagentStart",
			{
				session_id: sessionId,
				agent_id: "reviewer-node",
				agent_type: "forge-reviewer",
			},
			runtime,
			"node",
		);
		expect(
			run(
				"subagent-stop.mjs",
				"SubagentStop",
				{
					session_id: sessionId,
					agent_id: "reviewer-node",
					agent_type: "forge-reviewer",
					last_assistant_message: "accepted\nFORGE_REVIEW_RESULT: pass",
				},
				runtime,
				"node",
			),
		).toBeNull();
		expect(
			run(
				"stop.mjs",
				"Stop",
				{
					session_id: sessionId,
					stop_hook_active: false,
				},
				runtime,
				"node",
			),
		).toBeNull();
		expect(state(runtime, sessionId)).toBeNull();
	});
	test("fails closed for a guarded root tool with no usable session identity", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		for (const [tool_name, tool_input] of [
			["apply_patch", { patch: "x" }],
			["spawn_agent", { agent_type: "forge-reviewer", message: "review" }],
			["update_goal", { status: "complete" }],
		]) {
			const denied = run(
				"pre-tool-use.mjs",
				"PreToolUse",
				{ tool_name, tool_input },
				runtime,
			);
			expect(denied.hookSpecificOutput.permissionDecision).toBe("deny");
			expect(denialReason(denied)).toContain(
				"orchestration state is unavailable",
			);
		}
	});
	test("activates on root mutation, then requires worker and reviewer in order", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-order";
		expect(
			pre(runtime, sessionId, "apply_patch", { patch: "x" }).hookSpecificOutput
				.permissionDecision,
		).toBe("deny");
		expect(state(runtime, sessionId).phase).toBe("awaiting_worker");
		expect(
			pre(runtime, sessionId, "spawn_agent", {
				agent_type: "forge-worker",
				message: "change",
			}),
		).toBeNull();
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(
			runtime,
			sessionId,
			"worker-1",
			"forge-worker",
			"candidate ready",
		);
		expect(
			pre(runtime, sessionId, "multi_agent_v1close_agent", {
				target: "worker-1",
			}).hookSpecificOutput.permissionDecision,
		).toBe("deny");
		expect(
			pre(runtime, sessionId, "multi_agent_v1resume_agent", { id: "worker-1" })
				.hookSpecificOutput.permissionDecision,
		).toBe("deny");
		expect(
			pre(runtime, sessionId, "spawn_agent", {
				agent_type: "forge-reviewer",
				message: "review",
			}),
		).toBeNull();
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		expect(
			stopAgent(runtime, sessionId, "reviewer-1", "forge-reviewer", "evidence")
				.decision,
		).toBe("block");
		expect(
			stopAgent(
				runtime,
				sessionId,
				"reviewer-1",
				"forge-reviewer",
				"forge_review_result: pass",
			).decision,
		).toBe("block");
		expect(
			stopAgent(
				runtime,
				sessionId,
				"reviewer-1",
				"forge-reviewer",
				" FORGE_REVIEW_RESULT: pass",
			).decision,
		).toBe("block");
		expect(
			stopAgent(
				runtime,
				sessionId,
				"reviewer-1",
				"forge-reviewer",
				"FORGE_REVIEW_RESULT: pass\nevidence after marker",
			).decision,
		).toBe("block");
		expect(
			stopAgent(
				runtime,
				sessionId,
				"reviewer-1",
				"forge-reviewer",
				"FORGE_REVIEW_RESULT: fail\nFORGE_REVIEW_RESULT: pass",
			).decision,
		).toBe("block");
		expect(stopRoot(runtime, sessionId).decision).toBe("block");
		expect(
			stopAgent(
				runtime,
				sessionId,
				"reviewer-1",
				"forge-reviewer",
				"all criteria pass\nFORGE_REVIEW_RESULT: pass",
			),
		).toBeNull();
		expect(
			pre(runtime, sessionId, "Bash", { command: "git status --short" }),
		).toBeNull();
		expect(
			pre(runtime, sessionId, "multi_agent_v1close_agent", {
				target: "reviewer-1",
			}),
		).toBeNull();
		expect(stopRoot(runtime, sessionId)).toBeNull();
		expect(state(runtime, sessionId)).toBeNull();
		expect(
			pre(runtime, sessionId, "apply_patch", { patch: "next task" })
				.hookSpecificOutput.permissionDecision,
		).toBe("deny");
		expect(state(runtime, sessionId).phase).toBe("awaiting_worker");
	});
	test("activates when root starts the standard worker directly", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-direct-worker";
		expect(
			pre(runtime, sessionId, "spawn_agent", {
				agent_type: "forge-worker",
				message: "change",
			}),
		).toBeNull();
		expect(state(runtime, sessionId).phase).toBe("awaiting_worker");
		expect(state(runtime, sessionId).worker).toBeNull();
	});
	test("uses both official child identity fields before bypassing the root gate", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-child-identity";
		for (const [index, incomplete] of [
			{ agent_id: "worker-1" },
			{ agent_type: "forge-worker" },
			{ agent_id: " ", agent_type: "forge-worker" },
			{ agent_id: "", agent_type: "" },
			{ agent_id: null, agent_type: null },
			{ agent_id: 1, agent_type: "forge-worker" },
		].entries()) {
			const denied = pre(
				runtime,
				`${sessionId}-${index}`,
				index === 0 ? "apply_patch" : "Bash",
				index === 0 ? { command: "x" } : { command: "git status --short" },
				incomplete,
			);
			expect(denied.hookSpecificOutput.permissionDecision).toBe("deny");
			expect(denialReason(denied)).toContain("identity is incomplete");
			expect(state(runtime, `${sessionId}-${index}`)).toBeNull();
		}
		const unknown = pre(
			runtime,
			sessionId,
			"apply_patch",
			{ command: "x" },
			{
				agent_id: "worker-1",
				agent_type: "forge-worker",
			},
		);
		expect(unknown.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(denialReason(unknown)).toContain("no registered repository phase");
		expect(state(runtime, sessionId)).toBeNull();
	});
	test("passes registered child tools through and rejects duplicate workers", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-child";
		pre(runtime, sessionId, "apply_patch", { patch: "x" });
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		expect(
			run(
				"pre-tool-use.mjs",
				"PreToolUse",
				{
					session_id: sessionId,
					agent_id: "worker-1",
					agent_type: "forge-worker",
					tool_name: "apply_patch",
					tool_input: { patch: "child change" },
				},
				runtime,
			),
		).toBeNull();
		start(runtime, sessionId, "worker-2", "forge-worker");
		expect(state(runtime, sessionId).integrity).toBe("duplicate_worker");
		expect(state(runtime, sessionId).phase).toBe("blocked");
	});
	test("blocks root completion when its identity fields are incomplete", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const stopped = run(
			"stop.mjs",
			"Stop",
			{
				session_id: "gate-incomplete-stop",
				agent_id: "",
				stop_hook_active: false,
			},
			runtime,
		);
		expect(stopped.decision).toBe("block");
		expect(stopped.reason).toContain("identity is incomplete");
	});
});
