import { describe, expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sessionPaths } from "../../../plugins/codex-forge/scripts/hooks/orchestration/state.mjs";
import { audit } from "./support.mjs";

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
	test("recognizes flattened and namespace-qualified legacy V1 tool names", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-v1-tool-names";
		pre(runtime, sessionId, "apply_patch", { patch: "x" });
		expect(
			pre(runtime, sessionId, "multi_agent_v1__spawn_agent", {
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
			pre(runtime, sessionId, "multi_agent_v1.spawn_agent", {
				agent_type: "forge-reviewer",
				message: "review",
			}),
		).toBeNull();
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		stopAgent(
			runtime,
			sessionId,
			"reviewer-1",
			"forge-reviewer",
			"FORGE_REVIEW_RESULT: pass",
		);
		expect(state(runtime, sessionId).phase).toBe("reviewed");
	});
	test("returns one stable phase-specific recovery action with the registered target", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-phase-recovery";
		const repeated = (expected) => {
			const before = state(runtime, sessionId);
			const first = pre(runtime, sessionId, "apply_patch", { patch: "root" });
			const second = pre(runtime, sessionId, "apply_patch", { patch: "root" });
			expect(denialReason(first)).toBe(expected);
			expect(denialReason(second)).toBe(expected);
			expect(state(runtime, sessionId)).toEqual(before);
		};

		const activated = pre(runtime, sessionId, "apply_patch", { patch: "root" });
		expect(denialReason(activated)).toContain("phase `awaiting_worker`");
		expect(denialReason(activated)).toContain("multi_agent_v1spawn_agent");
		repeated(denialReason(activated));

		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		const workerWait =
			'Forge phase `worker_running`; registered `forge-worker` target "worker-1" is active. Collect that target with one `multi_agent_v1wait_agent` call using `targets: ["worker-1"]` and `timeout_ms: 300000`.';
		repeated(workerWait);
		expect(workerWait).not.toContain("spawn_agent");

		stopAgent(runtime, sessionId, "worker-1", "forge-worker", "candidate");
		const reviewerSpawn = denialReason(
			pre(runtime, sessionId, "apply_patch", { patch: "root" }),
		);
		expect(reviewerSpawn).toContain("phase `awaiting_reviewer`");
		expect(reviewerSpawn).toContain('target "worker-1" completed');
		expect(reviewerSpawn).toContain('agent_type: "forge-reviewer"');
		repeated(reviewerSpawn);

		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		const reviewerWait =
			'Forge phase `reviewer_running`; registered `forge-reviewer` target "reviewer-1" is active. Collect that target with one `multi_agent_v1wait_agent` call using `targets: ["reviewer-1"]` and `timeout_ms: 300000`.';
		repeated(reviewerWait);
		expect(reviewerWait).not.toContain("spawn_agent");

		stopAgent(
			runtime,
			sessionId,
			"reviewer-1",
			"forge-reviewer",
			"finding\nFORGE_REVIEW_RESULT: fail",
		);
		const repair = denialReason(
			pre(runtime, sessionId, "apply_patch", { patch: "root" }),
		);
		expect(repair).toContain("phase `repair_worker`");
		expect(repair).toContain('target: "worker-1"');
		expect(repair).toContain("multi_agent_v1send_input");
		repeated(repair);

		pre(runtime, sessionId, "multi_agent_v1send_input", {
			target: "worker-1",
			message: "repair",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		repeated(
			'Forge phase `repair_worker`; registered `forge-worker` target "worker-1" is active. Collect that target with one `multi_agent_v1wait_agent` call using `targets: ["worker-1"]` and `timeout_ms: 300000`.',
		);
		stopAgent(runtime, sessionId, "worker-1", "forge-worker", "repaired");
		const recheck = denialReason(
			pre(runtime, sessionId, "apply_patch", { patch: "root" }),
		);
		expect(recheck).toContain("phase `awaiting_recheck`");
		expect(recheck).toContain('target: "reviewer-1"');
		repeated(recheck);
	});
	test("passes registered child mutations and audits reviewer observations", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-reviewed-child-mutation";
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
			"FORGE_REVIEW_RESULT: pass",
		);
		for (const child of [
			{ agent_id: "worker-1", agent_type: "forge-worker" },
			{ agent_id: "reviewer-1", agent_type: "forge-reviewer" },
		]) {
			expect(
				pre(
					runtime,
					sessionId,
					"apply_patch",
					{ patch: "late child mutation" },
					child,
				),
			).toBeNull();
			expect(state(runtime, sessionId).phase).toBe("reviewed");
		}
		const auditLog = readFileSync(audit(runtime, sessionId), "utf8");
		expect(auditLog.match(/reviewer_mutation_observation/g)).toHaveLength(1);
		const unknownChild = pre(
			runtime,
			sessionId,
			"Bash",
			{ command: "bun scripts/other.mjs" },
			{ agent_id: "debugger-1", agent_type: "forge-debugger" },
		);
		expect(unknownChild.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(denialReason(unknownChild)).toContain(
			"not the registered worker or reviewer",
		);
		expect(state(runtime, sessionId).phase).toBe("reviewed");
	});

	test("rejects a registered id presented with the wrong child role", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-child-role-mismatch";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(runtime, sessionId, "worker-1", "forge-worker", "candidate");
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
			"FORGE_REVIEW_RESULT: pass",
		);
		const denied = pre(
			runtime,
			sessionId,
			"apply_patch",
			{ patch: "forged role" },
			{ agent_id: "reviewer-1", agent_type: "forge-worker" },
		);
		expect(denied.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(denialReason(denied)).toContain(
			"not the registered worker or reviewer",
		);
		expect(state(runtime, sessionId).phase).toBe("reviewed");
	});
});
