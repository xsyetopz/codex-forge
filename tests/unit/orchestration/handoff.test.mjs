import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sessionKey } from "../../../plugins/codex-forge/scripts/lib/continuity-state.mjs";

const ROOT = resolve(import.meta.dir, "../../..");
const PLUGIN = join(ROOT, "plugins", "codex-forge");

function hook(path, event, payload, runtime) {
	const result = spawnSync("bun", [join(PLUGIN, "scripts", "hooks", path)], {
		cwd: ROOT,
		env: { ...process.env, CODEX_FORGE_RUNTIME_DIR: runtime },
		input: JSON.stringify({ hook_event_name: event, ...payload }),
		encoding: "utf8",
	});
	expect(result.status).toBe(0);
	return result;
}

function state(runtime, sessionId) {
	return JSON.parse(
		readFileSync(join(runtime, `${sessionKey(sessionId)}.json`), "utf8"),
	);
}

describe("Forge orchestration state", () => {
	test("records agents without imposing worker/reviewer order", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-handoff-"));
		const sessionId = "unordered-agents";
		hook(
			"subagent-start/record-agent-start.mjs",
			"SubagentStart",
			{
				session_id: sessionId,
				agent_id: "review-1",
				agent_type: "forge-reviewer",
			},
			runtime,
		);
		hook(
			"subagent-stop/record-handoff.mjs",
			"SubagentStop",
			{
				session_id: sessionId,
				agent_id: "review-1",
				agent_type: "forge-reviewer",
				last_assistant_message: "review stopped at user request",
			},
			runtime,
		);
		expect(state(runtime, sessionId)).toMatchObject({
			version: 4,
			spawn_admissions: [],
			agents: [
				{
					id: "review-1",
					role: "forge-reviewer",
					status: "stopped",
					handoff: "review stopped at user request",
				},
			],
		});
		expect(state(runtime, sessionId)).not.toHaveProperty("lifecycle");
		const restored = hook(
			"session-start/restore-continuity.mjs",
			"SessionStart",
			{
				session_id: sessionId,
				source: "resume",
				cwd: runtime,
			},
			runtime,
		);
		const context = JSON.parse(restored.stdout).hookSpecificOutput
			.additionalContext;
		expect(context).toContain(
			"Child handoffs are bounded evidence and recommendations",
		);
		expect(context).toContain("Root coordination retains the active Goal");
	});

	test("admits at most six children and one reviewer class pass per thread", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-admissions-"));
		const sessionId = "bounded-admissions";
		const spawn = (toolUseId, role) =>
			hook(
				"pre-tool-use/enforce-agent-control-boundaries.mjs",
				"PreToolUse",
				{
					session_id: sessionId,
					tool_use_id: toolUseId,
					tool_name: "multi_agent_v1spawn_agent",
					tool_input: { agent_type: role, fork_context: false },
				},
				runtime,
			);
		const decision = (result) =>
			result.stdout.trim()
				? JSON.parse(result.stdout).hookSpecificOutput
				: null;

		for (const [id, role] of [
			["worker-1", "forge-worker"],
			["worker-2", "forge-worker"],
			["review-1", "forge-reviewer"],
			["tail-1", "forge-tail-reviewer"],
			["direct-1", "forge-direct"],
			["retriever-1", "forge-retriever"],
		])
			expect(decision(spawn(id, role))).toBeNull();

		expect(decision(spawn("review-2", "forge-reviewer"))).toMatchObject({
			permissionDecision: "deny",
		});
		expect(
			decision(spawn("worker-3", "forge-worker")).permissionDecisionReason,
		).toContain("admission budget reached");
		expect(state(runtime, sessionId).spawn_admissions).toHaveLength(6);
	});

	test("deduplicates repeated PreToolUse delivery by tool_use_id", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-admission-dedupe-"));
		const payload = {
			session_id: "dedupe",
			tool_use_id: "same-call",
			tool_name: "multi_agent_v1spawn_agent",
			tool_input: { agent_type: "forge-worker", fork_context: false },
		};
		hook(
			"pre-tool-use/enforce-agent-control-boundaries.mjs",
			"PreToolUse",
			payload,
			runtime,
		);
		hook(
			"pre-tool-use/enforce-agent-control-boundaries.mjs",
			"PreToolUse",
			payload,
			runtime,
		);
		expect(state(runtime, "dedupe").spawn_admissions).toHaveLength(1);
	});

	test("upgrades version 3 continuity state and preserves prior review usage", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-admission-upgrade-"));
		const sessionId = "upgrade-v3";
		const now = Date.now();
		writeFileSync(
			join(runtime, `${sessionKey(sessionId)}.json`),
			`${JSON.stringify({
				version: 3,
				agents: [
					{
						id: "legacy-review",
						role: "forge-reviewer",
						status: "stopped",
						started_at: now,
						updated_at: now,
					},
				],
				created_at: now,
				updated_at: now,
			})}\n`,
			{ mode: 0o600 },
		);
		const result = hook(
			"pre-tool-use/enforce-agent-control-boundaries.mjs",
			"PreToolUse",
			{
				session_id: sessionId,
				tool_use_id: "second-review",
				tool_name: "multi_agent_v1spawn_agent",
				tool_input: {
					agent_type: "forge-reviewer",
					fork_context: false,
				},
			},
			runtime,
		);
		expect(
			JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,
		).toBe("deny");
		expect(state(runtime, sessionId)).toMatchObject({
			version: 4,
			spawn_admissions: [
				{
					tool_use_id: "legacy:legacy-review",
					role: "forge-reviewer",
				},
			],
		});
	});
});
