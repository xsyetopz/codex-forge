import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TOML } from "bun";
import { which } from "../lib/process.mjs";
import { PLUGIN_ROOT } from "./owners/cache.mjs";

const PLUGIN = "codex-forge";
const MARKETPLACE = "codex-forge";
const SELECTOR = `${PLUGIN}@${MARKETPLACE}`;
const readJson = (path, fallback = {}) =>
	existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
const pluginManifest = () =>
	readJson(join(PLUGIN_ROOT, ".codex-plugin", "plugin.json"));

function runCommand(command, args, home, capture = false) {
	const result = spawnSync(command, args, {
		env: { ...process.env, CODEX_HOME: home },
		encoding: "utf8",
		stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
	});
	if (result.error || result.status !== 0) {
		const detail = `${result.stderr ?? ""}`.trim();
		throw new Error(
			`${command} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`,
		);
	}
	return result;
}
function forgePluginInstalled(codex, home) {
	const result = runCommand(codex, ["plugin", "list", "--json"], home, true);
	if (
		process.env.NODE_ENV === "test" &&
		process.env.CODEX_FORGE_PROCESS_TABLE_AFTER_QUERY !== undefined
	)
		process.env.CODEX_FORGE_PROCESS_TABLE =
			process.env.CODEX_FORGE_PROCESS_TABLE_AFTER_QUERY;
	let payload;
	try {
		payload = JSON.parse(result.stdout);
	} catch {
		throw new Error(
			"codex plugin list returned malformed JSON; refusing reinstall",
		);
	}
	if (!Array.isArray(payload.installed))
		throw new Error(
			"codex plugin list returned malformed installed data; refusing reinstall",
		);
	return payload.installed.some(
		(item) =>
			item &&
			typeof item === "object" &&
			!Array.isArray(item) &&
			item.pluginId === SELECTOR &&
			item.name === PLUGIN &&
			item.marketplaceName === MARKETPLACE,
	);
}
function forgeMarketplaceInstalled(codex, home) {
	const result = runCommand(
		codex,
		["plugin", "marketplace", "list"],
		home,
		true,
	);
	return result.stdout
		.split("\n")
		.some((line) => line.trim().split(/\s+/)[0] === MARKETPLACE);
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

export {
	forgeMarketplaceInstalled,
	forgePluginInstalled,
	pluginManifest,
	pluginSelectors,
	readJson,
	removePluginInstallations,
	runCommand,
};
