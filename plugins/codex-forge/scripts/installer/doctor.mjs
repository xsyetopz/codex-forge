import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { TOML } from "bun";
import { which } from "../lib/process.mjs";
import {
	forgeCatalogSatisfiesContract,
	forgeCatalogTarget,
} from "./catalog.mjs";
import {
	cachedInstalls,
	codexHome,
	PLUGIN_ROOT,
	purgeCachedInstalls,
	REQUIRED_CODEX_CLI_VERSION,
} from "./owners/cache.mjs";
import { parseManagedConfig } from "./owners/config.mjs";
import { fileSha } from "./owners/files.mjs";
import {
	globalAgentsTarget,
	parseGlobalAgents,
	validateGlobalAgentsState,
} from "./owners/global-agents.mjs";
import { compareVersions, inspectCodexCli } from "./processes.mjs";
import { pluginManifest, pluginSelectors, readJson } from "./registry.mjs";

const PLUGIN = "codex-forge";

async function doctor(options) {
	const home = codexHome();
	const codexCli = inspectCodexCli(
		await which("codex"),
		REQUIRED_CODEX_CLI_VERSION,
		compareVersions,
	);
	const configPath = join(home, "config.toml");
	const statePath = join(home, "forge", "install-state.json");
	const state = readJson(statePath);
	const sourceVersion = pluginManifest().version;
	if (options.purgeCache) purgeCachedInstalls(home, PLUGIN, sourceVersion);
	let parsedConfig = {};
	let parsed = true;
	let managedConfig = { present: false };
	try {
		const configText = existsSync(configPath)
			? readFileSync(configPath, "utf8")
			: "";
		parsedConfig = configText ? TOML.parse(configText) : {};
		managedConfig = parseManagedConfig(configText, {
			requirePresent: Boolean(state.config_after_sha256),
		});
	} catch {
		parsed = false;
	}
	const managedFileMatches = (source, target) =>
		existsSync(target) && fileSha(source) === fileSha(target);
	const roleNames = readdirSync(join(PLUGIN_ROOT, "agents"))
		.filter((name) => /^forge-.*\.toml$/.test(name))
		.sort();
	const mappingByTarget = new Map(
		(state.file_mappings ?? []).map((item) => [item.target, item]),
	);
	let globalAgentsStateValid = true;
	let globalAgentsParsed = null;
	try {
		validateGlobalAgentsState(home, state.global_agents);
		globalAgentsParsed = parseGlobalAgents(
			readFileSync(globalAgentsTarget(home), "utf8"),
		);
		globalAgentsStateValid =
			globalAgentsParsed.present &&
			globalAgentsParsed.owned_sha256 === state.global_agents.owned_sha256 &&
			state.global_agents.source_sha256 ===
				fileSha(join(PLUGIN_ROOT, state.global_agents.source));
	} catch {
		globalAgentsStateValid = false;
	}
	const installedMappingMatches = (target) => {
		const mapping = mappingByTarget.get(target);
		return (
			mapping &&
			existsSync(target) &&
			fileSha(target) === mapping.installed_sha256
		);
	};
	const checks = {
		codex_cli_compatible: codexCli.compatible,
		global_agents: globalAgentsStateValid,
		config: managedConfig.present,
		config_toml: parsed,
		hooks_enabled: parsedConfig.features?.hooks !== false,
		plugin_registered:
			pluginSelectors(configPath, { activeOnly: true }).length > 0,
		developer_instructions:
			typeof parsedConfig.developer_instructions === "string" &&
			parsedConfig.developer_instructions ===
				readFileSync(
					join(PLUGIN_ROOT, "assets", "developer-instructions.txt"),
					"utf8",
				).trim(),
		model_instructions:
			typeof parsedConfig.model_instructions_file === "string" &&
			parsedConfig.model_instructions_file ===
				join(home, "forge", "model-instructions.md") &&
			existsSync(join(home, "forge", "model-instructions.md")) &&
			fileSha(join(home, "forge", "model-instructions.md")) ===
				fileSha(join(PLUGIN_ROOT, "assets", "model-instructions.md")),
		compact_prompt: managedFileMatches(
			join(PLUGIN_ROOT, "assets", "compact-prompt.md"),
			join(home, "forge", "compact-prompt.md"),
		),
		rules: managedFileMatches(
			join(PLUGIN_ROOT, "assets", "forge.rules"),
			join(home, "rules", "forge.rules"),
		),
		agent_roles:
			roleNames.length === 9 &&
			roleNames.every((name) =>
				managedFileMatches(
					join(PLUGIN_ROOT, "agents", name),
					join(home, "agents", name),
				),
			),
		model_catalog:
			typeof parsedConfig.model_catalog_json === "string" &&
			parsedConfig.model_catalog_json === forgeCatalogTarget(home) &&
			forgeCatalogSatisfiesContract(forgeCatalogTarget(home)) &&
			managedFileMatches(
				join(PLUGIN_ROOT, "assets", "model-catalog.json"),
				forgeCatalogTarget(home),
			) &&
			installedMappingMatches(forgeCatalogTarget(home)),
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
	if (state.global_agents) {
		const globalSource = join(PLUGIN_ROOT, state.global_agents.source);
		if (
			!existsSync(globalSource) ||
			fileSha(globalSource) !== state.global_agents.source_sha256
		)
			sourcesChanged.push(state.global_agents.source);
	}
	const upgradeAvailable = Boolean(
		Object.keys(state).length &&
			(state.plugin_version !== sourceVersion || sourcesChanged.length),
	);
	const cacheVersions = cachedInstalls(home, PLUGIN).map((path) =>
		basename(path),
	);
	const diagnosis = {
		healthy: Object.values(checks).every(Boolean) && !upgradeAvailable,
		checks,
		source_version: sourceVersion,
		installed_version: state.plugin_version,
		upgrade_available: upgradeAvailable,
		sources_changed: sourcesChanged,
		override_count: overrides.length,
		cache_versions: cacheVersions,
		stale_cache_versions: cacheVersions.filter(
			(version) => version !== sourceVersion,
		),
		codex_cli: {
			required: REQUIRED_CODEX_CLI_VERSION,
			available: codexCli.available,
			version: codexCli.version,
			compatible: codexCli.compatible,
			reason: codexCli.reason,
		},
		cache_retention: {
			status: "UNVERIFIED",
			reason:
				"Codex can retain versioned plugin roots for other sessions; Forge cannot prove cross-process path ownership",
		},
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
		`cache retention: ${diagnosis.cache_retention.status} (${diagnosis.cache_retention.reason})`,
	);
	console.log(
		"hook trust: UNVERIFIED (manual /hooks review and trust required; installer cannot inspect or grant trust)",
	);
	console.log(
		`codex: ${codexCli.output || "not found"} (required >= ${REQUIRED_CODEX_CLI_VERSION}; ${codexCli.compatible ? "compatible" : codexCli.reason})`,
	);
	return diagnosis.healthy ? 0 : 1;
}

export { doctor };
