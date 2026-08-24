import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { dangerousShellCommandReason } from "../../plugins/codex-forge/scripts/hooks/pre-tool-use/classify-dangerous-shell-command.mjs";
import { commandText } from "../../plugins/codex-forge/scripts/hooks/pre-tool-use/shell-command.mjs";
import cases from "../fixtures/command-policy.json";

const ROOT = resolve(import.meta.dir, "../..");
const plugin = resolve(ROOT, "plugins/codex-forge");

function runHook(script, event, payload) {
	const result = spawnSync("bun", [resolve(plugin, "scripts", script)], {
		input: JSON.stringify({ hook_event_name: event, ...payload }),
		encoding: "utf8",
	});
	return {
		status: result.status,
		stdout: result.stdout.trim(),
		stderr: result.stderr,
	};
}

describe("dangerous command policy", () => {
	for (const command of cases.direct_dangerous)
		test(`denies ${command}`, () =>
			expect(dangerousShellCommandReason(command)).toBeTruthy());
	for (const command of cases.direct_safe)
		test(`allows ${command}`, () =>
			expect(dangerousShellCommandReason(command)).toBeNull());
	for (const payload of cases.dangerous_cases)
		test(`hook denies ${commandText(payload)}`, () => {
			const result = runHook(
				"hooks/pre-tool-use/enforce-safe-shell-commands.mjs",
				"PreToolUse",
				payload,
			);
			expect(result.status).toBe(0);
			const decision = JSON.parse(result.stdout).hookSpecificOutput;
			expect(decision.permissionDecision).toBe("deny");
			expect(decision.permissionDecisionReason).toContain("scoped, reversible");
		});
	for (const command of cases.git_clean_dry_runs)
		test(`allows dry-run ${command}`, () => {
			expect(
				runHook(
					"hooks/pre-tool-use/enforce-safe-shell-commands.mjs",
					"PreToolUse",
					{
						tool_name: "shell",
						tool_input: { command },
					},
				).stdout,
			).toBe("");
		});
	for (const [command, expected] of cases.pipeline_reasons)
		test(`attributes ${command}`, () =>
			expect(dangerousShellCommandReason(command)).toBe(expected));
	for (const payload of cases.safe_payloads)
		test(`hook allows safe payload ${JSON.stringify(payload)}`, () => {
			expect(
				runHook(
					"hooks/pre-tool-use/enforce-safe-shell-commands.mjs",
					"PreToolUse",
					payload,
				).stdout,
			).toBe("");
		});
});

describe("lifecycle hook", () => {
	test("adds session routing context", () => {
		const output = JSON.parse(
			runHook(
				"hooks/session-start/provide-code-discovery-context.mjs",
				"SessionStart",
				{},
			).stdout,
		).hookSpecificOutput;
		expect(output.hookEventName).toBe("SessionStart");
		expect(output.additionalContext).toContain("codegraph_explore");
	});
	test("adds the worker boundary for subagents", () => {
		const output = JSON.parse(
			runHook(
				"hooks/subagent-start/provide-worker-boundary-context.mjs",
				"SubagentStart",
				{},
			).stdout,
		).hookSpecificOutput;
		expect(output.hookEventName).toBe("SubagentStart");
		expect(output.additionalContext).toContain("leave further delegation");
	});
	test("advises bounded search without denying it", () => {
		const output = JSON.parse(
			runHook(
				"hooks/pre-tool-use/advise-efficient-tool-use.mjs",
				"PreToolUse",
				{
					tool_name: "shell",
					tool_input: { command: ["grep", "-R", "Thing", "."] },
				},
			).stdout,
		).hookSpecificOutput;
		expect(output.additionalContext).toContain("bounded");
		expect(output.permissionDecision).toBeUndefined();
	});
	test("requires registered, no-context root children", () => {
		const denied = JSON.parse(
			runHook(
				"hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs",
				"PreToolUse",
				{
					tool_name: "spawn_agent",
					tool_input: { message: "x" },
				},
			).stdout,
		).hookSpecificOutput;
		expect(denied.permissionDecision).toBe("deny");
		const allowed = runHook(
			"hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs",
			"PreToolUse",
			{
				tool_name: "spawn_agent",
				tool_input: {
					message: "x",
					agent_type: "forge-worker",
					fork_turns: "none",
				},
			},
		);
		expect(allowed.stdout).toBe("");
	});
	test("denies Forge grandchildren", () => {
		const result = runHook(
			"hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs",
			"PreToolUse",
			{
				agent_id: "forge-worker/child",
				tool_name: "spawn_agent",
				tool_input: {
					message: "nested",
					agent_type: "forge-scout",
					fork_turns: "none",
				},
			},
		);
		expect(
			JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,
		).toBe("deny");
	});
});
