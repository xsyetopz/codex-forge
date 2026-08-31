import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
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
}

function state(runtime, sessionId) {
	return JSON.parse(
		readFileSync(join(runtime, `${sessionKey(sessionId)}.json`), "utf8"),
	);
}

describe("Forge observational handoffs", () => {
	test("records agents without imposing worker/reviewer order", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-handoff-"));
		const sessionId = "unordered-agents";
		hook(
			"subagent-start/provide-boundary-context.mjs",
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
			version: 3,
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
	});
});
