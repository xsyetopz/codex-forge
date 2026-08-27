import { afterEach, describe, expect, test } from "bun:test";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { TOML } from "bun";

const ROOT = resolve(import.meta.dir, "../..");
const temporary = [];
afterEach(() => {
	for (const path of temporary.splice(0))
		rmSync(path, { recursive: true, force: true });
});

function fixture(
	config = 'foo = "keep"\n\n[features]\n\n[agents]\nenabled = true\n\n[agents.custom]\ndescription = "keep"\nconfig_file = "/tmp/custom.toml"\n\n[apps._default]\nextra = "keep"\n\n[plugins."codex-forge@test"]\nenabled = true\n',
) {
	const root = mkdtempSync(join(tmpdir(), "forge-test-"));
	temporary.push(root);
	const home = join(root, "codex");
	mkdirSync(home);
	writeFileSync(join(home, "config.toml"), config);
	return { root, home, original: config };
}

function install(home, ...args) {
	return runInstaller(home, args);
}

function runInstaller(home, args, extraEnvironment = {}) {
	return Bun.spawnSync(["bun", join(ROOT, "install.mjs"), ...args], {
		env: { ...process.env, ...extraEnvironment, CODEX_HOME: home },
		stdout: "pipe",
		stderr: "pipe",
	});
}

