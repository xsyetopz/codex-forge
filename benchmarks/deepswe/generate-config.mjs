#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const matrix = JSON.parse(
	readFileSync(resolve(import.meta.dir, "matrix.json"), "utf8"),
);
const taskSet = JSON.parse(
	readFileSync(resolve(import.meta.dir, "tasks.json"), "utf8"),
);
const args = Object.fromEntries(
	process.argv.slice(2).map((arg) => {
		const [key, ...rest] = arg.replace(/^--/, "").split("=");
		return [key, rest.join("=") || true];
	}),
);
const arm = String(args.arm || "baseline");
const model = String(args.model || "gpt-5.6-sol");
const effort = String(args.effort || "low");
const attempts = Number(args.attempts || 1);
const concurrency = Number(args.concurrency || 1);
const dataset = resolve(
	String(args.dataset || resolve(root, ".benchmark-cache/deep-swe/tasks")),
);
const jobsDir = resolve(
	String(args["jobs-dir"] || resolve(import.meta.dir, "results/jobs")),
);
const auth = resolve(
	String(args.auth || resolve(process.env.HOME, ".codex/auth.json")),
);
const selectedTasks = args.task
	? [String(args.task)]
	: args.tasks
		? String(args.tasks).split(",").filter(Boolean)
		: taskSet.tasks;
const runId = String(args["run-id"] || "run").replace(/[^a-zA-Z0-9._-]/g, "-");
const trialTokenBudget = Number(args["trial-token-budget"] || 100_000);
const budgetInstructions = `The cumulative output-token ceiling for this benchmark trial is ${trialTokenBudget}. Complete and commit while the counter is below the ceiling. At the ceiling, conclude immediately with the current verified state.`;
const developerInstructions =
	arm === "forge-core"
		? `${budgetInstructions}\n\n${readFileSync(
				resolve(root, "plugins/codex-forge/assets/developer-instructions.txt"),
				"utf8",
			).trim()}`
		: budgetInstructions;
const agentDescriptions = JSON.parse(
	readFileSync(
		resolve(root, "plugins/codex-forge/assets/agent-descriptions.json"),
		"utf8",
	),
);

if (!matrix.arms.includes(arm)) throw new Error(`Unknown arm: ${arm}`);
if (!matrix.families[model]?.includes(effort))
	throw new Error(`Excluded or unknown matrix cell: ${model}/${effort}`);
if (!Number.isInteger(attempts) || attempts < 1)
	throw new Error("attempts must be a positive integer");
if (!Number.isInteger(concurrency) || concurrency < 1)
	throw new Error("concurrency must be a positive integer");
if (
	!Number.isInteger(trialTokenBudget) ||
	trialTokenBudget < 10_000 ||
	trialTokenBudget > 100_000
)
	throw new Error(
		"trial-token-budget must be an integer from 10000 through 100000",
	);
if (!existsSync(dataset))
	throw new Error(`DeepSWE tasks not found: ${dataset}`);
if (!existsSync(auth)) throw new Error(`Codex auth file not found: ${auth}`);
for (const task of selectedTasks)
	if (!existsSync(resolve(dataset, task)))
		throw new Error(`Task not found: ${task}`);

const slug = `${arm}-${model}-${effort}-${runId}`;
const pluginTarget = "/opt/codex-forge-plugin";

const lines = [
	`job_name: ${slug}`,
	`jobs_dir: ${jobsDir}`,
	`n_attempts: ${attempts}`,
	`n_concurrent_trials: ${concurrency}`,
	"quiet: true",
	"environment:",
	"  type: docker",
	"  delete: true",
];
lines.push(
	"agents:",
	"  - name: codex",
	`    model_name: openai/${model}`,
	"    env:",
	`      CODEX_AUTH_JSON_PATH: ${auth}`,
	"    kwargs:",
	`      version: ${matrix.codex_version}`,
	`      reasoning_effort: ${effort}`,
	"      reasoning_summary: none",
);
if (arm === "forge-core")
	lines.push(`      skills_dir: ${pluginTarget}/plugins/codex-forge/skills`);
lines.push(
	"      config_toml: |",
	'        model_verbosity = "low"',
	"        include_collaboration_mode_instructions = false",
);
if (arm === "forge-core") {
	lines.push(
		`        model_instructions_file = "${pluginTarget}/plugins/codex-forge/assets/model-instructions.md"`,
		`        model_catalog_json = "${pluginTarget}/plugins/codex-forge/assets/model-catalog.json"`,
		`        developer_instructions = ${JSON.stringify(developerInstructions)}`,
		`        experimental_compact_prompt_file = "${pluginTarget}/plugins/codex-forge/assets/compact-prompt.md"`,
	);
} else {
	lines.push(
		`        developer_instructions = ${JSON.stringify(developerInstructions)}`,
	);
}
// Keep native model web search out of pinned DeepSWE trials. This is a root
// setting and must precede the first TOML table so both arms share the policy.
lines.push('        web_search = "disabled"');
// Pier 0.3.1 derives its egress allowlist from URL-valued Codex config. This
// disabled entry admits subscription-auth traffic without changing Codex.
lines.push(
	"        [mcp_servers.pier_egress_hint]",
	'        url = "https://chatgpt.com/backend-api/ps/mcp"',
	"        enabled = false",
);
if (arm === "forge-core") {
	lines.push(
		"        [agents]",
		"        max_concurrent_threads_per_session = 3",
		"        max_depth = 1",
	);
	for (const [role, description] of Object.entries(agentDescriptions))
		lines.push(
			`        [agents.${role}]`,
			`        description = ${JSON.stringify(description)}`,
			`        config_file = ${JSON.stringify(`${pluginTarget}/plugins/codex-forge/agents/${role}.toml`)}`,
		);
}
lines.push("datasets:", `  - path: ${dataset}`, "    task_names:");
for (const task of selectedTasks) lines.push(`      - ${task}`);

mkdirSync(resolve(import.meta.dir, "results/configs"), { recursive: true });
const output = resolve(
	String(
		args.output || resolve(import.meta.dir, `results/configs/${slug}.yaml`),
	),
);
writeFileSync(output, `${lines.join("\n")}\n`);
console.log(output);
