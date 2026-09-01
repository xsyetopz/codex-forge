#!/usr/bin/env bun
import { createHash } from "node:crypto";
import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tomlMultilineBasicString } from "../installer/owners/toml.mjs";

const DEFAULT_REMOTE_HOME = "/tmp/codex-home";
const MODELS = {
	"gpt-5.6-sol": ["xhigh", "high", "medium", "low", "none"],
	"gpt-5.6-terra": ["max", "xhigh", "high", "medium", "low", "none"],
	"gpt-5.6-luna": ["max", "xhigh", "high", "medium", "low", "none"],
};
const files = [
	["assets/model-instructions.md", "forge/model-instructions.md"],
	["assets/compact-prompt.md", "forge/compact-prompt.md"],
	["assets/model-catalog.json", "forge/model-catalog.json"],
	["assets/forge.rules", "rules/forge.rules"],
	["assets/AGENTS.md.patch", "AGENTS.md"],
	["assets/developer-instructions.txt", "forge/developer-instructions.txt"],
	["hooks/hooks.json", "forge/hooks.json"],
	[
		".codex-plugin/plugin.json",
		"plugins/codex-forge/.codex-plugin/plugin.json",
	],
];
const digest = (path) =>
	createHash("sha256").update(readFileSync(path)).digest("hex");
const tomlString = (value) => JSON.stringify(value);
const regularFiles = (root) => {
	const files = [];
	const visit = (directory, prefix = "") => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			const path = join(directory, entry.name);
			const stat = lstatSync(path);
			if (stat.isSymbolicLink())
				throw new Error(`symlink is not allowed in package: ${relative}`);
			if (stat.isDirectory()) visit(path, relative);
			else if (stat.isFile()) files.push(relative);
		}
	};
	visit(root);
	return files.sort();
};

export function renderConfig(remoteHome = DEFAULT_REMOTE_HOME) {
	const pluginRoot = `${remoteHome}/plugins/codex-forge`;
	return [
		`#:schema https://developers.openai.com/codex/config-schema.json`,
		// Match the installer asset contract: boundary whitespace is intentionally trimmed.
		`developer_instructions = ${tomlMultilineBasicString(readFileSync(resolve(import.meta.dir, "../../assets/developer-instructions.txt"), "utf8").trim())}`,
		`model = "gpt-5.6-sol"`,
		`model_reasoning_effort = "medium"`,
		`plan_mode_reasoning_effort = "medium"`,
		`model_reasoning_summary = "none"`,
		`model_verbosity = "low"`,
		`service_tier = "flex"`,
		`model_instructions_file = "${remoteHome}/forge/model-instructions.md"`,
		`model_catalog_json = "${remoteHome}/forge/model-catalog.json"`,
		`experimental_compact_prompt_file = "${remoteHome}/forge/compact-prompt.md"`,
		`include_collaboration_mode_instructions = false`,
		`approval_policy = "on-request"`,
		`approvals_reviewer = "user"`,
		`sandbox_mode = "workspace-write"`,
		`[sandbox_workspace_write]`,
		`network_access = true`,
		`[tui]`,
		`status_line = ["model-with-reasoning", "current-dir", "context-used", "used-tokens", "five-hour-limit", "weekly-limit"]`,
		`terminal_title = ["project", "git-branch", "status", "thread", "task-progress"]`,
		`[tools.update_plan]`,
		`enabled = true`,
		`[agents]`,
		`default_subagent_model = "gpt-5.6-luna"`,
		`default_subagent_reasoning_effort = "medium"`,
		`max_concurrent_threads_per_session = 8`,
		`max_depth = 1`,
		`[apps._default]`,
		`default_tools_approval_mode = "writes"`,
		`destructive_enabled = false`,
		`open_world_enabled = false`,
		`[features]`,
		`fast_mode = false`,
		`personality = false`,
		`prevent_idle_sleep = true`,
		`mcp_2026_07_28 = true`,
		`token_budget = false`,
		`[marketplaces.codex-forge]`,
		`source_type = "local"`,
		`source = ${tomlString(pluginRoot)}`,
		`[plugins."codex-forge@codex-forge"]`,
		`enabled = true`,
		"",
	].join("\n");
}

export function renderMatrix(tasks = 330) {
	return Object.entries(MODELS).flatMap(([model, efforts]) =>
		efforts.map((effort) => ({ model, effort, tasks, trials: tasks })),
	);
}

