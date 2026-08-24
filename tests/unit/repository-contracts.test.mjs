import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { TOML, YAML } from "bun";

const ROOT = resolve(import.meta.dir, "../..");
const PLUGIN = join(ROOT, "plugins", "codex-forge");
const read = (path) => readFileSync(path, "utf8");

test("plugin, hooks, and MCP point at canonical MJS entrypoints", () => {
	const manifest = JSON.parse(
		read(join(PLUGIN, ".codex-plugin", "plugin.json")),
	);
	const hooks = JSON.parse(read(join(PLUGIN, "hooks", "hooks.json")));
	const mcp = JSON.parse(read(join(PLUGIN, ".mcp.json")));
	expect(manifest.version).toBe("0.1.0-alpha.2");
	expect(manifest.mcpServers).toBe("./.mcp.json");
	expect(existsSync(join(PLUGIN, "hooks.json"))).toBe(false);
	expect(Object.keys(hooks.hooks).sort()).toEqual([
		"PreToolUse",
		"SessionStart",
		"SubagentStart",
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
		'bun "$PLUGIN_ROOT/scripts/hooks/session-start/provide-code-discovery-context.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/enforce-safe-shell-commands.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/advise-efficient-tool-use.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/pre-tool-use/enforce-agent-spawn-boundaries.mjs"',
		'bun "$PLUGIN_ROOT/scripts/hooks/subagent-start/provide-worker-boundary-context.mjs"',
	]);
	expect(
		commands.every((command) =>
			/\/(?:advise|enforce|provide)-[a-z0-9-]+\.mjs"$/.test(command),
		),
	).toBe(true);
	expect(hooks.description).toBeTruthy();
	expect(hooks.hooks.PreToolUse.map((group) => group.matcher)).toEqual([
		"^Bash$",
		"^Agent$",
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

test("runtime Python compatibility surfaces are absent", () => {
	const walk = (directory) =>
		readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? walk(join(directory, entry.name))
				: [join(directory, entry.name)],
		);
	expect(
		walk(join(PLUGIN, "scripts")).filter((path) => path.endsWith(".py")),
	).toEqual([]);
	expect(read(join(ROOT, "README.md"))).not.toMatch(
		/python3|install\.py|validate_schemas/,
	);
	expect(existsSync(join(ROOT, "cf"))).toBe(false);
	expect(existsSync(join(ROOT, "bin"))).toBe(false);
});

test("instructions preserve root, child, batching, and evidence boundaries", () => {
	const instructions = read(join(PLUGIN, "assets", "model-instructions.md"));
	for (const marker of [
		"Every agent message to user begins with 🤖",
		"sole user-facing interface",
		"The root alone handles user messages and further delegation",
		"Promise.allSettled",
		"Ask one focused question only",
		"Treat every unrecognized change as user-owned",
		"repair the causal change immediately within the authorized scope",
		"Stay silent during routine",
		"codegraph_explore",
		"Load skills natively",
	])
		expect(instructions).toContain(marker);
});

test("README installation and validation commands match distributed entrypoints", () => {
	const readme = read(join(ROOT, "README.md"));
	for (const command of [
		"bun install.mjs install",
		"bun install.mjs doctor",
		"bun install.mjs revert",
		"bun install.mjs uninstall",
		"bun run validate:schemas",
		"bun test",
	])
		expect(readme).toContain(command);
	for (const path of [
		"docs/design-evidence.md",
		"docs/failure-controls.md",
		"docs/observational-evidence-2026-08-22.md",
	])
		expect(existsSync(join(ROOT, path))).toBe(true);
	const setup = read(join(PLUGIN, "skills", "forge-setup", "SKILL.md"));
	const lifecycle = read(
		join(PLUGIN, "skills", "forge-setup", "references", "managed-files.md"),
	);
	for (const document of [readme, setup, lifecycle]) {
		expect(document).toContain("/hooks");
		expect(document.toLowerCase()).toContain("trust");
	}
});

test("tool and policy sources retain bounded ownership", () => {
	const tools = read(join(PLUGIN, "scripts", "tools.mjs"));
	expect(tools).toContain("@colbymchenry/codegraph");
	expect(tools.indexOf('["bun"')).toBeLessThan(tools.indexOf('["pnpm"'));
	expect(tools.indexOf('["pnpm"')).toBeLessThan(tools.indexOf('["yarn"'));
	expect(tools.indexOf('["yarn"')).toBeLessThan(tools.indexOf('["npm"'));
	const rules = read(join(PLUGIN, "assets", "forge.rules"));
	expect(rules).not.toContain('prefix_rule(pattern=["git"], decision="allow"');
	expect(rules).toContain(
		'prefix_rule(pattern=["npm","publish"], decision="prompt"',
	);
	expect(rules).toContain(
		'prefix_rule(pattern=["git","push"], decision="prompt"',
	);
});

describe("skills", () => {
	const skillDirectories = readdirSync(join(PLUGIN, "skills"), {
		withFileTypes: true,
	})
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
	test("surface remains focused", () =>
		expect(skillDirectories).toHaveLength(7));
	for (const name of skillDirectories)
		test(`${name} is concise and indexable`, () => {
			const directory = join(PLUGIN, "skills", name);
			const skill = read(join(directory, "SKILL.md"));
			expect(skill).toContain(`name: ${name}`);
			expect(skill).toMatch(/description: Use this skill when\b/);
			expect(skill).toContain("## Workflow");
			expect(skill).toContain("## Gotchas");
			expect(skill.split("\n").length).toBeLessThanOrEqual(500);
			expect(existsSync(join(directory, "references", "index.md"))).toBe(false);
			const metadata = YAML.parse(
				read(join(directory, "agents", "openai.yaml")),
			);
			expect(metadata.interface.display_name).toBeTruthy();
			expect(metadata.interface.default_prompt).toContain(`$${name}`);
			for (const link of [...skill.matchAll(/\]\(([^)]+\.md)\)/g)].map(
				(match) => match[1],
			))
				expect(existsSync(join(directory, link))).toBe(true);
		});
	test("forge-skill-creator ships deterministic package tools", () => {
		for (const name of ["check-skill.mjs", "init-skill.mjs"])
			expect(
				existsSync(
					join(PLUGIN, "skills", "forge-skill-creator", "scripts", name),
				),
			).toBe(true);
	});
});

test("registered agent role contracts remain bounded", () => {
	const roles = readdirSync(join(PLUGIN, "agents")).filter((name) =>
		/^forge-.*\.toml$/.test(name),
	);
	expect(roles.length).toBeGreaterThanOrEqual(9);
	for (const name of roles) {
		const role = TOML.parse(read(join(PLUGIN, "agents", name)));
		expect(role.name).toBe(name.slice(0, -5));
		expect(role.developer_instructions).toBeTruthy();
		expect(role.service_tier).toBe("flex");
		expect(role.agents.enabled).toBe(false);
		expect(role.agents.max_depth).toBe(1);
	}
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-architect.toml"))).model,
	).toBe("gpt-5.6-sol");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-worker.toml"))).model,
	).toBe("gpt-5.6-luna");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-retriever.toml"))).model,
	).toBe("gpt-5.6-terra");
});
