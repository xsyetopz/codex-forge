import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmodSync,
	cpSync,
	existsSync,
	mkdtempSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { TOML, YAML } from "bun";
import { forgeCatalogSatisfiesContract } from "../../plugins/codex-forge/scripts/installer/catalog.mjs";

const ROOT = resolve(import.meta.dir, "../..");
const PLUGIN = join(ROOT, "plugins", "codex-forge");
const read = (path) => readFileSync(path, "utf8");

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

test("model instructions stay lean and preserve unique base invariants", () => {
	const instructions = read(
		join(PLUGIN, "assets", "developer-instructions.txt"),
	);
	const modelInstructions = read(
		join(PLUGIN, "assets", "model-instructions.md"),
	);
	const compactPrompt = read(join(PLUGIN, "assets", "compact-prompt.md"));
	for (const marker of [
		"Codex Forge is active",
		"User-supplied `$forge-*` selectors activate their skills through Codex",
		"Root orchestration governs engineering work",
		"for a bounded repository change with explicit acceptance criteria",
		"assign one `forge-worker` the task statement and checkout as its complete workstream for reconnaissance and implementation",
		"pass the acceptance criteria and worker evidence to one active `forge-reviewer` for a first focused pass covering the full acceptance set",
		"Keep that reviewer active for follow-up passes",
		"after each worker repair, pass the repaired finding and mechanically affected contract paths to the same reviewer",
		"the reviewer verifies those paths and returns remaining failures",
		"Completion follows reviewer evidence that every acceptance criterion passes",
		"The normal active set is the smallest set that keeps independent work moving",
		"2-4 active agents is the ordinary range",
		"genuinely independent read-heavy or mechanically sharded work can expand toward 5-8",
		"The runtime ceiling is eight concurrently open spawned-agent threads beyond the primary",
		"Serialize lanes with shared-write overlap, sequential dependencies, validation or I/O bottlenecks, or expensive Sol work",
		"preserving the one-worker/one-reviewer contract",
		"the same reviewer reused for follow-ups",
		"collect it, integrate its evidence, and close completed workers or other integrated agents promptly",
		"keep the designated forge-reviewer open through repair follow-ups",
		"reuse that reviewer for each recheck",
		"close it with `multi_agent_v1close_agent` after final acceptance",
		"bounded deterministic or high-volume execution to registered forge-worker, forge-direct, forge-hard-worker, or forge-scout roles on Luna",
		"retrieval and read-heavy balanced analysis to forge-retriever on Terra",
		"architecture, ambiguous debugging, and semantic review to forge-architect, forge-debugger, forge-reviewer, or forge-tail-reviewer on Sol",
		"Prefer registered Forge roles over raw model overrides",
		"returns capacity to the eight-slot ceiling",
		"Independent workstreams use their owning registered Forge roles",
		"unresolved semantic choices escalate to `forge-architect`",
		"Registered Forge roles are available through normal legacy multi-agent collaboration tools",
		"Invoke each role directly by its registered name; configured role paths are runtime-managed role definitions",
		"Pinned benchmark tasks use exactly the task statement and checkout as acceptance evidence",
		"Other acceptance whose contract depends on current upstream behavior uses current external research as its evidence source",
		"Fresh-context children use `fork_context=false`",
		"Collect each active agent set with one long multi-agent wait",
		"Each returned V1 target remains current-thread state",
		"close it with `multi_agent_v1close_agent` after final acceptance",
		"`multi_agent_v1send_input` with `interrupt=true`",
		"Each returned exec session ID remains current-thread state",
		"use `write_stdin` for polling and TTY interaction",
		"terminate stale owned processes through that identifier when required",
		"Direct root execution fits one exact operation with an immediate oracle",
		"model-visible tool rounds as expensive",
		"batch independent calls inside one programmatic call",
		"Honor deterministic Forge hook denials and rules",
	])
		expect(instructions).toContain(marker);
	const workerAssignment =
		"assign one `forge-worker` the task statement and checkout as its complete workstream for reconnaissance and implementation";
	const reviewerAssignment =
		"pass the acceptance criteria and worker evidence to one active `forge-reviewer` for a first focused pass covering the full acceptance set";
	expect(instructions.match(/assign one `forge-worker`/g)).toHaveLength(1);
	expect(instructions.match(/one active `forge-reviewer`/g)).toHaveLength(1);
	expect(instructions.match(/`forge-reviewer`/g)).toHaveLength(1);
	const routingMarkers = [
		workerAssignment,
		reviewerAssignment,
		"The normal active set is the smallest set that keeps independent work moving",
		"The runtime ceiling is eight concurrently open spawned-agent threads beyond the primary",
		"Prefer registered Forge roles over raw model overrides",
	];
	const routingPositions = routingMarkers.map((marker) => {
		const position = instructions.indexOf(marker);
		expect(position).toBeGreaterThanOrEqual(0);
		return position;
	});
	for (let index = 0; index < routingPositions.length - 1; index += 1)
		expect(routingPositions[index]).toBeLessThan(routingPositions[index + 1]);
	const lifecycleMarkers = [
		"collect it, integrate its evidence, and close completed workers or other integrated agents promptly",
		"keep the designated forge-reviewer open through repair follow-ups",
		"reuse that reviewer for each recheck",
		"close it with `multi_agent_v1close_agent` after final acceptance",
	];
	const lifecyclePositions = lifecycleMarkers.map((marker) => {
		const position = instructions.indexOf(marker);
		expect(position).toBeGreaterThanOrEqual(0);
		return position;
	});
	for (let index = 0; index < lifecyclePositions.length - 1; index += 1)
		expect(lifecyclePositions[index]).toBeLessThan(
			lifecyclePositions[index + 1],
		);
	expect(instructions).toContain(
		"Keep that reviewer active for follow-up passes",
	);
	expect(instructions).toContain(
		"after each worker repair, pass the repaired finding and mechanically affected contract paths to the same reviewer",
	);
	expect(instructions).toContain("the same reviewer");
	expect(instructions).toContain("returns remaining failures");
	expect(instructions).toContain(
		"Pinned benchmark tasks use exactly the task statement and checkout as acceptance evidence",
	);
	expect(instructions).toContain(
		"Other acceptance whose contract depends on current upstream behavior uses current external research as its evidence source",
	);
	expect(instructions).not.toContain(
		"For pinned benchmark tasks, the complete acceptance evidence set is the task statement and checkout",
	);
	expect(instructions).not.toContain(
		"For acceptance that depends on current upstream behavior, current external research is the evidence source",
	);
	expect(
		instructions.indexOf(
			"Pinned benchmark tasks use exactly the task statement and checkout as acceptance evidence",
		),
	).toBeLessThan(
		instructions.indexOf(
			"Other acceptance whose contract depends on current upstream behavior uses current external research as its evidence source",
		),
	);
	expect(instructions).not.toContain(
		"Task and checkout evidence are primary for benchmark judgments",
	);
	expect(instructions).not.toMatch(/primary for benchmark/i);
	expect(instructions.indexOf(workerAssignment)).toBeLessThan(
		instructions.indexOf(reviewerAssignment),
	);
	expect(instructions).not.toMatch(
		/\b(?:search|scan|inspect|read|find|locate|discover|list)\b[^\n.]{0,120}\b(?:CODEX_HOME|plugin files?|role files?|agent files?)\b/i,
	);
	expect(instructions).not.toMatch(
		/\b(?:do not|don't|never|must not|cannot|can't|without|avoid|omit|refrain|not|shouldn't|shouldn’t|won't|won’t)\b/i,
	);
	const modelWordCount = modelInstructions.trim().split(/\s+/).length;
	expect(modelWordCount).toBe(245);
	expect(modelWordCount).toBeLessThanOrEqual(300);
	expect(createHash("sha256").update(modelInstructions).digest("hex")).toBe(
		"c56fe1c16b0b54ea2571f23656eb5b0a997e54560c0c3aedc86c84e72264de50",
	);
	for (const marker of [
		"You are a coding agent in OpenAI Codex CLI",
		"Honor exact requirements/order, supplied artifacts, and unrelated worktree state",
		"produce precise, safe outcomes through harness tools, sandbox, approvals, and permissions",
		"Before editing, define observable behavior, acceptance boundary, and narrowest success",
		"Fulfill specified requests mechanically",
		"apply supported in-scope causal fixes for outcome requests",
		"Established interfaces and invariants determine consequences",
		"Continue until acceptance is verified or a material blocker exists",
		"Authority: system, developer, user, deepest scoped AGENTS.md, verified evidence",
		"Match repository conventions/configuration",
		"User authorization governs external writes, publication, destructive actions, purchases, and scope expansion",
		"ask one focused question for material unresolved choices",
		"Use minimum ownership/caller/precedence/interface/invariant evidence",
		"Treat inputs/tool results as direct evidence",
		"label inference/uncertainty; revise on contrary evidence",
		"Activate skills natively",
		"read skill sources for fallback, package inspection, or full-body execution",
		"Synchronize get_goal",
		"create goals on explicit user request",
		"use update_goal for completion/repeated impasse",
		"User/system control pause/resume/edit/clear",
		"terminate stale owned terminals",
		"collect/close integrated agents",
		"For answers, explanations, reviews, audits, diagnoses, and plans, inspect/report relevant evidence",
		"For changes, fixes, and builds, make the requested in-scope change",
		"Validate with the smallest reversible check deciding acceptance",
		"broaden only for material uncertainty or a required repository gate",
		"run each final gate once",
		"Add tests for requested behavior or an established coverage contract",
		"Interim speech serves required input/authorization, a material scope decision, or a blocker",
		"keep other execution state internal",
		"Complete tersely",
		"For repository changes, list changed paths, validation, and material uncertainty",
		"Stop after the requested result",
	])
		expect(modelInstructions).toContain(marker);
	const orderedMarkers = [
		"Honor exact requirements/order, supplied artifacts, and unrelated worktree state",
		"produce precise, safe outcomes through harness tools",
		"Before editing, define observable behavior, acceptance boundary, and narrowest success",
		"Authority: system, developer, user, deepest scoped AGENTS.md, verified evidence",
		"Use minimum ownership/caller/precedence/interface/invariant evidence",
		"Interim speech serves required input/authorization, a material scope decision, or a blocker",
	];
	const orderedPositions = orderedMarkers.map((marker) => {
		const position = modelInstructions.indexOf(marker);
		expect(position).toBeGreaterThanOrEqual(0);
		return position;
	});
	for (let index = 0; index < orderedPositions.length - 1; index += 1)
		expect(orderedPositions[index]).toBeLessThan(orderedPositions[index + 1]);
	expect(modelInstructions.endsWith("\n")).toBe(true);
	expect(modelInstructions).not.toMatch(
		/\b(?:do not|don't|never|must not|cannot|can't|without|avoid|omit|refrain|not|shouldn't|shouldn’t|won't|won’t)\b/i,
	);
	for (const duplicate of [
		"Codex Forge",
		"forge-worker",
		"forge-reviewer",
		"forge-architect",
		"multi-agent",
		"orchestration",
		"CodeGraph",
		"codegraph_explore",
		"codegraph_node",
		"Promise.allSettled",
		"tool_output_token_limit",
		"text.verbosity",
		"Title Case",
		"test ladder",
		"Final-answer",
		"rg",
		"fd",
		"jq",
		"ast-grep",
		"apply_patch",
		"preamble",
		"friendly",
		"personality",
		"collaborative",
		"next step",
		"next steps",
		"confidence",
		"start as specific as possible",
		"relevant non-destructive validation",
		"broader tests",
		"markdown",
		"model_instructions_file",
	])
		expect(modelInstructions.toLowerCase()).not.toContain(
			duplicate.toLowerCase(),
		);
	const compactWordCount = compactPrompt.trim().split(/\s+/).length;
	expect(compactWordCount).toBe(100);
	expect(compactWordCount).toBeLessThanOrEqual(110);
	for (const marker of [
		"self-contained execution checkpoint",
		"direct continuation of the current task",
		"correctness-critical literals",
		"goal status/budget",
		"validation ceiling",
		"current-thread process/session/cell IDs",
		"CodeGraph/search evidence",
		"child ownership/results/work/verification",
		"Current worktree/tool evidence wins",
		"pending, partial, failed, proposed, conflicting, unverified state",
		"Compress filler, narration, duplicates, raw output",
		"Output execution state",
	])
		expect(compactPrompt).toContain(marker);
	expect(compactPrompt.endsWith("\n")).toBe(true);
	const config = read(join(PLUGIN, "scripts", "installer", "config.mjs"));
	expect(config).toContain("model_instructions_file");
	expect(config).toContain("model_catalog_json");
	expect(existsSync(join(PLUGIN, "assets", "model-instructions.md"))).toBe(
		true,
	);
	expect(existsSync(join(PLUGIN, "assets", "model-catalog.json"))).toBe(true);
});

