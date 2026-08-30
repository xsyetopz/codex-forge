import { afterEach, describe, expect, test } from "bun:test";
import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { TOML } from "bun";

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

function _fakeCodex(
	root,
	{
		installed = true,
		marketplace = true,
		fail = "",
		failBun = "",
		codexVersion = "0.151.0",
		entry,
		pluginListOutput,
	} = {},
) {
	const bin = join(root, "bin");
	mkdirSync(bin);
	const path = join(bin, "codex");
	const installedJson =
		pluginListOutput ??
		(installed
			? JSON.stringify({
					installed: [
						entry ?? {
							pluginId: "codex-forge@codex-forge",
							name: "codex-forge",
							marketplaceName: "codex-forge",
						},
					],
				})
			: '{"installed":[]}');
	const marketplaceText = marketplace
		? "codex-forge  /checkout"
		: "other  /checkout";
	writeFileSync(
		path,
		`#!/bin/sh
printf 'codex %s\\n' "$*" >> "$CODEX_REINSTALL_LOG"
if [ "$*" = "plugin list --json" ]; then printf '%s\\n' '${installedJson}'; fi
if [ "$*" = "plugin marketplace list" ]; then printf '%s\\n' '${marketplaceText}'; fi
if [ "$*" = "--version" ]; then printf 'codex %s\\n' '${codexVersion}'; fi
${fail ? `case "$*" in "${fail}"*) exit 7 ;; esac` : ""}
exit 0
`,
	);
	chmodSync(path, 0o755);
	const bun = join(bin, "bun");
	writeFileSync(
		bun,
		`#!/bin/sh
printf 'bun %s\\n' "$*" >> "$CODEX_REINSTALL_LOG"
${failBun ? `case "$*" in *"${failBun}"*) exit 7 ;; esac` : ""}
exec ${process.execPath} "$@"
`,
	);
	chmodSync(bun, 0o755);
	return { bin, bun, log: join(root, "codex.log") };
}

function _snapshotTree(root) {
	const result = {};
	const visit = (path) => {
		const name = relative(root, path) || ".";
		const stat = lstatSync(path);
		if (stat.isSymbolicLink())
			result[name] = { type: "symlink", target: readlinkSync(path) };
		else if (stat.isDirectory()) {
			result[name] = { type: "directory" };
			for (const child of readdirSync(path)) visit(join(path, child));
		} else
			result[name] = {
				type: "file",
				bytes: readFileSync(path).toString("base64"),
			};
	};
	visit(root);
	return result;
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
});
