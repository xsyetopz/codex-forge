#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmdirSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOML } from "bun";
import { mergeConfig, stripManaged } from "./installer/config.mjs";
import {
	fileSha,
	installFiles,
	revertFiles,
	uninstallFiles,
} from "./installer/files.mjs";
import { which } from "./lib/process.mjs";

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha = (text) => createHash("sha256").update(text).digest("hex");
const readJson = (path, fallback = {}) =>
	existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
const pluginManifest = () =>
	readJson(join(PLUGIN_ROOT, ".codex-plugin", "plugin.json"));
const codexHome = () =>
	process.env.CODEX_HOME
		? resolve(process.env.CODEX_HOME.replace(/^~(?=$|[\\/])/, homedir()))
		: join(homedir(), ".codex");

function directories(path) {
	if (!existsSync(path)) return [];
	return readdirSync(path)
		.map((name) => join(path, name))
		.filter((item) => statSync(item).isDirectory());
}

function cachedInstalls(home) {
	const name = pluginManifest().name;
	return directories(join(home, "plugins", "cache"))
		.flatMap((marketplace) => directories(join(marketplace, name)))
		.sort();
}

function purgeCachedInstalls(home, keepVersion) {
	const removed = [];
	for (const path of cachedInstalls(home)) {
		if (keepVersion !== null && basename(path) === keepVersion) continue;
		rmSync(path, { recursive: true, force: true });
		removed.push(path);
		for (const parent of [dirname(path), dirname(dirname(path))])
			try {
				rmdirSync(parent);
			} catch {}
	}
	return removed;
}

function pluginSelectors(configPath, { activeOnly = false } = {}) {
	if (!existsSync(configPath)) return [];
	let plugins;
	try {
		plugins = TOML.parse(readFileSync(configPath, "utf8")).plugins ?? {};
	} catch {
		return [];
	}
	if (!plugins || typeof plugins !== "object" || Array.isArray(plugins))
		return [];
	const name = pluginManifest().name;
	return Object.entries(plugins)
		.filter(([selector, settings]) => {
			if (selector !== name && !selector.startsWith(`${name}@`)) return false;
			return (
				!activeOnly ||
				(settings && typeof settings === "object" && settings.enabled !== false)
			);
		})
		.map(([selector]) => selector)
		.sort();
}

async function removePluginInstallations(home, configPath) {
	const selectors = pluginSelectors(configPath);
	if (!selectors.length) return true;
	const executable = await which("codex");
	if (!executable) return false;
	return selectors.every(
		(selector) =>
			spawnSync(executable, ["plugin", "remove", selector, "--json"], {
				env: { ...process.env, CODEX_HOME: home },
				encoding: "utf8",
			}).status === 0,
	);
}

function nextBackup(home) {
	const now = new Date();
	const stamp = [
		now.getFullYear(),
		now.getMonth() + 1,
		now.getDate(),
		now.getHours(),
		now.getMinutes(),
		now.getSeconds(),
	].map((item) => String(item).padStart(2, "0"));
	const base = join(
		home,
		"forge",
		"backups",
		`${stamp.slice(0, 3).join("")}-${stamp.slice(3).join("")}`,
	);
	let backup = base;
	for (let suffix = 1; existsSync(backup); suffix += 1)
		backup = `${base}-${suffix}`;
	return backup;
}

function originalConfig(current, priorState) {
	if (
		Object.keys(priorState).length &&
		sha(current) === priorState.config_after_sha256
	) {
		const prior = priorState.backup
			? join(priorState.backup, "config.toml")
			: "";
		if (prior && existsSync(prior)) return readFileSync(prior, "utf8");
	}
	if (current.includes("codex-forge:")) {
		process.stderr.write(
			"[cf] existing Forge config was modified; preserving non-Forge edits during reinstall\n",
		);
		return stripManaged(current);
	}
	return current;
}

