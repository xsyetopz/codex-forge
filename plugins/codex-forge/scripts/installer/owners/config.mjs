import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOML } from "bun";
import { tomlMultilineBasicString } from "./toml.mjs";

const ROOT_KEYS = new Set([
	"model",
	"model_reasoning_effort",
	"plan_mode_reasoning_effort",
	"model_reasoning_summary",
	"model_verbosity",
	"service_tier",
	"model_instructions_file",
	"model_catalog_json",
	"experimental_compact_prompt_file",
	"developer_instructions",
	"include_collaboration_mode_instructions",
	"approval_policy",
	"approvals_reviewer",
	"sandbox_mode",
]);
const TABLE_KEYS = {
	sandbox_workspace_write: new Set(["network_access"]),
	tui: new Set(["status_line", "terminal_title"]),
	"tools.update_plan": new Set(["enabled"]),
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
		"fast_mode",
		"personality",
		"prevent_idle_sleep",
		"mcp_2026_07_28",
		"token_budget",
	]),
};
const TABLE_PASSTHROUGH_KEYS = {
	sandbox_workspace_write: new Set([
		"exclude_slash_tmp",
		"exclude_tmpdir_env_var",
		"writable_roots",
	]),
};

const quote = (value) => JSON.stringify(String(value));
const SCHEMA_DIRECTIVE =
	"#:schema https://developers.openai.com/codex/config-schema.json";
const SCHEMA_DIRECTIVE_PATTERN =
	/^#:schema https:\/\/developers\.openai\.com\/codex\/config-schema\.jso(?:n)?\s*\n?/gm;
