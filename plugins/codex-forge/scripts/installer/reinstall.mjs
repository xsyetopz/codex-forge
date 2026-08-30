import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { which } from "../lib/process.mjs";
import { validateCheckout } from "./checkout.mjs";
import {
	codexHome,
	removeForgeCache,
	validateCacheRoot,
} from "./owners/cache.mjs";
import {
	globalAgentsTarget,
	parseGlobalAgents,
} from "./owners/global-agents.mjs";
import { requireCodexClosed } from "./processes.mjs";
import {
	forgeMarketplaceInstalled,
	forgePluginInstalled,
	runCommand,
} from "./registry.mjs";

const PLUGIN = "codex-forge";
const MARKETPLACE = "codex-forge";
const SELECTOR = `${PLUGIN}@${MARKETPLACE}`;

async function reinstall(_options) {
	const root = validateCheckout();
	const home = codexHome();
	validateCacheRoot(home);
	const globalAgentsPath = globalAgentsTarget(home);
	const globalAgentsBefore = existsSync(globalAgentsPath)
		? parseGlobalAgents(readFileSync(globalAgentsPath, "utf8"))
		: null;
	const codex = process.env.CODEX_BIN || (await which("codex"));
	if (!codex) throw new Error("codex executable not found; refusing reinstall");
	const bun = process.env.BUN_BIN || "bun";
	requireCodexClosed();
	const pluginInstalled = forgePluginInstalled(codex, home);
	requireCodexClosed();
	const marketplaceInstalled = forgeMarketplaceInstalled(codex, home);
	requireCodexClosed();
	mkdirSync(home, { recursive: true });
	runCommand(bun, [join(root, "install.mjs"), "uninstall", "--purge"], home);
	requireCodexClosed();
	if (pluginInstalled) {
		requireCodexClosed();
		runCommand(codex, ["plugin", "remove", SELECTOR, "--json"], home);
	}
	requireCodexClosed();
	console.log(
		removeForgeCache(home)
			? "[cf] removed Forge plugin cache"
			: "[cf] Forge plugin cache already absent",
	);
	requireCodexClosed();
	if (marketplaceInstalled) {
		requireCodexClosed();
		runCommand(codex, ["plugin", "marketplace", "remove", MARKETPLACE], home);
	}
	requireCodexClosed();
	runCommand(codex, ["plugin", "marketplace", "add", root], home);
	requireCodexClosed();
	runCommand(codex, ["plugin", "add", SELECTOR], home);
	runCommand(bun, [join(root, "install.mjs"), "install", "--no-tools"], home);
	if (globalAgentsBefore?.present) {
		const restored = parseGlobalAgents(readFileSync(globalAgentsPath, "utf8"));
		if (restored.present)
			writeFileSync(
				globalAgentsPath,
				`${globalAgentsBefore.before}${restored.owned}${globalAgentsBefore.after}`,
			);
	}
	runCommand(bun, [join(root, "install.mjs"), "doctor", "--json"], home);
	console.log("[cf] Forge reinstall complete");
	return 0;
}

export { reinstall };
