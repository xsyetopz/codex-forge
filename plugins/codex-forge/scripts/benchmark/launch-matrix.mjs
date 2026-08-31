#!/usr/bin/env bun
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { renderMatrix } from "./package.mjs";

const dataset = "terminal-bench/terminal-bench@4.0";
const models = renderMatrix();
const CHECKOUT_ROOT = resolve(import.meta.dir, "../../../..");
export const DEFAULT_BENCHMARK_OUTPUT = join(
	tmpdir(),
	"codex-forge-benchmark-cache",
	"terminal-bench-4.0",
);
export function benchmarkOutputRoot(
	override,
	{ workspaceRoot = CHECKOUT_ROOT, tempRoot = tmpdir() } = {},
) {
	if (override) return resolve(override);
	const workspace = resolve(workspaceRoot);
	const candidate = resolve(
		tempRoot,
		"codex-forge-benchmark-cache",
		"terminal-bench-4.0",
	);
	const fromWorkspace = relative(workspace, candidate);
	const insideWorkspace =
		fromWorkspace === "" ||
		(!isAbsolute(fromWorkspace) &&
			!fromWorkspace.startsWith(
				`..${process.platform === "win32" ? "\\\\" : "/"}`,
			));
	if (insideWorkspace)
		throw new Error(
			"default benchmark output resolves inside the workspace; provide an explicit output override",
		);
	return candidate;
}

if (import.meta.main) {
	const out = benchmarkOutputRoot(process.argv[2]);
	mkdirSync(out, { recursive: true });
	const header = [
		"#!/bin/sh",
		"set -eu",
		': "Set FORGE_CHECKOUT to this checkout and FORGE_PACKAGE to its generated portable package."',
		"FORGE_CHECKOUT=$" +
			"{FORGE_CHECKOUT:?set FORGE_CHECKOUT to the codex-forge checkout}",
		"FORGE_PACKAGE=$" +
			"{FORGE_PACKAGE:?set FORGE_PACKAGE to the generated portable package}",
		"",
	];
	const lines = [
		...header,
		': "Paid launch gate: set FORGE_BENCHMARK_CONFIRM=I_AUTHORIZE_5610_PAID_TRIALS"',
		'[ "$' +
			'{FORGE_BENCHMARK_CONFIRM:-}" = "I_AUTHORIZE_5610_PAID_TRIALS" ] || { echo "Refusing paid launch: explicit confirmation required" >&2; exit 2; }',
		"",
	];
	const dryRunLines = [
		...header,
		': "Dry-run only: Harbor validates without queuing or charging quota."',
		"",
	];
	const localLines = [
		...header,
		': "Local Harbor execution performs inference and consumes model quota; explicit confirmation is required."',
		'[ "$' +
			'{FORGE_BENCHMARK_CONFIRM:-}" = "I_AUTHORIZE_5610_PAID_TRIALS" ] || { echo "Refusing local inference: explicit confirmation required" >&2; exit 2; }',
		"",
	];
	for (const [index, cell] of models.entries()) {
		const command = `uvx harbor run --launch -d ${dataset} --agent "$FORGE_CHECKOUT/benchmarks/harbor/forge_codex.py:ForgeCodex" --model ${cell.model} --ak config="$FORGE_PACKAGE/config.toml" --ae CODEX_FORGE_PACKAGE="$FORGE_PACKAGE" --ak reasoning_effort=${cell.effort} --ak reasoning_summary=none --n-tasks ${cell.tasks} --n-concurrent 8`;
		const localCommand = command.replace(" --launch", "");
		lines.push(
			`# ${String(index + 1).padStart(2, "0")}: ${cell.model} ${cell.effort} (${cell.trials} trials)`,
			command,
			"",
		);
		dryRunLines.push(
			`# ${String(index + 1).padStart(2, "0")}: ${cell.model} ${cell.effort} (${cell.trials} trials)`,
			command.replace("--launch -d", "--launch --dry-run -d"),
			"",
		);
		localLines.push(
			`# ${String(index + 1).padStart(2, "0")}: ${cell.model} ${cell.effort} (${cell.trials} trials)`,
			localCommand,
			"",
		);
	}
	writeFileSync(`${out}/launch-matrix.sh`, `${lines.join("\n")}\n`, {
		mode: 0o755,
	});
	writeFileSync(`${out}/dry-run-matrix.sh`, `${dryRunLines.join("\n")}\n`, {
		mode: 0o755,
	});
	writeFileSync(`${out}/local-matrix.sh`, `${localLines.join("\n")}\n`, {
		mode: 0o755,
	});
	writeFileSync(`${out}/matrix.json`, `${JSON.stringify(models, null, 2)}\n`);
	console.log(
		JSON.stringify({
			output: out,
			cells: models.length,
			trials: models.reduce((sum, cell) => sum + cell.trials, 0),
			paid_gate: "FORGE_BENCHMARK_CONFIRM=I_AUTHORIZE_5610_PAID_TRIALS",
		}),
	);
}
