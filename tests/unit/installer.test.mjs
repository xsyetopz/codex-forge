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
	config = 'foo = "keep"\n\n[features]\nhooks = false\n\n[agents]\nenabled = true\n\n[agents.custom]\ndescription = "keep"\nconfig_file = "/tmp/custom.toml"\n\n[apps._default]\nextra = "keep"\n\n[plugins."codex-forge@test"]\nenabled = true\n',
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
	test("merges and restores unrelated configuration", () => {
		const { home, original } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const parsed = TOML.parse(readFileSync(join(home, "config.toml"), "utf8"));
		expect(parsed.foo).toBe("keep");
		expect(parsed.features.hooks).toBe(true);
		expect(parsed.model).toBe("gpt-5.6-sol");
		expect(parsed.approval_policy).toBe("on-request");
		expect(parsed.agents.max_concurrent_threads_per_session).toBe(3);
		expect(parsed.agents["forge-worker"].config_file).toBeTruthy();
		expect(parsed.features.token_budget).toBeUndefined();
		expect(parsed.profiles).toBeUndefined();
		expect(parsed.agents.custom.description).toBe("keep");
		expect(parsed.apps._default.extra).toBe("keep");
		const state = JSON.parse(
			readFileSync(join(home, "forge", "install-state.json"), "utf8"),
		);
		expect(state.plugin_version).toBe("0.1.0-alpha.2");
		expect(state.file_mappings).toHaveLength(12);
		expect(
			state.file_mappings.every(
				(item) => item.source_sha256 && item.installed_sha256,
			),
		).toBe(true);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(0);
		expect(JSON.parse(diagnosis.stdout.toString()).healthy).toBe(true);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(join(home, "config.toml"), "utf8")).toBe(original);
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
	test("replaces overrides, purges stale cache, and reports manual hook trust", () => {
		const { home } = fixture();
		install(home, "install", "--no-tools");
		const target = join(home, "agents", "forge-worker.toml");
		writeFileSync(target, "local override\n");
		const cache = join(home, "plugins", "cache", "codex-forge", "codex-forge");
		const stale = join(cache, "0.1.0-alpha.1");
		const current = join(cache, "0.1.0-alpha.2");
		mkdirSync(stale, { recursive: true });
		mkdirSync(current);
		expect(
			install(home, "install", "--no-tools", "--replace", "--purge-cache")
				.exitCode,
		).toBe(0);
		expect(readFileSync(target)).toEqual(
			readFileSync(
				join(ROOT, "plugins", "codex-forge", "agents", "forge-worker.toml"),
			),
		);
		expect(existsSync(stale)).toBe(false);
		expect(existsSync(current)).toBe(true);
		mkdirSync(stale);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(0);
		const report = JSON.parse(diagnosis.stdout.toString());
		expect(report.stale_cache_versions).toEqual(["0.1.0-alpha.1"]);
		expect(report.checks.hooks_enabled).toBe(true);
		expect(report.checks.plugin_registered).toBe(true);
		expect(report.hook_trust.status).toBe("UNVERIFIED");
		expect(install(home, "doctor", "--json", "--purge-cache").exitCode).toBe(0);
		expect(existsSync(stale)).toBe(false);
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
