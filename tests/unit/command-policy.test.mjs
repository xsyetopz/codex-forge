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
	test("adds code-discovery context on startup, resume, and clear", () => {
		for (const source of ["startup", "resume", "clear"]) {
			const output = JSON.parse(
				runHook(
					"hooks/session-start/provide-code-discovery-context.mjs",
					"SessionStart",
					{ source },
				).stdout,
			).hookSpecificOutput;
			expect(output.hookEventName).toBe("SessionStart");
			expect(output.additionalContext).toContain("codegraph_explore");
			expect(output.additionalContext).not.toContain("Communication boundary");
			expect(output.additionalContext).not.toContain("Routine preambles");
		}
	});
	test("ignores unknown session-start sources", () => {
		expect(
			runHook(
				"hooks/session-start/provide-code-discovery-context.mjs",
				"SessionStart",
				{ source: "unknown" },
			).stdout,
		).toBe("");
	});
	test("restores durable execution state after compaction", () => {
		const output = JSON.parse(
			runHook(
				"hooks/session-start/provide-code-discovery-context.mjs",
				"SessionStart",
				{ source: "compact" },
			).stdout,
		).hookSpecificOutput;
		expect(output.additionalContext).toContain("durable goal/plan");
		expect(output.additionalContext).toContain("process ids");
		expect(output.additionalContext).not.toContain("Communication boundary");
		expect(output.additionalContext).not.toContain(
			"post-tool/status narration",
		);
		expect(output.additionalContext).not.toContain("codegraph_explore");
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
	test("gives reviewers terminal completion guidance", () => {
		const output = JSON.parse(
			runHook(
				"hooks/subagent-start/provide-worker-boundary-context.mjs",
				"SubagentStart",
				{ agent_type: "forge-reviewer" },
			).stdout,
		).hookSpecificOutput;
		expect(output.additionalContext).toContain(
			"Record each unresolved question as a finding",
		);
		expect(output.additionalContext).toContain("FORGE_REVIEW_RESULT: pass");
		expect(output.additionalContext).toContain("FORGE_REVIEW_RESULT: fail");
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
	test("advisory exits cleanly when conservative shell parsing returns no tokens", () => {
		const result = runHook(
			"hooks/pre-tool-use/advise-efficient-tool-use.mjs",
			"PreToolUse",
			{
				tool_name: "shell",
				tool_input: { command: `echo "$(printf '\\"')"` },
			},
		);
		expect(result.status).toBe(0);
		expect(result.stdout).toBe("");
		expect(result.stderr).toBe("");
	});
	test("moves GitHub CLI cache writes to a sandbox-writable temporary path", () => {
		const original = "printf before; gh run view 123 --log";
		const output = JSON.parse(
			runHook("hooks/pre-tool-use/provide-sandbox-cache.mjs", "PreToolUse", {
				tool_name: "shell",
				tool_input: { command: original, timeout: 30 },
			}).stdout,
		).hookSpecificOutput;
		expect(output.permissionDecision).toBe("allow");
		expect(output.updatedInput.timeout).toBe(30);
		expect(output.updatedInput.command).toContain("XDG_CACHE_HOME=");
		expect(output.updatedInput.command).toEndWith(original);
	});
	test("does not rewrite unrelated or explicitly configured cache commands", () => {
		for (const command of [
			"git status --short",
			"XDG_CACHE_HOME=/tmp/custom gh run view 123 --log",
		])
			expect(
				runHook("hooks/pre-tool-use/provide-sandbox-cache.mjs", "PreToolUse", {
					tool_name: "shell",
					tool_input: { command },
				}).stdout,
			).toBe("");
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
		const contextDenied = JSON.parse(
			runHook(
				"hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs",
				"PreToolUse",
				{
					tool_name: "spawn_agent",
					tool_input: {
						message: "x",
						agent_type: "forge-worker",
						fork_context: true,
					},
				},
			).stdout,
		).hookSpecificOutput;
		expect(contextDenied.permissionDecisionReason).toContain(
			"`fork_context=false`",
		);
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
		const canonicalAllowed = runHook(
			"hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs",
			"PreToolUse",
			{
				tool_name: "spawn_agent",
				tool_input: {
					message: "x",
					agent_type: "forge-worker",
					fork_context: false,
				},
			},
		);
		expect(canonicalAllowed.stdout).toBe("");
		const legacyAllowed = runHook(
			"hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs",
			"PreToolUse",
			{
				tool_name: "multi_agent_v1.spawn_agent",
				tool_input: { message: "x", agent_type: "forge-worker" },
			},
		);
		expect(legacyAllowed.stdout).toBe("");
	});
	test("extends normal multi-agent waits while preserving their targets", () => {
		for (const timeout_ms of [undefined, 1000, 120000]) {
			const tool_input = { targets: ["agent-a", "agent-b"] };
			if (timeout_ms !== undefined) tool_input.timeout_ms = timeout_ms;
			const result = runHook(
				"hooks/pre-tool-use/provide-long-agent-wait.mjs",
				"PreToolUse",
				{ tool_name: "multi_agent_v1wait_agent", tool_input },
			);
			expect(result.status).toBe(0);
			const output = JSON.parse(result.stdout).hookSpecificOutput;
			expect(output.permissionDecision).toBe("allow");
			expect(output.updatedInput.targets).toEqual(["agent-a", "agent-b"]);
			expect(output.updatedInput.timeout_ms).toBe(300000);
		}
		for (const payload of [
			{
				tool_name: "multi_agent_v1wait_agent",
				tool_input: { targets: ["agent-a"], timeout_ms: 600000 },
			},
			{
				tool_name: "multi_agent_v1send_input",
				tool_input: { targets: ["agent-a"] },
			},
		])
			expect(
				runHook(
					"hooks/pre-tool-use/provide-long-agent-wait.mjs",
					"PreToolUse",
					payload,
				).stdout,
			).toBe("");
	});
	test("normalizes singular V1 wait ids into the targets schema", () => {
		for (const [field, timeout_ms, expectedTimeout] of [
			["agent_id", 1000, 300000],
			["agent_id", 600000, 600000],
			["target", 1000, 300000],
			["id", 1000, 300000],
		]) {
			const output = JSON.parse(
				runHook(
					"hooks/pre-tool-use/provide-long-agent-wait.mjs",
					"PreToolUse",
					{
						tool_name: "multi_agent_v1wait_agent",
						tool_input: { [field]: "agent-a", timeout_ms },
					},
				).stdout,
			).hookSpecificOutput.updatedInput;
			expect(output).toEqual({
				targets: ["agent-a"],
				timeout_ms: expectedTimeout,
			});
		}
		expect(
			runHook("hooks/pre-tool-use/provide-long-agent-wait.mjs", "PreToolUse", {
				tool_name: "multi_agent_v1wait_agent",
				tool_input: { agent_id: "agent-a", target: "agent-b" },
			}).stdout,
		).toBe("");
		for (const tool_input of [
			{ targets: ["agent-a"], target: "agent-b" },
			{ targets: ["agent-a", "agent-b"], id: "agent-a" },
			{ targets: ["agent-a", ""] },
			{ targets: ["agent-a", 1] },
		])
			expect(
				runHook(
					"hooks/pre-tool-use/provide-long-agent-wait.mjs",
					"PreToolUse",
					{ tool_name: "multi_agent_v1wait_agent", tool_input },
				).stdout,
			).toBe("");
		const normalized = JSON.parse(
			runHook("hooks/pre-tool-use/provide-long-agent-wait.mjs", "PreToolUse", {
				tool_name: "multi_agent_v1wait_agent",
				tool_input: {
					targets: [" agent-a ", "agent-a"],
					target: "agent-a",
					timeout_ms: 600000,
				},
			}).stdout,
		).hookSpecificOutput.updatedInput;
		expect(normalized).toEqual({
			targets: ["agent-a"],
			timeout_ms: 600000,
		});
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
