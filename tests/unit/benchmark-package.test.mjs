import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TOML } from "bun";
import {
	benchmarkOutputRoot,
	DEFAULT_BENCHMARK_OUTPUT,
} from "../../plugins/codex-forge/scripts/benchmark/launch-matrix.mjs";
import {
	buildPortableForgePackage,
	renderConfig,
	renderMatrix,
} from "../../plugins/codex-forge/scripts/benchmark/package.mjs";

const temporary = [];
afterEach(() => {
	temporary.splice(0).forEach((path) => {
		rmSync(path, { recursive: true, force: true });
	});
});

test("benchmark matrix defaults outside the workspace and honors overrides", () => {
	const workspace = join(import.meta.dir, "../..");
	const defaultOutput = benchmarkOutputRoot();
	const override = join(workspace, ".benchmark-cache", "isolated-output");
	expect(defaultOutput).toBe(DEFAULT_BENCHMARK_OUTPUT);
	expect(defaultOutput.startsWith(`${workspace}/`)).toBe(false);
	expect(benchmarkOutputRoot(override)).toBe(override);
});

test("benchmark default fails closed when the injected temp root is in the workspace", () => {
	const workspace = join(import.meta.dir, "../..");
	expect(() =>
		benchmarkOutputRoot(undefined, {
			workspaceRoot: workspace,
			tempRoot: join(workspace, "tmp"),
		}),
	).toThrow("provide an explicit output override");
	expect(
		benchmarkOutputRoot(join(workspace, "explicit"), {
			workspaceRoot: workspace,
			tempRoot: join(workspace, "tmp"),
		}),
	).toBe(join(workspace, "explicit"));
});

test("benchmark containment uses the checkout root rather than process.cwd", () => {
	const originalCwd = process.cwd;
	process.cwd = () => join(import.meta.dir, "../..", "plugins/codex-forge");
	try {
		expect(() =>
			benchmarkOutputRoot(undefined, {
				tempRoot: join(import.meta.dir, "../..", "tmp"),
			}),
		).toThrow("provide an explicit output override");
	} finally {
		process.cwd = originalCwd;
	}
	const checkout = join(import.meta.dir, "../..");
	const sibling = `${checkout}-sibling`;
	expect(
		benchmarkOutputRoot(undefined, {
			workspaceRoot: checkout,
			tempRoot: sibling,
		}),
	).toBe(join(sibling, "codex-forge-benchmark-cache", "terminal-bench-4.0"));
});

test("portable Forge package carries absolute-path assets into CODEX_HOME", () => {
	const output = mkdtempSync(join(tmpdir(), "forge-portable-"));
	temporary.push(output);
	const manifest = buildPortableForgePackage({
		sourceRoot: join(import.meta.dir, "../.."),
		outputRoot: output,
	});
	expect(manifest.format).toBe("codex-forge-portable/v1");
	expect(manifest.plugin_files.length).toBeGreaterThan(30);
	expect(manifest.uploaded_files.length).toBeGreaterThan(
		manifest.plugin_files.length,
	);
	for (const path of [
		"config.toml",
		"install-portable.sh",
		"forge/model-instructions.md",
		"forge/compact-prompt.md",
		"forge/model-catalog.json",
		"rules/forge.rules",
		"AGENTS.md",
		"agents/forge-worker.toml",
		"plugins/codex-forge/.mcp.json",
		"plugins/codex-forge/.agents/plugins/marketplace.json",
		"plugins/codex-forge/.codex-plugin/plugin.json",
		"plugins/codex-forge/assets/config-template.toml",
		"plugins/codex-forge/hooks/hooks.json",
		"plugins/codex-forge/scripts/hooks/user-prompt-submit/preserve-raw.mjs",
	])
		expect(existsSync(join(output, path))).toBe(true);
	for (const path of [
		"plugins/codex-forge/.mcp.json",
		"plugins/codex-forge/.agents/plugins/marketplace.json",
		"plugins/codex-forge/.codex-plugin/plugin.json",
	])
		expect(manifest.plugin_files.some((item) => item.path === path)).toBe(true);
	for (const path of [
		"plugins/codex-forge/.mcp.json",
		"plugins/codex-forge/.agents/plugins/marketplace.json",
		"plugins/codex-forge/.codex-plugin/plugin.json",
	])
		expect(manifest.uploaded_files.some((item) => item.path === path)).toBe(
			true,
		);
	const config = readFileSync(join(output, "config.toml"), "utf8");
	expect(config).toContain("/tmp/codex-home/forge/model-instructions.md");
	expect(config).toContain("/tmp/codex-home/plugins/codex-forge");
});

