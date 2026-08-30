import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { PLUGIN, ROOT, read } from "./support.mjs";

test("plugin, hooks, and MCP point at canonical MJS entrypoints", () => {
	const manifest = JSON.parse(
		read(join(PLUGIN, ".codex-plugin", "plugin.json")),
	);
	const hooks = JSON.parse(read(join(PLUGIN, "hooks", "hooks.json")));
	const mcp = JSON.parse(read(join(PLUGIN, ".mcp.json")));
	expect(manifest.version).toBe("0.1.0-alpha.4");
	expect(manifest.mcpServers).toBe("./.mcp.json");
	expect(existsSync(join(PLUGIN, "hooks.json"))).toBe(false);
	expect(Object.keys(hooks.hooks).sort()).toEqual([
		"PreToolUse",
		"SessionEnd",
		"SessionStart",
		"Stop",
		"SubagentStart",
		"SubagentStop",
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
		'bun "$PLUGIN_ROOT/scripts/hooks/orchestration/session-start.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/session-start/provide-code-discovery-context.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/orchestration/pre-tool-use.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/provide-sandbox-cache.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/enforce-safe-shell-commands.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/advise-efficient-tool-use.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/provide-long-agent-wait.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/subagent-start/provide-worker-boundary-context.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/orchestration/subagent-start.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/orchestration/subagent-stop.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/orchestration/stop.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/orchestration/session-end.mjs"',
	]);
	expect(commands.every((command) => /\/[a-z0-9-]+\.mjs"$/.test(command))).toBe(
		true,
	);
	expect(hooks.description).toBeTruthy();
	expect(hooks.hooks.SessionStart).toHaveLength(1);
	expect(hooks.hooks.SessionStart[0].matcher).toBeUndefined();
	expect(hooks.hooks.SessionStart[0].hooks).toHaveLength(2);
	expect(hooks.hooks.SessionEnd[0].hooks[0].timeout).toBe(3);
	expect(
		hooks.hooks.SessionStart[0].hooks[1].additionalContextLimit,
	).toBeGreaterThanOrEqual(256);
	expect(hooks.hooks.PreToolUse.map((group) => group.matcher)).toEqual([
		"*",
		"^Bash$",
		"^Agent$",
		"^multi_agent_v1wait_agent$",
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
	expect(packageMetadata.version).toBe("0.1.0-alpha.4");
	expect(pluginManifest.version).toBe(packageMetadata.version);
});