test("config template keeps agent defaults and app policy in their owning tables", () => {
	const template = read(join(PLUGIN, "assets", "config-template.toml"));
	const rendered = template
		.replace("@DEVELOPER_INSTRUCTIONS@", JSON.stringify("Forge"))
		.replace("@MODEL_INSTRUCTIONS@", "/tmp/model.md")
		.replace("@MODEL_CATALOG@", "/tmp/model-catalog.json")
		.replace("@COMPACT_PROMPT@", "/tmp/compact.md");
	const parsed = TOML.parse(rendered);
	expect(parsed.agents.default_subagent_model).toBe("gpt-5.6-luna");
	expect(parsed.plan_mode_reasoning_effort).toBe("medium");
	expect(parsed.agents.default_subagent_reasoning_effort).toBe("medium");
	expect(parsed.agents.max_concurrent_threads_per_session).toBe(8);
	expect(parsed.agents.max_depth).toBe(1);
	expect(parsed.agents["forge-worker"]).toBeUndefined();
	expect(parsed.apps._default.default_tools_approval_mode).toBe("writes");
	expect(parsed.apps._default.default_subagent_model).toBeUndefined();
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
		"AGENTS.md",
		"CONTRIBUTING.md",
		"Justfile",
		"docs/reinstall-recovery.md",
		"docs/design-evidence.md",
		"docs/failure-controls.md",
		"docs/observational-evidence-2026-08-22.md",
		"docs/model-instruction-audit-2026-08-24.md",
		"docs/context-compaction-2026-08-24.md",
	])
		expect(existsSync(join(ROOT, path))).toBe(true);
	const recovery = read(join(ROOT, "docs/reinstall-recovery.md"));
	const packagedRecovery = read(
		join(PLUGIN, "skills", "forge-setup", "references", "reinstall-recovery.md"),
	);
	for (const command of [
		"bun install.mjs install --purge-cache",
		"bun install.mjs doctor --purge-cache",
		"bun install.mjs doctor --json",
		"osascript -e 'tell application \"Codex Proxy\" to quit'",
		"kill -TERM <stale-pid>",
		"kill -KILL <stale-pid>",
		"/hooks",
		"multi_agent_v1spawn_agent",
		"multi_agent_v1wait_agent",
		"multi_agent_v1close_agent",
		"multi_agent_v1send_input",
	])
		expect(recovery).toContain(command);
		expect(recovery).toContain("Run recovery commands from a separate macOS Terminal window");
	expect(recovery).toContain("c.models?.some");
	expect(recovery).toContain('export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"');
	expect(
		forgeCatalogSatisfiesContract(join(PLUGIN, "assets", "model-catalog.json")),
	).toBe(true);
	expect(recovery).not.toContain("multi_agent_version = \"v1\"");
	expect(recovery).not.toContain("use_responses_lite = false");
	const defaultHome = mkdtempSync(join(tmpdir(), "forge-recovery-contract-"));
	try {
		mkdirSync(join(defaultHome, ".codex", "forge"), { recursive: true });
		cpSync(
			join(PLUGIN, "assets", "model-catalog.json"),
			join(defaultHome, ".codex", "forge", "model-catalog.json"),
		);
		const defaultPathSetup = 'export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"';
		const verificationCommand = recovery.match(/node -e '([^']+)'/)?.[0];
		expect(defaultPathSetup).toBeTruthy();
		expect(verificationCommand).toBeTruthy();
		const verification = spawnSync(
			"sh",
			["-eu", "-c", `unset CODEX_HOME\n${defaultPathSetup}\n${verificationCommand}`],
			{
			env: { ...process.env, HOME: defaultHome },
			encoding: "utf8",
			},
		);
		expect(verification.status).toBe(0);
	expect(verification.stdout).toContain("Forge V1 catalog: ok");
	} finally {
		rmSync(defaultHome, { recursive: true, force: true });
	}
	for (const marker of [
		"osascript -e",
		"kill -TERM <stale-pid>",
		"export CODEX_HOME=",
		"multi_agent_v1spawn_agent",
		"multi_agent_v1wait_agent",
		"multi_agent_v1close_agent",
	])
		expect(packagedRecovery).toContain(marker);
	expect(packagedRecovery).toContain(
		"bun install.mjs install --purge-cache",
	);
	expect(packagedRecovery).toContain("just reinstall-purge-cache");
	expect(packagedRecovery).toContain("never an upgrade source");
	expect(packagedRecovery).not.toContain(
		'bun "$PLUGIN_ROOT/scripts/install.mjs" install',
	);
	expect(packagedRecovery).toContain(
		'bun "$PLUGIN_ROOT/scripts/install.mjs" doctor --purge-cache',
	);
	for (const marker of [
		"model_catalog_json",
		"model_instructions_file",
		"multi_agent_v2",
		'\"multi_agent_version\": \"v1\"',
		'\"use_responses_lite\": false',
	])
		expect(packagedRecovery).toContain(marker);
	const sourceBlock = recovery.match(/```sh\n(FORGE_CHECKOUT[\s\S]*?)```/)?.[1];
	const sourceSequenceHome = mkdtempSync(join(tmpdir(), "forge-source-contract-"));
	try {
		const fakeBin = join(sourceSequenceHome, "bin");
		const fakeCheckout = join(sourceSequenceHome, "checkout");
		const log = join(sourceSequenceHome, "bun.log");
		mkdirSync(fakeBin, { recursive: true });
		mkdirSync(fakeCheckout, { recursive: true });
		writeFileSync(join(fakeCheckout, "install.mjs"), "fixture");
		const fakeBun = join(fakeBin, "bun");
		writeFileSync(fakeBun, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$FORGE_LOG"\n');
		chmodSync(fakeBun, 0o755);
		const sourceScript = sourceBlock.replace(
			'FORGE_CHECKOUT="/path/to/current/codex-forge"',
			`FORGE_CHECKOUT="${fakeCheckout}"`,
		);
		expect(sourceBlock).toBeTruthy();
		expect(sourceBlock).not.toContain("PLUGIN_ROOT");
		const sequence = spawnSync("sh", ["-eu", "-c", `unset PLUGIN_ROOT\n${sourceScript}`], {
			env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}`, FORGE_LOG: log },
			encoding: "utf8",
		});
		expect(sequence.status).toBe(0);
		expect(readFileSync(log, "utf8")).toContain("install.mjs install --purge-cache");
		expect(readFileSync(log, "utf8")).toContain("install.mjs doctor --json");
	} finally {
		rmSync(sourceSequenceHome, { recursive: true, force: true });
	}
	const packagedLines = packagedRecovery.split("\n");
	const resolverStart = packagedLines.findIndex((line) =>
		line.startsWith("INSTALLED_VERSION=\"$(node -e"),
	);
	const resolverEnd = packagedLines.findIndex(
		(line, index) => index > resolverStart && line === "export PLUGIN_ROOT",
	);
	const resolver = packagedLines.slice(resolverStart, resolverEnd).join("\n");
	expect(resolverStart).toBeGreaterThan(-1);
	expect(resolverEnd).toBeGreaterThan(resolverStart);
	const resolverHome = mkdtempSync(join(tmpdir(), "forge-root-contract-"));
	try {
		const installedRoot = join(
			resolverHome,
			"plugins",
			"cache",
			"codex-forge-marketplace",
			"codex-forge",
			"0.1.0-alpha.4",
		);
		mkdirSync(join(resolverHome, "forge"), { recursive: true });
		writeFileSync(
			join(resolverHome, "forge", "install-state.json"),
			JSON.stringify({ plugin_version: "0.1.0-alpha.4" }),
		);
		mkdirSync(join(installedRoot, "skills", "forge-setup", "references"), {
			recursive: true,
		});
		mkdirSync(join(installedRoot, "scripts"), { recursive: true });
		mkdirSync(join(installedRoot, ".codex-plugin"), { recursive: true });
		mkdirSync(
			join(
				resolverHome,
				"plugins",
				"cache",
				"stale-marketplace",
				"codex-forge",
				"0.1.0-alpha.3",
				"skills",
				"forge-setup",
				"references",
			),
			{ recursive: true },
		);
		writeFileSync(
			join(installedRoot, "skills", "forge-setup", "references", "reinstall-recovery.md"),
			"fixture",
		);
		writeFileSync(join(installedRoot, "scripts", "install.mjs"), "fixture");
		writeFileSync(
			join(installedRoot, ".codex-plugin", "plugin.json"),
			JSON.stringify({ version: "0.1.0-alpha.4" }),
		);
		const resolved = spawnSync(
			"sh",
			["-eu", "-c", `unset PLUGIN_ROOT\nexport CODEX_HOME="$CODEX_HOME"\n${resolver}\nprintf '%s' "$PLUGIN_ROOT"`],
			{ env: { ...process.env, CODEX_HOME: resolverHome }, encoding: "utf8" },
		);
		expect(resolved.status).toBe(0);
		expect(resolved.stdout).toBe(installedRoot);
		const ambiguousRoot = join(
			resolverHome,
			"plugins",
			"cache",
			"second-marketplace",
			"codex-forge",
			"0.1.0-alpha.4",
		);
		mkdirSync(join(ambiguousRoot, "skills", "forge-setup", "references"), {
			recursive: true,
		});
		mkdirSync(join(ambiguousRoot, "scripts"), { recursive: true });
		mkdirSync(join(ambiguousRoot, ".codex-plugin"), { recursive: true });
		writeFileSync(join(ambiguousRoot, "skills", "forge-setup", "references", "reinstall-recovery.md"), "fixture");
		writeFileSync(join(ambiguousRoot, "scripts", "install.mjs"), "fixture");
		writeFileSync(join(ambiguousRoot, ".codex-plugin", "plugin.json"), JSON.stringify({ version: "0.1.0-alpha.4" }));
		const ambiguous = spawnSync("sh", ["-eu", "-c", `unset PLUGIN_ROOT\n${resolver}`], {
			env: { ...process.env, CODEX_HOME: resolverHome },
			encoding: "utf8",
		});
		expect(ambiguous.status).not.toBe(0);
	} finally {
		rmSync(resolverHome, { recursive: true, force: true });
	}
	expect(read(join(ROOT, "Justfile"))).toContain(
		"bun install.mjs install --purge-cache",
	);
	expect(readme).toContain("docs/model-instruction-audit-2026-08-24.md");
	expect(readme).toContain("AGENTS.md");
	expect(readme).toContain("CONTRIBUTING.md");
	expect(readme).toContain("245-word");
	expect(readme).not.toContain("359-word");
	expect(read(join(ROOT, "AGENTS.md"))).toContain(
		"docs/model-instruction-audit-2026-08-24.md",
	);
	expect(read(join(ROOT, "CONTRIBUTING.md"))).toContain(
		"repository-contracts.test.mjs",
	);
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
			expect(skill).toMatch(
				/description: (?:Use this skill when\b|Explicit `\$[a-z0-9-]+` workflow\b)/,
			);
			expect(skill).toContain("## Workflow");
			expect(skill).toContain("## Gotchas");
			expect(skill.split("\n").length).toBeLessThanOrEqual(500);
			expect(existsSync(join(directory, "references", "index.md"))).toBe(false);
			const metadata = YAML.parse(
				read(join(directory, "agents", "openai.yaml")),
			);
			expect(metadata.interface.display_name).toBeTruthy();
			expect(metadata.interface.default_prompt).toContain(`$${name}`);
			expect(metadata.policy.allow_implicit_invocation).toBe(false);
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
	const descriptions = JSON.parse(
		read(join(PLUGIN, "assets", "agent-descriptions.json")),
	);
	const roles = readdirSync(join(PLUGIN, "agents")).filter((name) =>
		/^forge-.*\.toml$/.test(name),
	);
	expect(roles.length).toBeGreaterThanOrEqual(9);
	for (const name of roles) {
		const role = TOML.parse(read(join(PLUGIN, "agents", name)));
		expect(role.name).toBe(name.slice(0, -5));
		expect(role.description).toBe(descriptions[role.name]);
		expect(role.developer_instructions).toBeTruthy();
		expect(role.service_tier).toBe("flex");
		expect(role.features?.multi_agent_v2).toBeUndefined();
	}
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-architect.toml"))).model,
	).toBe("gpt-5.6-sol");
	const reviewer = TOML.parse(
		read(join(PLUGIN, "agents", "forge-reviewer.toml")),
	);
	const pollGuidance =
		"For empty process-continuation polls, use `yield_time_ms=30000`; interactive writes proceed immediately.";
	expect(reviewer.developer_instructions).toContain(pollGuidance);
	expect(reviewer.developer_instructions).toContain(
		"Finish with exactly one terminal result line",
	);
	expect(reviewer.developer_instructions).toContain(
		"`FORGE_REVIEW_RESULT: pass`",
	);
	expect(reviewer.developer_instructions).toContain(
		"`FORGE_REVIEW_RESULT: fail`",
	);
	const worker = TOML.parse(read(join(PLUGIN, "agents", "forge-worker.toml")));
	expect(worker.developer_instructions).toContain(pollGuidance);
	expect(worker.model).toBe("gpt-5.6-luna");
	expect(worker.model_reasoning_effort).toBe("medium");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-scout.toml")))
			.model_reasoning_effort,
	).toBe("low");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-retriever.toml")))
			.model_reasoning_effort,
	).toBe("medium");
	for (const name of ["forge-architect", "forge-debugger", "forge-reviewer"])
		expect(
			TOML.parse(read(join(PLUGIN, "agents", `${name}.toml`)))
				.model_reasoning_effort,
		).toBe("medium");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-hard-worker.toml")))
			.model_reasoning_effort,
	).toBe("xhigh");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-tail-reviewer.toml")))
			.model_reasoning_effort,
	).toBe("xhigh");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-retriever.toml"))).model,
	).toBe("gpt-5.6-terra");
});
