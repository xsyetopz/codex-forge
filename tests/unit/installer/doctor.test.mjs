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
import { delimiter, join, relative, resolve } from "node:path";
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

function fakeCodex(
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
	test("doctor requires Codex CLI 0.151.0 in JSON and human output", () => {
		const { root, home } = fixture();
		const fake = fakeCodex(root, { codexVersion: "0.150.1" });
		const environment = { PATH: `${fake.bin}${delimiter}${process.env.PATH}` };
		expect(
			runInstaller(home, ["install", "--no-tools"], environment).exitCode,
		).toBe(0);
		let diagnosis = runInstaller(home, ["doctor", "--json"], environment);
		let report = JSON.parse(diagnosis.stdout.toString());
		expect(diagnosis.exitCode).toBe(1);
		expect(report.healthy).toBe(false);
		expect(report.checks.codex_cli_compatible).toBe(false);
		expect(report.codex_cli.version).toBe("0.150.1");

		diagnosis = runInstaller(home, ["doctor"], environment);
		expect(diagnosis.exitCode).toBe(1);
		expect(diagnosis.stdout.toString()).toContain("required >= 0.151.0");

		writeFileSync(
			join(fake.bin, "codex"),
			"#!/bin/sh\nprintf 'codex-test\\n'\n",
		);
		chmodSync(join(fake.bin, "codex"), 0o755);
		diagnosis = runInstaller(home, ["doctor", "--json"], environment);
		report = JSON.parse(diagnosis.stdout.toString());
		expect(diagnosis.exitCode).toBe(1);
		expect(report.codex_cli.version).toBeNull();
		expect(report.codex_cli.compatible).toBe(false);

		rmSync(join(fake.bin, "codex"));
		diagnosis = runInstaller(home, ["doctor", "--json"], { PATH: fake.bin });
		report = JSON.parse(diagnosis.stdout.toString());
		expect(diagnosis.exitCode).toBe(1);
		expect(report.codex_cli.available).toBe(false);
		expect(report.checks.codex_cli_compatible).toBe(false);
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