async function install(options) {
	const home = codexHome();
	mkdirSync(home, { recursive: true });
	const configPath = join(home, "config.toml");
	const current = existsSync(configPath)
		? readFileSync(configPath, "utf8")
		: "";
	const statePath = join(home, "forge", "install-state.json");
	const priorState = readJson(statePath);
	const old = originalConfig(current, priorState);
	try {
		if (old.trim()) TOML.parse(old);
	} catch (error) {
		process.stderr.write(
			`[cf] refusing to modify invalid config.toml: ${error.message}\n`,
		);
		return 2;
	}
	const backup = nextBackup(home);
	mkdirSync(dirname(backup), { recursive: true });
	mkdirSync(backup, { recursive: false });
	writeFileSync(join(backup, "config.toml"), old);
	const mappings = installFiles(home, PLUGIN_ROOT, backup, priorState, {
		force: options.replace,
	});
	const [updated, createdTables] = mergeConfig(old, home, PLUGIN_ROOT);
	writeFileSync(configPath, updated);
	const state = {
		plugin_version: pluginManifest().version,
		installed_at: Date.now() / 1000,
		backup,
		config_before_sha256: sha(old),
		config_after_sha256: sha(updated),
		files: mappings.map((item) => item.target),
		file_mappings: mappings,
		created_tables: createdTables,
	};
	mkdirSync(dirname(statePath), { recursive: true });
	writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
	if (options.purgeCache) purgeCachedInstalls(home, state.plugin_version);
	if (!options.noTools) {
		const result = spawnSync(
			"bun",
			[join(PLUGIN_ROOT, "scripts", "tools.mjs"), "install"],
			{ stdio: "inherit" },
		);
		if (result.status)
			process.stderr.write(
				"[cf] Some CLI helpers could not be installed; Forge configuration is installed.\n",
			);
	}
	console.log(`[cf] installed into ${home}`);
	console.log(`[cf] backup: ${backup}`);
	return 0;
}

async function uninstall(options) {
	const home = codexHome();
	const configPath = join(home, "config.toml");
	const statePath = join(home, "forge", "install-state.json");
	const state = readJson(statePath);
	const current = existsSync(configPath)
		? readFileSync(configPath, "utf8")
		: "";
	const backup = state.backup ? join(state.backup, "config.toml") : null;
	if (
		Object.keys(state).length &&
		sha(current) === state.config_after_sha256 &&
		backup &&
		existsSync(backup)
	) {
		writeFileSync(configPath, readFileSync(backup));
		console.log("[cf] restored pre-install config.toml");
	} else {
		const cleaned = stripManaged(current);
		if (cleaned.trim()) TOML.parse(cleaned);
		writeFileSync(configPath, cleaned.trim() ? `${cleaned.trimEnd()}\n` : "");
		if (backup && existsSync(backup))
			console.log(
				`[cf] config changed since install; removed Forge-managed values. Original backup: ${backup}`,
			);
	}
	uninstallFiles(home, state, { force: options.purge });
	rmSync(statePath, { force: true });
	let pluginsRemoved = true;
	if (options.purge) {
		pluginsRemoved = await removePluginInstallations(home, configPath);
		purgeCachedInstalls(home, null);
		rmSync(join(home, "forge"), { recursive: true, force: true });
	}
	console.log("[cf] uninstalled user-level Forge configuration");
	if (!pluginsRemoved) {
		process.stderr.write(
			"[cf] unable to remove installed Forge plugin registrations\n",
		);
		return 1;
	}
	return 0;
}

function revert() {
	const statePath = join(codexHome(), "forge", "install-state.json");
	if (!existsSync(statePath)) {
		process.stderr.write("[cf] no Forge installation state found\n");
		return 1;
	}
	const state = readJson(statePath);
	const mappings = state.file_mappings ?? [];
	if (!mappings.length) {
		process.stderr.write(
			"[cf] installation predates hashed file mappings; reinstall first\n",
		);
		return 2;
	}
	let count;
	try {
		count = revertFiles(PLUGIN_ROOT, mappings);
	} catch (error) {
		process.stderr.write(`[cf] ${error.message}\n`);
		return 2;
	}
	writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
	console.log(`[cf] reverted ${count} mapped files to plugin sources`);
	return 0;
}