export function buildPortableForgePackage({
	sourceRoot,
	outputRoot,
	remoteHome = DEFAULT_REMOTE_HOME,
}) {
	const source = resolve(sourceRoot);
	const output = resolve(outputRoot);
	if (!existsSync(join(source, "plugins/codex-forge")))
		throw new Error(`Forge checkout is missing plugins/codex-forge: ${source}`);
	if (
		existsSync(output) &&
		(lstatSync(output).isSymbolicLink() || readdirSync(output).length)
	)
		throw new Error(
			`package output must be a fresh empty directory: ${output}`,
		);
	mkdirSync(output, { recursive: true });
	regularFiles(join(source, "plugins/codex-forge"));
	for (const [from, to] of files) {
		const sourcePath = join(source, "plugins/codex-forge", from);
		const targetPath = join(output, to);
		mkdirSync(resolve(targetPath, ".."), { recursive: true });
		if (to === "AGENTS.md")
			writeFileSync(
				targetPath,
				`# AGENTS.md\n\n${readFileSync(sourcePath, "utf8")}`,
			);
		else cpSync(sourcePath, targetPath);
	}
	cpSync(
		join(source, "plugins/codex-forge"),
		join(output, "plugins/codex-forge"),
		{ recursive: true },
	);
	cpSync(
		join(source, "plugins/codex-forge", "agents"),
		join(output, "agents"),
		{ recursive: true },
	);
	writeFileSync(join(output, "config.toml"), renderConfig(remoteHome));
	writeFileSync(
		join(output, "install-portable.sh"),
		[
			"#!/bin/sh",
			"set -eu",
			'PACKAGE_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)',
			"CODEX_HOME=$" + "{CODEX_HOME:-/tmp/codex-home}",
			'mkdir -p "$CODEX_HOME/forge" "$CODEX_HOME/rules" "$CODEX_HOME/agents" "$CODEX_HOME/plugins"',
			'cp -R "$PACKAGE_ROOT/forge/." "$CODEX_HOME/forge/"',
			'cp -R "$PACKAGE_ROOT/rules/." "$CODEX_HOME/rules/"',
			'cp -R "$PACKAGE_ROOT/agents/." "$CODEX_HOME/agents/"',
			'cp -R "$PACKAGE_ROOT/plugins/." "$CODEX_HOME/plugins/"',
			'cp "$PACKAGE_ROOT/AGENTS.md" "$CODEX_HOME/AGENTS.md"',
			'sed "s#/tmp/codex-home#$CODEX_HOME#g" "$PACKAGE_ROOT/config.toml" > "$CODEX_HOME/config.toml"',
			'printf "portable Forge installed at %s\\n" "$CODEX_HOME"',
			"",
		].join("\n"),
		{ mode: 0o755 },
	);
	const pluginFiles = [];
	for (const entry of regularFiles(join(source, "plugins/codex-forge"))) {
		pluginFiles.push({
			path: join("plugins/codex-forge", entry),
			sha256: digest(join(source, "plugins/codex-forge", entry)),
		});
	}
	const uploadedFiles = [];
	for (const entry of regularFiles(output)) {
		if (entry !== "manifest.json")
			uploadedFiles.push({ path: entry, sha256: digest(join(output, entry)) });
	}
	const manifest = {
		format: "codex-forge-portable/v1",
		remote_home: remoteHome,
		source_root: ".",
		files: files.map(([from, to]) => ({
			from,
			to,
			sha256: digest(join(source, "plugins/codex-forge", from)),
		})),
		plugin_files: pluginFiles,
		uploaded_files: uploadedFiles,
		matrix: renderMatrix(),
		paid_trial_gate: "FORGE_BENCHMARK_CONFIRM=I_AUTHORIZE_5610_PAID_TRIALS",
	};
	writeFileSync(
		join(output, "manifest.json"),
		`${JSON.stringify(manifest, null, 2)}\n`,
	);
	return manifest;
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const value = (flag) => {
		const index = args.indexOf(flag);
		return index >= 0 ? args[index + 1] : undefined;
	};
	const source = value("--source");
	const output = value("--output");
	if (!source || !output) {
		console.error(
			"Usage: bun package.mjs --source <checkout> --output <directory>",
		);
		process.exit(2);
	}
	const manifest = buildPortableForgePackage({
		sourceRoot: source,
		outputRoot: output,
	});
	const matrix = value("--matrix");
	if (matrix)
		writeFileSync(
			resolve(matrix),
			`${JSON.stringify(manifest.matrix, null, 2)}\n`,
		);
	console.log(
		JSON.stringify({
			output: resolve(output),
			files: manifest.files.length,
			plugin_files: manifest.plugin_files.length,
			cells: manifest.matrix.length,
			trials: manifest.matrix.reduce((sum, cell) => sum + cell.trials, 0),
		}),
	);
}
