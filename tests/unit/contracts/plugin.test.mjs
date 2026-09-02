import { expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PLUGIN, ROOT, read } from "./support.mjs";

test("plugin, hooks, and MCP point at canonical MJS entrypoints", () => {
	const manifest = JSON.parse(
		read(join(PLUGIN, ".codex-plugin", "plugin.json")),
	);
	const hooks = JSON.parse(read(join(PLUGIN, "hooks", "hooks.json")));
	const mcp = JSON.parse(read(join(PLUGIN, ".mcp.json")));
	expect(manifest.version).toBe("0.1.0-alpha.5");
	expect(manifest.mcpServers).toBe("./.mcp.json");
	expect(existsSync(join(PLUGIN, "hooks.json"))).toBe(false);
	expect(Object.keys(hooks.hooks).sort()).toEqual([
		"PreToolUse",
		"SessionEnd",
		"SessionStart",
		"SubagentStart",
		"SubagentStop",
		"UserPromptSubmit",
	]);
	const commands = Object.values(hooks.hooks)
		.flatMap((groups) =>
			groups.flatMap((group) =>
				Array.isArray(group.hooks) ? group.hooks : [],
			),
		)
		.filter((item) => item?.command)
		.map((item) => item.command);
	expect(
		commands.every(
			(command) =>
				command.startsWith('bun "$PLUGIN_ROOT/scripts/') &&
				command.includes(".mjs"),
		),
	).toBe(true);
	expect(commands).toEqual([
		'bun "$PLUGIN_ROOT/scripts/hooks/session-start/restore-continuity.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/user-prompt-submit/preserve-raw.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/subagent-start/record-agent-start.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/subagent-stop/record-handoff.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/session-end/clear-continuity.mjs"',
	]);
	for (const [eventName, groups] of Object.entries(hooks.hooks)) {
		const eventDirectory = eventName
			.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
			.toLowerCase();
		for (const group of groups)
			for (const hook of group.hooks) {
				const match = hook.command.match(
					/^bun "\$PLUGIN_ROOT\/scripts\/hooks\/([a-z0-9-]+)\/([a-z0-9-]+)\.mjs"$/,
				);
				expect(match).toBeTruthy();
				expect(match[1]).toBe(eventDirectory);
				expect(match[2]).not.toBe(eventDirectory);
			}
	}
	const hookFiles = readdirSync(join(PLUGIN, "scripts", "hooks"), {
		recursive: true,
		withFileTypes: true,
	})
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name));
	expect(hookFiles).toHaveLength(6);
	for (const path of hookFiles)
		expect(path).toMatch(/\/scripts\/hooks\/[a-z0-9-]+\/[a-z0-9-]+\.mjs$/);
	expect(hooks.description).toBeTruthy();
	expect(hooks.hooks.SessionStart).toHaveLength(1);
	expect(hooks.hooks.SessionStart[0].matcher).toBeUndefined();
	expect(hooks.hooks.SessionStart[0].hooks).toHaveLength(1);
	expect(hooks.hooks.SessionEnd[0].hooks[0].timeout).toBe(3);
	expect(hooks.hooks.UserPromptSubmit[0].hooks[0].additionalContextLimit).toBe(
		128,
	);
	expect(
		hooks.hooks.SubagentStart[0].hooks[0].additionalContextLimit,
	).toBeUndefined();
	expect(
		hooks.hooks.SessionStart[0].hooks[0].additionalContextLimit,
	).toBeGreaterThanOrEqual(256);
	expect(hooks.hooks.PreToolUse.map((group) => group.matcher)).toEqual([
		"^Agent$",
		"^multi_agent_v1(?:__|[._:-])?spawn_agent$",
	]);
	expect(existsSync(join(PLUGIN, "scripts", "hook.mjs"))).toBe(false);
	expect(
		existsSync(
			join(
				PLUGIN,
				"scripts",
				"hooks",
				"pre-tool-use",
				"block-dangerous-shell-commands.mjs",
			),
		),
	).toBe(false);
	expect(mcp.mcpServers.codegraph).toEqual({
		cwd: ".",
		command: "bun",
		args: ["./scripts/codegraph.mjs", "serve", "--mcp"],
	});
});

test("package and plugin metadata share the current release version", () => {
	const packageMetadata = JSON.parse(read(join(ROOT, "package.json")));
	const pluginManifest = JSON.parse(
		read(join(PLUGIN, ".codex-plugin", "plugin.json")),
	);
	expect(packageMetadata.version).toBe("0.1.0-alpha.5");
	expect(pluginManifest.version).toBe(packageMetadata.version);
});