describe("installer lifecycle", () => {
	test("fresh install sets the eight-thread default and restores unrelated configuration", () => {
		const { home, original } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const parsed = TOML.parse(readFileSync(join(home, "config.toml"), "utf8"));
		expect(parsed.foo).toBe("keep");
		expect(parsed.features.hooks).toBeUndefined();
		expect(parsed.model).toBe("gpt-5.6-sol");
		expect(parsed.model_reasoning_effort).toBe("medium");
		expect(parsed.plan_mode_reasoning_effort).toBe("medium");
		expect(parsed.model_instructions_file).toBe(
			join(home, "forge", "model-instructions.md"),
		);
		expect(parsed.model_catalog_json).toBe(
			join(home, "forge", "model-catalog.json"),
		);
		expect(
			readFileSync(join(home, "forge", "model-instructions.md"), "utf8"),
		).toBe(
			readFileSync(
				join(ROOT, "plugins", "codex-forge", "assets", "model-instructions.md"),
				"utf8",
			),
		);
		const catalog = JSON.parse(
			readFileSync(join(home, "forge", "model-catalog.json"), "utf8"),
		);
		for (const slug of ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]) {
			const model = catalog.models.find((item) => item.slug === slug);
			expect(model.multi_agent_version).toBe("v1");
			expect(model.use_responses_lite).toBe(false);
			expect(model.display_name).toBeTruthy();
		}
		expect(parsed.approval_policy).toBe("on-request");
		expect(parsed.agents.max_concurrent_threads_per_session).toBe(8);
		expect(parsed.agents.default_subagent_reasoning_effort).toBe("medium");
		expect(parsed.agents.max_depth).toBe(1);
		expect(parsed.features.multi_agent).toBeUndefined();
		expect(parsed.features.multi_agent_v2).toBeUndefined();
		expect(parsed.agents["forge-worker"]).toBeUndefined();
		expect(existsSync(join(home, "agents", "forge-worker.toml"))).toBe(true);
		expect(parsed.features.token_budget).toBeUndefined();
		expect(parsed.profiles).toBeUndefined();
		expect(parsed.agents.custom.description).toBe("keep");
		expect(parsed.apps._default.extra).toBe("keep");
		const state = JSON.parse(
			readFileSync(join(home, "forge", "install-state.json"), "utf8"),
		);
		expect(state.plugin_version).toBe("0.1.0-alpha.4");
		expect(state.file_mappings).toHaveLength(13);
		expect(
			state.file_mappings.some(
				(item) => item.target === join(home, "forge", "model-instructions.md"),
			),
		).toBe(true);
		expect(
			state.file_mappings.some(
				(item) =>
					item.source === "assets/model-catalog.json" &&
					item.target === join(home, "forge", "model-catalog.json"),
			),
		).toBe(true);
		expect(
			state.file_mappings.every(
				(item) => item.source_sha256 && item.installed_sha256,
			),
		).toBe(true);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(0);
		expect(JSON.parse(diagnosis.stdout.toString()).healthy).toBe(true);
		expect(JSON.parse(diagnosis.stdout.toString()).checks.model_catalog).toBe(
			true,
		);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(join(home, "config.toml"), "utf8")).toBe(original);
		expect(existsSync(join(home, "forge", "model-instructions.md"))).toBe(
			false,
		);
		expect(existsSync(join(home, "forge", "model-catalog.json"))).toBe(false);
	});
	test("migrates a prior Forge-managed default cap from 3 to 8", () => {
		const { home } = fixture(
			'[agents]\n# >>> codex-forge:agents >>>\ndefault_subagent_model = "gpt-5.6-luna"\ndefault_subagent_reasoning_effort = "high"\nmax_concurrent_threads_per_session = 3\nmax_depth = 1\n# <<< codex-forge:agents <<<\n\n[plugins."codex-forge@test"]\nenabled = true\n',
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(home, "config.toml"), "utf8")).agents
				.max_concurrent_threads_per_session,
		).toBe(8);
	});
	test("preserves a customized cap inside a Forge-managed block", () => {
		const { home } = fixture(
			'[agents]\n# >>> codex-forge:agents >>>\ndefault_subagent_model = "gpt-5.6-luna"\ndefault_subagent_reasoning_effort = "high"\nmax_concurrent_threads_per_session = 6\nmax_depth = 1\n# <<< codex-forge:agents <<<\n\n[plugins."codex-forge@test"]\nenabled = true\n',
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(home, "config.toml"), "utf8")).agents
				.max_concurrent_threads_per_session,
		).toBe(6);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(home, "config.toml"), "utf8")).agents
				.max_concurrent_threads_per_session,
		).toBe(6);
	});
	test("preserves a customized cap outside Forge-managed blocks", () => {
		const { home } = fixture(
			'[agents]\nmax_concurrent_threads_per_session = 6\n\n[plugins."codex-forge@test"]\nenabled = true\n',
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(home, "config.toml"), "utf8")).agents
				.max_concurrent_threads_per_session,
		).toBe(6);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(home, "config.toml"), "utf8")).agents
				.max_concurrent_threads_per_session,
		).toBe(6);
	});
	test("preserves a cap customized in the real installer-created agents table", () => {
		const { home } = fixture('[plugins."codex-forge@test"]\nenabled = true\n');
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const configPath = join(home, "config.toml");
		const firstInstall = readFileSync(configPath, "utf8");
		expect(firstInstall).toContain("# >>> codex-forge:table:agents >>>");
		expect(firstInstall).toContain("max_concurrent_threads_per_session = 8");
		writeFileSync(
			configPath,
			firstInstall.replace(
				"max_concurrent_threads_per_session = 8",
				"max_concurrent_threads_per_session = 6",
			),
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const parsed = TOML.parse(readFileSync(configPath, "utf8"));
		expect(parsed.agents.max_concurrent_threads_per_session).toBe(6);
		const state = JSON.parse(
			readFileSync(join(home, "forge", "install-state.json"), "utf8"),
		);
		expect(state.max_concurrent_threads_per_session).toBe(6);
	});
	test("quotes managed paths containing spaces and quotation marks", () => {
		const root = mkdtempSync(join(tmpdir(), "forge-path-test-"));
		temporary.push(root);
		const home = join(root, 'codex home "quoted"');
		mkdirSync(home);
		writeFileSync(
			join(home, "config.toml"),
			'[plugins."codex-forge@test"]\nenabled = true\n',
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const parsed = TOML.parse(readFileSync(join(home, "config.toml"), "utf8"));
		expect(parsed.model_instructions_file).toBe(
			join(home, "forge", "model-instructions.md"),
		);
		expect(parsed.agents["forge-worker"]).toBeUndefined();
		expect(existsSync(join(home, "agents", "forge-worker.toml"))).toBe(true);
	});
	test("backs up and restores a preexisting model-instructions target", () => {
		const { home } = fixture();
		const target = join(home, "forge", "model-instructions.md");
		mkdirSync(join(target, ".."), { recursive: true });
		writeFileSync(target, "user-owned instructions\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).toBe(
			readFileSync(
				join(ROOT, "plugins", "codex-forge", "assets", "model-instructions.md"),
				"utf8",
			),
		);
		const state = JSON.parse(
			readFileSync(join(home, "forge", "install-state.json"), "utf8"),
		);
		const mapping = state.file_mappings.find((item) => item.target === target);
		expect(mapping.previous_existed).toBe(true);
		expect(existsSync(mapping.previous_backup)).toBe(true);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).toBe("user-owned instructions\n");
	});
	test("purge preserves a preexisting model-instructions target", () => {
		const { home } = fixture();
		const target = join(home, "forge", "model-instructions.md");
		mkdirSync(join(target, ".."), { recursive: true });
		writeFileSync(target, "user-owned instructions\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(install(home, "uninstall", "--purge").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).toBe("user-owned instructions\n");
		expect(existsSync(join(home, "forge", "backups"))).toBe(false);
		expect(existsSync(join(home, "forge", "install-state.json"))).toBe(false);
	});
	test("preserves local overrides until replace or revert", () => {
		const { home } = fixture();
		install(home, "install", "--no-tools");
		const target = join(home, "agents", "forge-worker.toml");
		writeFileSync(target, "local override\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).toBe("local override\n");
		expect(install(home, "revert").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).not.toBe("local override\n");
	});
	test("replaces overrides, conservatively retains stale cache, and reports manual hook trust", () => {
		const { home } = fixture();
		install(home, "install", "--no-tools");
		const target = join(home, "agents", "forge-worker.toml");
		writeFileSync(target, "local override\n");
		const cache = join(home, "plugins", "cache", "codex-forge", "codex-forge");
		const stale = join(cache, "0.1.0-alpha.1");
		const current = join(cache, "0.1.0-alpha.4");
		mkdirSync(stale, { recursive: true });
		mkdirSync(current);
		expect(
			runInstaller(
				home,
				["install", "--no-tools", "--replace", "--purge-cache"],
				{ CODEX_SESSION_ID: "", CODEX_THREAD_ID: "" },
			).exitCode,
		).toBe(0);
		expect(readFileSync(target)).toEqual(
			readFileSync(
				join(ROOT, "plugins", "codex-forge", "agents", "forge-worker.toml"),
			),
		);
		expect(existsSync(stale)).toBe(true);
		expect(existsSync(current)).toBe(true);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(0);
		const report = JSON.parse(diagnosis.stdout.toString());
		expect(report.stale_cache_versions).toEqual(["0.1.0-alpha.1"]);
		expect(report.cache_retention.status).toBe("UNVERIFIED");
		expect(report.checks.hooks_enabled).toBe(true);
		expect(report.checks.plugin_registered).toBe(true);
		expect(report.hook_trust.status).toBe("UNVERIFIED");
		expect(
			runInstaller(home, ["doctor", "--json", "--purge-cache"], {
				CODEX_SESSION_ID: "",
				CODEX_THREAD_ID: "",
			}).exitCode,
		).toBe(0);
		expect(existsSync(stale)).toBe(true);
	});
	test("does not infer cross-process cache safety from caller session IDs", () => {
		const { home } = fixture();
		install(home, "install", "--no-tools");
		const stale = join(
			home,
			"plugins",
			"cache",
			"codex-forge",
			"codex-forge",
			"0.1.0-alpha.2",
		);
		mkdirSync(stale, { recursive: true });
		const result = runInstaller(home, ["doctor", "--json", "--purge-cache"], {
			CODEX_SESSION_ID: "active",
			CODEX_THREAD_ID: "active",
		});
		expect(result.exitCode).toBe(0);
		expect(existsSync(stale)).toBe(true);
		expect(result.stderr.toString()).toContain(
			"cross-process cache ownership is UNVERIFIED",
		);
	});
	test("records an alpha.3-session to alpha.4 upgrade as unverified cache retention", () => {
		const { home } = fixture();
		// Seed the persisted state boundary from the alpha.3 release without
		// changing the checked-out alpha.4 source under test. This exercises the
		// supported installer upgrade path; the retained cache root below is only
		// a fixture for the upstream behavior Forge cannot verify.
		install(home, "install", "--no-tools");
		const statePath = join(home, "forge", "install-state.json");
		const priorState = JSON.parse(readFileSync(statePath, "utf8"));
		priorState.plugin_version = "0.1.0-alpha.3";
		writeFileSync(statePath, `${JSON.stringify(priorState, null, 2)}\n`);
		const beforeUpgrade = JSON.parse(
			install(home, "doctor", "--json").stdout.toString(),
		);
		expect(beforeUpgrade.installed_version).toBe("0.1.0-alpha.3");
		expect(beforeUpgrade.upgrade_available).toBe(true);
		const alpha3 = join(
			home,
			"plugins",
			"cache",
			"codex-forge",
			"codex-forge",
			"0.1.0-alpha.3",
		);
		// Upstream cache retention is intentionally UNVERIFIED, not a live-session proof.
		mkdirSync(alpha3, { recursive: true });
		const result = runInstaller(
			home,
			["install", "--no-tools", "--purge-cache"],
			{
				CODEX_SESSION_ID: "alpha3-session",
				CODEX_THREAD_ID: "alpha3-thread",
			},
		);
		expect(result.exitCode).toBe(0);
		const state = JSON.parse(
			readFileSync(join(home, "forge", "install-state.json"), "utf8"),
		);
		expect(state.plugin_version).toBe("0.1.0-alpha.4");
		expect(existsSync(alpha3)).toBe(true);
		const report = JSON.parse(
			install(home, "doctor", "--json").stdout.toString(),
		);
		expect(report.cache_versions).toContain("0.1.0-alpha.3");
		expect(report.cache_retention.status).toBe("UNVERIFIED");
	});
	test("rejects invalid TOML without creating state", () => {
		const { home } = fixture("[broken\n");
		const result = install(home, "install", "--no-tools");
		expect(result.exitCode).toBe(2);
		expect(existsSync(join(home, "forge", "install-state.json"))).toBe(false);
	});
	test("rejects the obsolete force compatibility alias", () => {
		const { home } = fixture();
		const result = install(home, "install", "--force", "--no-tools");
		expect(result.exitCode).toBe(2);
		expect(existsSync(join(home, "forge", "install-state.json"))).toBe(false);
	});
	test("purge removes overrides and Forge state", () => {
		const { home } = fixture();
		install(home, "install", "--no-tools");
		writeFileSync(join(home, "agents", "forge-worker.toml"), "override\n");
		expect(install(home, "uninstall", "--purge").exitCode).toBe(0);
		expect(existsSync(join(home, "forge"))).toBe(false);
	});
	test("doctor rejects absent and disabled plugin registrations", () => {
		const { home } = fixture("");
		install(home, "install", "--no-tools");
		let diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(1);
		let report = JSON.parse(diagnosis.stdout.toString());
		expect(report.healthy).toBe(false);
		expect(report.checks.plugin_registered).toBe(false);
		writeFileSync(
			join(home, "config.toml"),
			`${readFileSync(join(home, "config.toml"), "utf8")}\n[plugins."codex-forge@disabled"]\nenabled = false\n`,
		);
		diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(1);
		report = JSON.parse(diagnosis.stdout.toString());
		expect(report.plugin_selectors).toEqual([]);
		expect(report.configured_plugin_selectors).toEqual([
			"codex-forge@disabled",
		]);
	});
	test("doctor rejects a modified effective model-instruction asset", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		writeFileSync(
			join(home, "forge", "model-instructions.md"),
			"local replacement\n",
		);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(1);
		const report = JSON.parse(diagnosis.stdout.toString());
		expect(report.healthy).toBe(false);
		expect(report.checks.model_instructions).toBe(false);
		expect(report.override_count).toBe(1);
	});
	test("doctor rejects modified effective developer instructions", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const path = join(home, "config.toml");
		writeFileSync(
			path,
			readFileSync(path, "utf8").replace(
				/developer_instructions = .*/,
				'developer_instructions = "Codex Forge is active, modified"',
			),
		);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(1);
		const report = JSON.parse(diagnosis.stdout.toString());
		expect(report.healthy).toBe(false);
		expect(report.checks.developer_instructions).toBe(false);
	});
	test("doctor rejects a modified effective model catalog", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const target = join(home, "forge", "model-catalog.json");
		const catalog = JSON.parse(readFileSync(target, "utf8"));
		catalog.models[0].description = "local replacement";
		writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(1);
		const report = JSON.parse(diagnosis.stdout.toString());
		expect(report.healthy).toBe(false);
		expect(report.checks.model_catalog).toBe(false);
	});
	test("migrates a legacy generated-catalog mapping without invoking Codex", () => {
		const { root, home } = fixture();
		const bin = join(root, "bin");
		const invocation = join(root, "codex-invocation.json");
		mkdirSync(bin);
		const fakeCodex = join(bin, "codex");
		writeFileSync(
			fakeCodex,
			'#!/usr/bin/env bun\nimport { writeFileSync } from "node:fs";\nwriteFileSync(process.env.INVOCATION, JSON.stringify(process.argv.slice(2)));\n',
		);
		chmodSync(fakeCodex, 0o755);
		const environment = {
			INVOCATION: invocation,
			PATH: `${bin}${delimiter}${process.env.PATH}`,
		};
		expect(
			runInstaller(home, ["install", "--no-tools"], environment).exitCode,
		).toBe(0);
		expect(existsSync(invocation)).toBe(false);
		const statePath = join(home, "forge", "install-state.json");
		const state = JSON.parse(readFileSync(statePath, "utf8"));
		const catalogMapping = state.file_mappings.find(
			(item) => item.target === join(home, "forge", "model-catalog.json"),
		);
		catalogMapping.source = "generated/model-catalog.json";
		writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
		expect(runInstaller(home, ["revert"], environment).exitCode).toBe(0);
		expect(existsSync(invocation)).toBe(false);
		const migrated = JSON.parse(readFileSync(statePath, "utf8"));
		const migratedMapping = migrated.file_mappings.find(
			(item) => item.target === join(home, "forge", "model-catalog.json"),
		);
		expect(migratedMapping.source).toBe("assets/model-catalog.json");
		expect(readFileSync(migratedMapping.target)).toEqual(
			readFileSync(
				join(ROOT, "plugins", "codex-forge", "assets", "model-catalog.json"),
			),
		);
	});
	test("rejects tampered state paths before uninstall or revert mutations", () => {
		const { root, home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const configBefore = readFileSync(join(home, "config.toml"), "utf8");
		const statePath = join(home, "forge", "install-state.json");
		const originalState = JSON.parse(readFileSync(statePath, "utf8"));
		const cases = [
			{
				target: join(root, "victim.txt"),
				source: originalState.file_mappings[0].source,
			},
			{
				target: join(home, "agents", "nested", "forge-worker.toml"),
				source: "agents/forge-worker.toml",
			},
		];
		for (const item of cases) {
			mkdirSync(join(item.target, ".."), { recursive: true });
			writeFileSync(item.target, "user-owned\n");
			const state = structuredClone(originalState);
			state.file_mappings[0] = { ...state.file_mappings[0], ...item };
			writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
			for (const args of [["uninstall", "--purge"], ["revert"]]) {
				const result = runInstaller(home, args);
				expect(result.exitCode).toBe(2);
				expect(result.stderr.toString()).toContain("unmanaged file mapping");
				expect(readFileSync(item.target, "utf8")).toBe("user-owned\n");
				expect(readFileSync(join(home, "config.toml"), "utf8")).toBe(
					configBefore,
				);
			}
		}
	});
	test("uses the native hook default and preserves an explicit disabled setting", () => {
		const native = fixture('[plugins."codex-forge@test"]\nenabled = true\n');
		expect(install(native.home, "install", "--no-tools").exitCode).toBe(0);
		let report = JSON.parse(
			install(native.home, "doctor", "--json").stdout.toString(),
		);
		expect(report.checks.hooks_enabled).toBe(true);
		const disabled = fixture(
			'[features]\nhooks = false\n\n[plugins."codex-forge@test"]\nenabled = true\n',
		);
		expect(install(disabled.home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(disabled.home, "config.toml"), "utf8"))
				.features.hooks,
		).toBe(false);
		const diagnosis = install(disabled.home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(1);
		report = JSON.parse(diagnosis.stdout.toString());
		expect(report.checks.hooks_enabled).toBe(false);
	});
	test("purge delegates removal for active and disabled plugin registrations", () => {
		const { root, home } = fixture(
			'[plugins."codex-forge@test"]\nenabled = true\n\n[plugins."codex-forge@disabled"]\nenabled = false\n',
		);
		const bin = join(root, "bin");
		const invocation = join(root, "invocation.json");
		mkdirSync(bin);
		const fakeCodex = join(bin, "codex");
		writeFileSync(
			fakeCodex,
			'#!/usr/bin/env bun\nimport { existsSync, readFileSync, writeFileSync } from "node:fs";\nconst path = process.env.INVOCATION;\nconst calls = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];\ncalls.push(process.argv.slice(2));\nwriteFileSync(path, JSON.stringify(calls));\n',
		);
		chmodSync(fakeCodex, 0o755);
		const environment = {
			INVOCATION: invocation,
			PATH: `${bin}${delimiter}${process.env.PATH}`,
		};
		expect(
			runInstaller(home, ["install", "--no-tools"], environment).exitCode,
		).toBe(0);
		expect(
			runInstaller(home, ["uninstall", "--purge"], environment).exitCode,
		).toBe(0);
		expect(JSON.parse(readFileSync(invocation, "utf8"))).toEqual([
			["plugin", "remove", "codex-forge@disabled", "--json"],
			["plugin", "remove", "codex-forge@test", "--json"],
		]);
	});
});