test("matrix contains the exact 17 model-effort cells and 5610 trials", () => {
	const matrix = renderMatrix();
	expect(matrix).toHaveLength(17);
	expect(matrix.reduce((sum, cell) => sum + cell.trials, 0)).toBe(5610);
	expect(
		matrix
			.filter((cell) => cell.model === "gpt-5.6-sol")
			.map((cell) => cell.effort),
	).toEqual(["xhigh", "high", "medium", "low", "none"]);
	expect(
		matrix
			.filter((cell) => cell.model !== "gpt-5.6-sol")
			.every(
				(cell) =>
					cell.effort === "max" ||
					cell.effort === "xhigh" ||
					cell.effort === "high" ||
					cell.effort === "medium" ||
					cell.effort === "low" ||
					cell.effort === "none",
			),
	).toBe(true);
});

test("generated config keeps Forge instruction paths absolute and portable", () => {
	const config = renderConfig();
	expect(config.split("\n")[0]).toBe(
		"#:schema https://developers.openai.com/codex/config-schema.json",
	);
	expect(config).toContain(
		'model_instructions_file = "/tmp/codex-home/forge/model-instructions.md"',
	);
	expect(config).toContain(
		'experimental_compact_prompt_file = "/tmp/codex-home/forge/compact-prompt.md"',
	);
	expect(TOML.parse(config).developer_instructions).toBe(
		readFileSync(
			join(
				import.meta.dir,
				"../../plugins/codex-forge/assets/developer-instructions.txt",
			),
			"utf8",
		).trim(),
	);
	expect(TOML.parse(config).tui.status_line).toContain("context-used");
	expect(TOML.parse(config).tui.terminal_title).toContain("task-progress");
	expect(TOML.parse(config).tools.update_plan.enabled).toBe(true);
	expect(TOML.parse(config).features.token_budget).toBe(false);
});

test("package builder rejects stale output and source symlinks", () => {
	const parent = mkdtempSync(join(tmpdir(), "forge-package-boundary-"));
	temporary.push(parent);
	const stale = join(parent, "stale");
	mkdirSync(stale);
	writeFileSync(join(stale, "old"), "stale");
	expect(() =>
		buildPortableForgePackage({
			sourceRoot: join(import.meta.dir, "../.."),
			outputRoot: stale,
		}),
	).toThrow("fresh empty");
	const source = join(parent, "source");
	mkdirSync(join(source, "plugins/codex-forge"), { recursive: true });
	symlinkSync(
		join(import.meta.dir, "../..", "plugins/codex-forge/assets"),
		join(source, "plugins/codex-forge/assets"),
	);
	expect(() =>
		buildPortableForgePackage({
			sourceRoot: source,
			outputRoot: join(parent, "clean"),
		}),
	).toThrow("symlink");
});

test("matrix generator emits gated launch and ungated hosted dry-run scripts", () => {
	const output = mkdtempSync(join(tmpdir(), "forge-matrix-"));
	temporary.push(output);
	const result = spawnSync(
		"bun",
		[
			join(
				import.meta.dir,
				"../../plugins/codex-forge/scripts/benchmark/launch-matrix.mjs",
			),
			output,
		],
		{ encoding: "utf8" },
	);
	expect(result.status).toBe(0);
	const launch = readFileSync(join(output, "launch-matrix.sh"), "utf8");
	const dryRun = readFileSync(join(output, "dry-run-matrix.sh"), "utf8");
	const local = readFileSync(join(output, "local-matrix.sh"), "utf8");
	expect(launch).toContain("I_AUTHORIZE_5610_PAID_TRIALS");
	expect(dryRun).toContain("--launch --dry-run");
	expect(dryRun).not.toContain("I_AUTHORIZE_5610_PAID_TRIALS");
	expect(local).toContain("I_AUTHORIZE_5610_PAID_TRIALS");
	expect(local).not.toContain(" --launch");
});

test("preflight rejects undeclared package files", () => {
	const output = mkdtempSync(join(tmpdir(), "forge-preflight-manifest-"));
	temporary.push(output);
	buildPortableForgePackage({
		sourceRoot: join(import.meta.dir, "../.."),
		outputRoot: output,
	});
	writeFileSync(join(output, "stale.txt"), "undeclared");
	const result = spawnSync(
		"bun",
		[
			join(
				import.meta.dir,
				"../../plugins/codex-forge/scripts/benchmark/preflight.mjs",
			),
			output,
		],
		{ encoding: "utf8" },
	);
	expect(result.status).not.toBe(0);
	expect(`${result.stdout}${result.stderr}`).toContain(
		"undeclared or missing files",
	);
});