async function doctor(options) {
	const home = codexHome();
	const configPath = join(home, "config.toml");
	const statePath = join(home, "forge", "install-state.json");
	const state = readJson(statePath);
	const sourceVersion = pluginManifest().version;
	if (options.purgeCache) purgeCachedInstalls(home, sourceVersion);
	let parsedConfig = {};
	let parsed = true;
	try {
		parsedConfig = existsSync(configPath)
			? TOML.parse(readFileSync(configPath, "utf8"))
			: {};
	} catch {
		parsed = false;
	}
	const checks = {
		config:
			existsSync(configPath) &&
			readFileSync(configPath, "utf8").includes("codex-forge:root"),
		config_toml: parsed,
		hooks_enabled: parsedConfig.features?.hooks === true,
		plugin_registered:
			pluginSelectors(configPath, { activeOnly: true }).length > 0,
		model_instructions: existsSync(
			join(home, "forge", "model-instructions.md"),
		),
		compact_prompt: existsSync(join(home, "forge", "compact-prompt.md")),
		rules: existsSync(join(home, "rules", "forge.rules")),
		agent_roles:
			existsSync(join(home, "agents")) &&
			readdirSync(join(home, "agents")).filter((name) =>
				/^forge-.*\.toml$/.test(name),
			).length >= 9,
	};
	const mappings = state.file_mappings ?? [];
	const overrides = [];
	const sourcesChanged = [];
	for (const item of mappings) {
		const source = join(PLUGIN_ROOT, item.source);
		if (!existsSync(source) || fileSha(source) !== item.source_sha256)
			sourcesChanged.push(item.source);
		if (
			existsSync(item.target) &&
			fileSha(item.target) !== item.installed_sha256
		)
			overrides.push(item.target);
	}
	const upgradeAvailable = Boolean(
		Object.keys(state).length &&
			(state.plugin_version !== sourceVersion || sourcesChanged.length),
	);
	const cacheVersions = cachedInstalls(home).map((path) => basename(path));
	const diagnosis = {
		healthy: Object.values(checks).every(Boolean) && !upgradeAvailable,
		checks,
		source_version: sourceVersion,
		installed_version: state.plugin_version,
		upgrade_available: upgradeAvailable,
		override_count: overrides.length,
		cache_versions: cacheVersions,
		stale_cache_versions: cacheVersions.filter(
			(version) => version !== sourceVersion,
		),
		plugin_selectors: pluginSelectors(configPath, { activeOnly: true }),
		configured_plugin_selectors: pluginSelectors(configPath),
		hook_trust: {
			status: "UNVERIFIED",
			action: "manual /hooks review and trust required",
		},
	};
	if (options.json) {
		console.log(JSON.stringify(diagnosis));
		return diagnosis.healthy ? 0 : 1;
	}
	for (const [name, ok] of Object.entries(checks))
		console.log(`${name.replaceAll("_", " ")}: ${ok ? "ok" : "missing"}`);
	console.log(`installed version: ${diagnosis.installed_version ?? "missing"}`);
	console.log(`source version: ${sourceVersion}`);
	console.log(`upgrade available: ${upgradeAvailable ? "yes" : "no"}`);
	console.log(`local overrides: ${overrides.length}`);
	console.log(
		`stale cached installs: ${diagnosis.stale_cache_versions.length}`,
	);
	console.log(
		"hook trust: UNVERIFIED (manual /hooks review and trust required; installer cannot inspect or grant trust)",
	);
	const codex = await which("codex");
	if (codex) {
		const result = spawnSync(codex, ["--version"], {
			encoding: "utf8",
			timeout: 10_000,
		});
		console.log(
			`codex: ${`${result.stdout ?? ""}${result.stderr ?? ""}`.trim()}`,
		);
	} else console.log("codex: not found");
	return diagnosis.healthy ? 0 : 1;
}

function parseArguments(arguments_) {
	const [command, ...flags] = arguments_;
	if (!["install", "uninstall", "revert", "doctor"].includes(command))
		return null;
	const allowed = {
		install: new Set(["--no-tools", "--replace", "--purge-cache"]),
		uninstall: new Set(["--purge"]),
		revert: new Set(),
		doctor: new Set(["--json", "--purge-cache"]),
	}[command];
	if (flags.some((flag) => !allowed.has(flag))) return null;
	return {
		command,
		noTools: flags.includes("--no-tools"),
		replace: flags.includes("--replace"),
		purgeCache: flags.includes("--purge-cache"),
		purge: flags.includes("--purge"),
		json: flags.includes("--json"),
	};
}

export async function main(arguments_ = process.argv.slice(2)) {
	const options = parseArguments(arguments_);
	if (!options) {
		process.stderr.write(
			"Usage: bun install.mjs <install|uninstall|revert|doctor> [options]\n",
		);
		return 2;
	}
	return { install, uninstall, revert, doctor }[options.command](options);
}

if (import.meta.main) process.exit(await main());