const DEFAULT_MAX_CONCURRENT_THREADS = 2;
const LEGACY_DEFAULT_MAX_CONCURRENT_THREADS = new Set([3, 8]);
const maxThreadsAssignment = (text) =>
	text.match(
		/^\s*(?:agents\.)?max_concurrent_threads_per_session\s*=\s*(\d+)\s*(?:#.*)?$/m,
	)?.[1] ?? null;
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

const managedBlock = (_scope, lines) => [
	`# >>> codex-forge >>>\n`,
	...lines.map((line) => `${line.replace(/\n$/, "")}\n`),
	`# <<< codex-forge <<<\n`,
];

const OPEN = "# >>> codex-forge >>>";
const CLOSE = "# <<< codex-forge <<<";
const EXPECTED_SCOPES = new Map([
	["root", ROOT_KEYS],
	["sandbox_workspace_write", TABLE_KEYS.sandbox_workspace_write],
	["tui", TABLE_KEYS.tui],
	["tools.update_plan", TABLE_KEYS["tools.update_plan"]],
	["agents", TABLE_KEYS.agents],
	["apps._default", TABLE_KEYS["apps._default"]],
	["features", TABLE_KEYS.features],
]);
const CURRENT_SCOPES = new Set(EXPECTED_SCOPES.keys());
const LEGACY_SCOPE_LAYOUTS = [
	new Set([...CURRENT_SCOPES].filter((scope) => scope !== "tools.update_plan")),
	new Set(
		[...CURRENT_SCOPES].filter(
			(scope) => scope !== "tui" && scope !== "tools.update_plan",
		),
	),
];
const LEGACY_SCOPE_KEYS = {
	features: new Set(
		[...TABLE_KEYS.features].filter((key) => key !== "token_budget"),
	),
};

const sameSet = (left, right) =>
	left.size === right.size && [...left].every((value) => right.has(value));

function splitOwnedBody(body, scope) {
	const headers = [...body.matchAll(/^\s*\[([^[\]]+)]\s*(?:#.*)?$/gm)];
	if (!headers.length) return [body, ""];
	const firstIsOwnedHeader = headers[0][1].trim() === scope;
	const boundaryHeader = firstIsOwnedHeader ? headers[1] : headers[0];
	if (!boundaryHeader) return [body, ""];
	const boundary = boundaryHeader.index;
	return [body.slice(0, boundary), body.slice(boundary)];
}

function removeEmptyCreatedTables(text, createdTables) {
	const created = new Set(createdTables ?? []);
	if (!created.size) return text;
	const [root, sections] = splitSections(text);
	return [
		...root,
		...sections.flatMap(([name, lines]) =>
			created.has(name) && lines.slice(1).every((line) => !line.trim())
				? []
				: lines,
		),
	].join("");
}

export function parseManagedConfig(text, { requirePresent = false } = {}) {
	const lines = text.match(/.*(?:\n|$)/g)?.filter(Boolean) ?? [];
	const blocks = [];
	const seen = new Set();
	let start = 0;
	let open = null;
	let table = "root";
	for (const raw of lines) {
		const line = raw.replace(/\n$/, "");
		const markerLike = /^#\s*(?:>>>|<<<)\s*codex-forge\b/.test(line);
		const header = parseTableHeader(line);
		if (header !== null && open === null) table = header;
		if (line === OPEN) {
			if (open !== null)
				throw new Error(
					"config.toml contains nested or duplicate Forge markers",
				);
			open = start;
		} else if (line === CLOSE) {
			if (open === null)
				throw new Error("config.toml contains an unmatched Forge close marker");
			const body = text.slice(open + OPEN.length + 1, start);
			const bodyScope = body.match(/^\[([^\]]+)\]/m)?.[1];
			const scope =
				bodyScope && EXPECTED_SCOPES.has(bodyScope) ? bodyScope : table;
			if (scope !== "root" && !EXPECTED_SCOPES.has(scope))
				throw new Error(
					`config.toml contains an unknown Forge scope: ${scope}`,
				);
			if (seen.has(scope))
				throw new Error(`config.toml contains duplicate Forge scope: ${scope}`);
			const [ownedBody, trailingBody] = splitOwnedBody(body, scope);
			const keys = new Set(
				ownedBody
					.split("\n")
					.map((value) => assignmentKey(value))
					.filter(Boolean),
			);
			const expected = EXPECTED_SCOPES.get(scope);
			if (scope !== "root") keys.delete(scope);
			const passthrough = TABLE_PASSTHROUGH_KEYS[scope] ?? new Set();
			const unexpected = [...keys].filter(
				(key) => !expected.has(key) && !passthrough.has(key),
			);
			const legacyExpected = LEGACY_SCOPE_KEYS[scope];
			const hasExpectedSignature = [expected, legacyExpected]
				.filter(Boolean)
				.some(
					(signature) =>
						[...signature].every((key) => keys.has(key)) &&
						[...keys].every(
							(key) => signature.has(key) || passthrough.has(key),
						),
				);
			if (!hasExpectedSignature || unexpected.length)
				throw new Error(
					`config.toml Forge scope has an unexpected managed-key signature: ${scope}`,
				);
			seen.add(scope);
			const hasPassthrough = [...keys].some((key) => passthrough.has(key));
			let replacement = "";
			if (hasPassthrough) {
				replacement = removeKeys(
					ownedBody.match(/.*(?:\n|$)/g)?.filter(Boolean) ?? [],
					expected,
				).join("");
			}
			replacement += trailingBody;
			blocks.push({
				start: open,
				end: start + raw.length,
				scope,
				replacement,
			});
			open = null;
		} else if (markerLike) {
			throw new Error(
				"config.toml contains malformed Forge marker-like content",
			);
		}
		start += raw.length;
	}
	if (open !== null)
		throw new Error("config.toml contains an unmatched Forge open marker");
	if (requirePresent && blocks.length === 0)
		throw new Error("config.toml is missing its recorded Forge block");
	if (
		blocks.length &&
		!sameSet(seen, CURRENT_SCOPES) &&
		!LEGACY_SCOPE_LAYOUTS.some((layout) => sameSet(seen, layout))
	)
		throw new Error(
			"config.toml is missing one or more canonical Forge scopes",
		);
	return { present: blocks.length > 0, blocks };
}

export function stripManaged(text, options = {}) {
	const parsed = parseManagedConfig(text, options);
	let output = text;
	for (const block of [...parsed.blocks].reverse())
		output = `${output.slice(0, block.start)}${block.replacement}${output.slice(block.end)}`;
	return removeEmptyCreatedTables(output, options.createdTables);
}

function withSchemaDirective(text) {
	const withoutDirective = text.replace(SCHEMA_DIRECTIVE_PATTERN, "");
	return `${SCHEMA_DIRECTIVE}\n${withoutDirective.replace(/^\s*\n/, "")}`;
}

export function resolveMaxConcurrentThreads(text) {
	const unmanaged = maxThreadsAssignment(stripManaged(text));
	if (unmanaged !== null) return Number(unmanaged);
	const managedValue =
		[
			...text.matchAll(
				/^# >>> codex-forge >>>\n([\s\S]*?)^# <<< codex-forge <<<\n?/gm,
			),
		]
			.map((match) => maxThreadsAssignment(match[1]))
			.find(Boolean) ?? null;
	if (
		managedValue === null ||
		LEGACY_DEFAULT_MAX_CONCURRENT_THREADS.has(Number(managedValue))
	)
		return DEFAULT_MAX_CONCURRENT_THREADS;
	return Number(managedValue);
}

function fragments(home, pluginRoot, maxConcurrentThreads) {
	const forge = join(home, "forge");
	// The asset contract intentionally trims boundary whitespace before embedding.
	const developer = readFileSync(
		join(pluginRoot, "assets", "developer-instructions.txt"),
		"utf8",
	).trim();
	const root = [
		'model = "gpt-5.6-sol"',
		'model_reasoning_effort = "medium"',
		'plan_mode_reasoning_effort = "medium"',
		'model_reasoning_summary = "none"',
		'model_verbosity = "low"',
		'service_tier = "flex"',
		`model_instructions_file = ${quote(join(forge, "model-instructions.md"))}`,
		`model_catalog_json = ${quote(join(forge, "model-catalog.json"))}`,
		`experimental_compact_prompt_file = ${quote(join(forge, "compact-prompt.md"))}`,
		`developer_instructions = ${tomlMultilineBasicString(developer)}`,
		"include_collaboration_mode_instructions = false",
		'approval_policy = "on-request"',
		'approvals_reviewer = "user"',
		'sandbox_mode = "workspace-write"',
	];
	const tables = {
		sandbox_workspace_write: ["network_access = true"],
		tui: [
			'status_line = ["model-with-reasoning", "current-dir", "context-used", "used-tokens", "five-hour-limit", "weekly-limit"]',
			'terminal_title = ["project", "git-branch", "status", "thread", "task-progress"]',
		],
		"tools.update_plan": ["enabled = true"],
		agents: [
			'default_subagent_model = "gpt-5.6-luna"',
			'default_subagent_reasoning_effort = "medium"',
			`max_concurrent_threads_per_session = ${maxConcurrentThreads}`,
			"max_depth = 1",
		],
		"apps._default": [
			'default_tools_approval_mode = "writes"',
			"destructive_enabled = false",
			"open_world_enabled = false",
		],
		features: [
			"fast_mode = false",
			"personality = false",
			"prevent_idle_sleep = true",
			"mcp_2026_07_28 = true",
			"token_budget = false",
		],
	};
	return [root, tables];
}

export function mergeConfig(
	text,
	home,
	pluginRoot,
	{ preserveFrom = text, maxConcurrentThreads } = {},
) {
	maxConcurrentThreads ??= resolveMaxConcurrentThreads(preserveFrom);
	text = stripManaged(text);
	if (text.trim()) TOML.parse(text);
	let [rootLines, sections] = splitSections(text);
	const [desiredRoot, desiredTables] = fragments(
		home,
		pluginRoot,
		maxConcurrentThreads,
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
				[`[${table}]\n`, ...managedBlock(table, additions)],
			]);
		}
	}
	let output = rootLines.join("");
	for (const [, lines] of sections) {
		if (output && !output.endsWith("\n\n")) output += "\n";
		output += lines.join("");
	}
	if (!output.endsWith("\n")) output += "\n";
	output = withSchemaDirective(output);
	TOML.parse(output);
	return [output, createdTables];
}