test("ForgeCodex uploads each declared package file exactly once", () => {
	const parent = mkdtempSync(join(tmpdir(), "forge-adapter-package-"));
	temporary.push(parent);
	const output = join(parent, "package");
	const manifest = buildPortableForgePackage({
		sourceRoot: join(import.meta.dir, "../.."),
		outputRoot: output,
	});
	const harness = join(parent, "adapter_harness.py");
	writeFileSync(
		harness,
		`
import asyncio, importlib.util, os, sys, types
class FakeCodex:
    _REMOTE_CODEX_HOME = "/tmp/codex-home"
    def _get_env(self, name): return os.environ.get(name)
    async def run(self, instruction, environment, context): environment.delegated = True
class FakeEnvironment:
    def __init__(self): self.uploads = []; self.delegated = False
    async def upload_file(self, path, remote): self.uploads.append((str(path), remote))
sys.modules["harbor"] = types.ModuleType("harbor")
for name in ["harbor.agents", "harbor.agents.installed", "harbor.environments", "harbor.models", "harbor.models.agent"]: sys.modules[name] = types.ModuleType(name)
codex = types.ModuleType("harbor.agents.installed.codex"); codex.Codex = FakeCodex; sys.modules[codex.__name__] = codex
base = types.ModuleType("harbor.environments.base"); base.BaseEnvironment = FakeEnvironment; sys.modules[base.__name__] = base
context = types.ModuleType("harbor.models.agent.context"); context.AgentContext = object; sys.modules[context.__name__] = context
spec = importlib.util.spec_from_file_location("forge_codex", ${JSON.stringify(join(import.meta.dir, "../../benchmarks/harbor/forge_codex.py"))})
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
async def main():
    env = FakeEnvironment(); agent = module.ForgeCodex(); await agent.run("instruction", env, object())
    print(len(env.uploads), env.delegated)
asyncio.run(main())
`,
	);
	const result = spawnSync("python3", ["-B", harness], {
		env: {
			...process.env,
			CODEX_FORGE_PACKAGE: output,
			PYTHONDONTWRITEBYTECODE: "1",
		},
		encoding: "utf8",
	});
	expect(result.status).toBe(0);
	expect(result.stdout.trim()).toBe(`${manifest.uploaded_files.length} True`);
});

test("preflight rejects a tampered installer before execution", () => {
	const parent = mkdtempSync(join(tmpdir(), "forge-preflight-installer-"));
	temporary.push(parent);
	const output = join(parent, "package");
	buildPortableForgePackage({
		sourceRoot: join(import.meta.dir, "../.."),
		outputRoot: output,
	});
	const sentinel = join(parent, "executed");
	writeFileSync(
		join(output, "install-portable.sh"),
		`#!/bin/sh\ntouch ${sentinel}\n`,
	);
	const result = spawnSync(
		"bun",
		[
			join(
				import.meta.dir,
				"../../plugins/codex-forge/scripts/benchmark/preflight.mjs",
			),
			output,
		],
		{ encoding: "utf8" },
	);
	expect(result.status).not.toBe(0);
	expect(`${result.stdout}${result.stderr}`).toContain(
		"package digest mismatch: install-portable.sh",
	);
	expect(existsSync(sentinel)).toBe(false);
});

test("Harbor adapter import/setup smoke is no-inference", () => {
	const result = spawnSync(
		"bun",
		[
			join(
				import.meta.dir,
				"../../plugins/codex-forge/scripts/benchmark/adapter-smoke.mjs",
			),
		],
		{ encoding: "utf8" },
	);
	expect(result.status).toBe(0);
	expect(result.stdout.trim()).toBe("ForgeCodex import/setup OK");
});

test("benchmark tests leave no Python bytecode", () => {
	const bytecode = spawnSync("fd", ["-HI", "-t", "f", "\\.pyc$", "."], {
		encoding: "utf8",
	});
	const caches = spawnSync("fd", ["-HI", "-t", "d", "^__pycache__$", "."], {
		encoding: "utf8",
	});
	expect(bytecode.status).toBe(0);
	expect(caches.status).toBe(0);
	expect(bytecode.stdout.trim()).toBe("");
	expect(caches.stdout.trim()).toBe("");
});
