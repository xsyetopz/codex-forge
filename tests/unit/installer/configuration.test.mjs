import { afterEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { TOML } from "bun";
import { parseManagedConfig } from "../../../plugins/codex-forge/scripts/installer/owners/config.mjs";

const ROOT = resolve(import.meta.dir, "../../..");
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
		env: {
			...process.env,
			NODE_ENV: "test",
			CODEX_FORGE_PROCESS_TABLE: "",
			...extraEnvironment,
			CODEX_HOME: home,
		},
		stdout: "pipe",
		stderr: "pipe",
	});
}

describe("installer lifecycle", () => {
	test("installer developer instructions round-trip through the repository TOML parser", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const config = readFileSync(join(home, "config.toml"), "utf8");
		expect(
			config.startsWith(
				"#:schema https://developers.openai.com/codex/config-schema.json\n",
			),
		).toBe(true);
		const parsed = TOML.parse(config);
		const source = readFileSync(
			join(ROOT, "plugins/codex-forge/assets/developer-instructions.txt"),
			"utf8",
		).trim();
		expect(parsed.developer_instructions).toBe(source);
		expect(parsed.tui.status_line).toEqual([
			"model-with-reasoning",
			"current-dir",
			"context-used",
			"used-tokens",
			"five-hour-limit",
			"weekly-limit",
		]);
		expect(parsed.tui.terminal_title).toEqual([
			"project",
			"git-branch",
			"status",
			"thread",
			"task-progress",
		]);
	});

	test("normalizes the schema directive and preserves unrelated TUI keys", () => {
		const { home } = fixture(
			'#:schema https://developers.openai.com/codex/config-schema.jso\nfoo = "keep"\n\n[tui]\nnotifications = false\n',
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const config = readFileSync(join(home, "config.toml"), "utf8");
		expect(config.split("\n")[0]).toBe(
			"#:schema https://developers.openai.com/codex/config-schema.json",
		);
		expect(config).not.toContain("config-schema.jso\n");
		expect((config.match(/^#:schema /gm) ?? []).length).toBe(1);
		expect(TOML.parse(config).tui.notifications).toBe(false);
	});

	test("config marker parser rejects malformed ownership shapes", () => {
		for (const value of [
			"# >>> codex-forge >>>\n# >>> codex-forge >>>\n# <<< codex-forge <<<\n",
			"# <<< codex-forge <<<\n# >>> codex-forge >>>\n",
			"# >>> codex-forge >>>x\n",
			"# >>> codex-forge >>>\nuser\n",
			"# >>> codex-forge >>>\n# <<< codex-forge <<<\n# <<< codex-forge <<<\n",
		])
			expect(() => parseManagedConfig(value)).toThrow();
		expect(() =>
			parseManagedConfig("foo = true\n", { requirePresent: true }),
		).toThrow();
	});
	test("public lifecycle refuses duplicate, missing, and unknown config scopes", () => {
		for (const mutate of [
			(value) =>
				value.replace(
					/(\[agents\]\n)(# >>> codex-forge >>>[\s\S]*?# <<< codex-forge <<<\n)/m,
					"$1$2$2",
				),
			(value) =>
				value.replace(
					/(\[features\]\n)# >>> codex-forge >>>[\s\S]*?# <<< codex-forge <<<\n/m,
					"$1",
				),
			(value) =>
				value.replace(
					"[features]\n# >>> codex-forge >>>",
					"[unknown]\n# >>> codex-forge >>>",
				),
		]) {
			const { home } = fixture();
			expect(install(home, "install", "--no-tools").exitCode).toBe(0);
			const configPath = join(home, "config.toml");
			const original = readFileSync(configPath, "utf8");
			const mutated = mutate(original);
			expect(mutated).not.toBe(original);
			expect(
				(mutated.match(/# >>> codex-forge >>>/g) ?? []).length,
			).toBeGreaterThan(0);
			writeFileSync(configPath, mutated);
			expect(install(home, "install", "--no-tools").exitCode).toBe(2);
		}
	});
	test("rejects forged inserted-prefix state without mutating uninstall or revert", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const originalState = readFileSync(statePath);
		const configBefore = readFileSync(join(home, "config.toml"));
		const workerBefore = readFileSync(
			join(home, "agents", "forge-worker.toml"),
		);
		const target = join(home, "AGENTS.md");
		const agentsBefore = readFileSync(target);
		const state = JSON.parse(originalState.toString());
		state.global_agents.inserted_prefix = "\n\n";
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		expect(install(home, "uninstall").exitCode).toBe(2);
		expect(readFileSync(join(home, "config.toml"))).toEqual(configBefore);
		expect(readFileSync(join(home, "agents", "forge-worker.toml"))).toEqual(
			workerBefore,
		);
		expect(readFileSync(target)).toEqual(agentsBefore);
		writeFileSync(statePath, originalState);
		state.global_agents.inserted_prefix = "\n\n";
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		expect(install(home, "revert").exitCode).toBe(2);
		expect(readFileSync(join(home, "config.toml"))).toEqual(configBefore);
		expect(readFileSync(join(home, "agents", "forge-worker.toml"))).toEqual(
			workerBefore,
		);
		expect(readFileSync(target)).toEqual(agentsBefore);
	});
	test("migrates a prior Forge-managed default cap from 3 to 8", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		writeFileSync(
			join(home, "config.toml"),
			readFileSync(join(home, "config.toml"), "utf8").replace(
				"max_concurrent_threads_per_session = 8",
				"max_concurrent_threads_per_session = 3",
			),
		);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(join(home, "config.toml"), "utf8")).agents
				.max_concurrent_threads_per_session,
		).toBe(8);
	});
	test("adds the TUI scope to a pre-TUI managed installation", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const configPath = join(home, "config.toml");
		const legacy = readFileSync(configPath, "utf8").replace(
			/\n# >>> codex-forge >>>\n\[tui]\n[\s\S]*?# <<< codex-forge <<<\n/,
			"",
		);
		expect(legacy).not.toContain("[tui]");
		writeFileSync(configPath, legacy);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(
			TOML.parse(readFileSync(configPath, "utf8")).tui.status_line,
		).toContain("context-used");
	});
	test("moves valid sandbox settings outside the Forge-owned slice", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const configPath = join(home, "config.toml");
		const current = readFileSync(configPath, "utf8");
		writeFileSync(
			configPath,
			current.replace(
				"[sandbox_workspace_write]\nnetwork_access = true\n# <<< codex-forge <<<",
				'[sandbox_workspace_write]\nnetwork_access = true\nexclude_slash_tmp = true\nwritable_roots = ["/tmp/forge-extra"]\n# <<< codex-forge <<<',
			),
		);
		expect(install(home, "uninstall").exitCode).toBe(0);
		const uninstalled = readFileSync(configPath, "utf8");
		expect(uninstalled).not.toContain("# >>> codex-forge >>>");
		expect(
			TOML.parse(uninstalled).sandbox_workspace_write.writable_roots,
		).toEqual(["/tmp/forge-extra"]);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const migrated = readFileSync(configPath, "utf8");
		const parsed = TOML.parse(migrated);
		expect(parsed.sandbox_workspace_write.exclude_slash_tmp).toBe(true);
		expect(parsed.sandbox_workspace_write.writable_roots).toEqual([
			"/tmp/forge-extra",
		]);
		expect(migrated).toMatch(
			/\[sandbox_workspace_write]\n# >>> codex-forge >>>\nnetwork_access = true\n# <<< codex-forge <<<\nexclude_slash_tmp = true\nwritable_roots/,
		);
	});
	test("preserves a customized cap inside a Forge-managed block", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		writeFileSync(
			join(home, "config.toml"),
			readFileSync(join(home, "config.toml"), "utf8").replace(
				"max_concurrent_threads_per_session = 8",
				"max_concurrent_threads_per_session = 6",
			),
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
		expect(firstInstall).toContain("# >>> codex-forge >>>");
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
});
