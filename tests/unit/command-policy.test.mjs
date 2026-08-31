import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");
const PLUGIN = resolve(ROOT, "plugins/codex-forge");

function runHook(path, event, payload) {
	return spawnSync("bun", [resolve(PLUGIN, "scripts/hooks", path)], {
		input: JSON.stringify({ hook_event_name: event, ...payload }),
		encoding: "utf8",
	});
}

function decision(result) {
	return result.stdout.trim()
		? JSON.parse(result.stdout).hookSpecificOutput
		: null;
}

describe("focused hook policy", () => {
	test("native close, wait, and send tools have no Forge pre-tool matcher", () => {
		const hooks = JSON.parse(
			readFileSync(resolve(PLUGIN, "hooks/hooks.json"), "utf8"),
		);
		const matchers = hooks.hooks.PreToolUse.map((group) => group.matcher);
		expect(
			matchers.some((matcher) =>
				/close_agent|wait_agent|send_input/.test(matcher),
			),
		).toBe(false);
	});

	test("session-start restores continuity and reports CodeGraph availability", () => {
		const cwd = mkdtempSync(resolve(tmpdir(), "forge-codegraph-index-"));
		mkdirSync(resolve(cwd, ".codegraph"));
		const result = runHook(
			"session-start/restore-continuity.mjs",
			"SessionStart",
			{
				session_id: "indexed",
				source: "startup",
				cwd,
			},
		);
		expect(result.status).toBe(0);
		expect(decision(result).additionalContext).toContain("CodeGraph first");
	});

	test("subagent-start emits a bounded role contract", () => {
		const result = runHook(
			"subagent-start/provide-boundary-context.mjs",
			"SubagentStart",
			{
				session_id: "review",
				agent_id: "review-1",
				agent_type: "forge-reviewer",
			},
		);
		expect(result.status).toBe(0);
		expect(decision(result).additionalContext).toContain("pass/fail verdict");
	});
});
