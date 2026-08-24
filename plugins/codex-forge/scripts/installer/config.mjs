import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { TOML } from "bun";

const ROOT_KEYS = new Set([
	"model",
	"model_reasoning_effort",
	"plan_mode_reasoning_effort",
	"model_reasoning_summary",
	"model_verbosity",
	"service_tier",
	"model_instructions_file",
	"experimental_compact_prompt_file",
	"developer_instructions",
	"include_collaboration_mode_instructions",
	"approval_policy",
	"approvals_reviewer",
	"sandbox_mode",
]);
const TABLE_KEYS = {
	sandbox_workspace_write: new Set(["network_access"]),
	agents: new Set([
		"default_subagent_model",
		"default_subagent_reasoning_effort",
		"max_concurrent_threads_per_session",
		"max_depth",
	]),
	"apps._default": new Set([
		"default_tools_approval_mode",
		"destructive_enabled",
		"open_world_enabled",
	]),
	features: new Set([
		"hooks",
		"fast_mode",
		"personality",
		"prevent_idle_sleep",
		"local_thread_store_compression",
		"apply_patch_preserve_line_endings",
		"cwd_relative_turn_diffs",
		"unified_image_budget",
	]),
};

const quote = (value) => JSON.stringify(String(value));
const parseTableHeader = (line) =>
	line.match(/^\s*\[([^[\]]+)]\s*(?:#.*)?$/)?.[1].trim() ?? null;
const assignmentKey = (line) =>
	line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/)?.[1] ?? null;

function removeKeys(lines, keys) {
	const output = [];
	for (let index = 0; index < lines.length; ) {
		const line = lines[index];
		if (!keys.has(assignmentKey(line))) {
			output.push(line);
			index += 1;
			continue;
		}
		let marker = null;
		if ((line.match(/"""/g)?.length ?? 0) % 2 === 1) marker = '"""';
		else if ((line.match(/'''/g)?.length ?? 0) % 2 === 1) marker = "'''";
		index += 1;
		if (marker) {
			while (index < lines.length) {
				if ((lines[index].split(marker).length - 1) % 2 === 1) {
					index += 1;
					break;
				}
				index += 1;
			}
		}
	}
	return output;
}

function splitSections(text) {
	const root = [];
	const sections = [];
	let currentName = null;
	let current = [];
	for (const line of text.match(/.*(?:\n|$)/g)?.filter(Boolean) ?? []) {
		const name = parseTableHeader(line.trimEnd());
		if (name === null) {
			current.push(line);
			continue;
		}
		if (currentName === null) root.push(...current);
		else sections.push([currentName, current]);
		currentName = name;
		current = [line];
	}
	if (currentName === null) root.push(...current);
	else sections.push([currentName, current]);
	return [root, sections];
}

const managedBlock = (scope, lines) => [
	`# >>> codex-forge:${scope} >>>\n`,
	...lines.map((line) => `${line.replace(/\n$/, "")}\n`),
	`# <<< codex-forge:${scope} <<<\n`,
];

export function stripManaged(text) {
	return text.replace(
		/^# >>> codex-forge:[^\n]+ >>>\n.*?^# <<< codex-forge:[^\n]+ <<<\n?/gms,
		"",
	);
}

function fragments(home, pluginRoot) {
	const forge = join(home, "forge");
	const developer = readFileSync(
		join(pluginRoot, "assets", "developer-instructions.txt"),
		"utf8",
	).trim();
	const root = [
		'model = "gpt-5.6-sol"',
		'model_reasoning_effort = "medium"',
		'plan_mode_reasoning_effort = "high"',
		'model_reasoning_summary = "none"',
		'model_verbosity = "low"',
		'service_tier = "flex"',
		`model_instructions_file = ${quote(join(forge, "model-instructions.md"))}`,
		`experimental_compact_prompt_file = ${quote(join(forge, "compact-prompt.md"))}`,
		`developer_instructions = ${quote(developer)}`,
		"include_collaboration_mode_instructions = false",
		'approval_policy = "on-request"',
		'approvals_reviewer = "user"',
		'sandbox_mode = "workspace-write"',
	];
	const tables = {
		sandbox_workspace_write: ["network_access = true"],
		agents: [
			'default_subagent_model = "gpt-5.6-luna"',
			'default_subagent_reasoning_effort = "high"',
			"max_concurrent_threads_per_session = 3",
			"max_depth = 1",
		],
		"apps._default": [
			'default_tools_approval_mode = "writes"',
			"destructive_enabled = false",
			"open_world_enabled = false",
		],
		features: [
			"hooks = true",
			"fast_mode = false",
			"personality = false",
			"prevent_idle_sleep = true",
			"local_thread_store_compression = true",
			"apply_patch_preserve_line_endings = true",
			"cwd_relative_turn_diffs = true",
			"unified_image_budget = true",
		],
	};
	const descriptions = JSON.parse(
		readFileSync(join(pluginRoot, "assets", "agent-descriptions.json"), "utf8"),
	);
	const roles = readdirSync(join(pluginRoot, "agents"))
		.filter((name) => /^forge-.*\.toml$/.test(name))
		.sort()
		.map((name) => {
			const role = name.slice(0, -5);
			return [
				`agents.${role}`,
				[
					`description = ${quote(descriptions[role])}`,
					`config_file = ${quote(resolve(home, "agents", name))}`,
				],
			];
		});
	return [root, tables, roles];
}

export function mergeConfig(text, home, pluginRoot) {
	text = stripManaged(text);
	if (text.trim()) TOML.parse(text);
	let [rootLines, sections] = splitSections(text);
	const [desiredRoot, desiredTables, desiredRoles] = fragments(
		home,
		pluginRoot,
	);
	rootLines = removeKeys(rootLines, ROOT_KEYS);
	while (rootLines.length && !rootLines.at(-1).trim()) rootLines.pop();
	if (rootLines.length) rootLines.push("\n");
	rootLines.push(...managedBlock("root", desiredRoot), "\n");
	sections = sections.filter(([name]) => !name.startsWith("agents.forge-"));
	const createdTables = [];
	for (const [table, additions] of Object.entries(desiredTables)) {
		const index = sections.findIndex(([name]) => name === table);
		if (index >= 0) {
			const lines = sections[index][1];
			sections[index] = [
				table,
				[
					lines[0],
					...managedBlock(table, additions),
					...removeKeys(lines.slice(1), TABLE_KEYS[table]),
				],
			];
		} else {
			createdTables.push(table);
			sections.push([
				table,
				managedBlock(`table:${table}`, [`[${table}]`, ...additions]),
			]);
		}
	}
	for (const [table, roleValues] of desiredRoles)
		sections.push([
			table,
			managedBlock(`role:${table}`, [`[${table}]`, ...roleValues]),
		]);
	let output = rootLines.join("");
	for (const [, lines] of sections) {
		if (output && !output.endsWith("\n\n")) output += "\n";
		output += lines.join("");
	}
	if (!output.endsWith("\n")) output += "\n";
	TOML.parse(output);
	return [output, createdTables];
}
