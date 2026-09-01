import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { which } from "../lib/process.mjs";
import { validateCheckout } from "./checkout.mjs";
import { installUnlocked, uninstallUnlocked } from "./lifecycle.mjs";
import {
	codexHome,
	removeForgeCache,
	validateCacheRoot,
} from "./owners/cache.mjs";
import {
	reconcileGlobalAgentsState,
	recoverGlobalAgentsTransactions,
} from "./owners/global-agents.mjs";
import {
	assertRegularFile,
	withInstallerLock,
	writeAtomic,
} from "./owners/transaction.mjs";
import {
	activeCodexProcesses,
	requireCodexClosed,
	terminateCodexProcesses,
} from "./processes.mjs";
import {
	forgeMarketplaceInstalled,
	forgePluginInstalled,
	runCommand,
} from "./registry.mjs";

const PLUGIN = "codex-forge";
const MARKETPLACE = "codex-forge";
const SELECTOR = `${PLUGIN}@${MARKETPLACE}`;

async function confirmProcessTermination(processes) {
	if (!process.stdin.isTTY || !process.stdout.isTTY)
		throw new Error(
			`active Codex processes require confirmation (${processes
				.map(({ pid, command }) => `${command} pid ${pid}`)
				.join(", ")}); rerun interactively or pass reinstall --yes`,
		);
	const { cancel, confirm, isCancel, note } = await import("@clack/prompts");
	note(
		processes.map(({ pid, command }) => `${command}  pid ${pid}`).join("\n"),
		"Active Codex processes",
	);
	const accepted = await confirm({
		message: "Close these processes and continue reinstall?",
		initialValue: true,
	});
	if (isCancel(accepted) || !accepted) {
		cancel("Reinstall cancelled");
		return false;
	}
	return true;
}

async function terminateWithProgress(terminate, showProgress) {
	if (!showProgress) return terminate();
	const { spinner } = await import("@clack/prompts");
	const progress = spinner();
	progress.start("Closing Codex processes");
	try {
		terminate();
		progress.stop("Codex processes closed");
	} catch (error) {
		progress.error("Unable to close Codex processes");
		throw error;
	}
}

export async function runReinstall(options = {}, deps = {}) {
	const root = validateCheckout();
	const home = codexHome();
	validateCacheRoot(home);
	const terminate = deps.terminateCodexProcesses ?? terminateCodexProcesses;
	const listProcesses = deps.activeCodexProcesses ?? activeCodexProcesses;
	const active = listProcesses();
	if (active.length && !options.yes) {
		const ask = deps.confirmProcessTermination ?? confirmProcessTermination;
		if (!(await ask(active))) return 1;
	}
	await terminateWithProgress(
		terminate,
		active.length > 0 && process.stdout.isTTY && !deps.quietTermination,
	);
	return withInstallerLock(home, async () => {
		terminate();
		const codex = process.env.CODEX_BIN || (await which("codex"));
		if (!codex)
			throw new Error("codex executable not found; refusing reinstall");
		requireCodexClosed();
		const pluginInstalled = forgePluginInstalled(codex, home);
		requireCodexClosed();
		const marketplaceInstalled = forgeMarketplaceInstalled(codex, home);
		requireCodexClosed();
		mkdirSync(home, { recursive: true });
		const statePath = join(home, "forge", "install-state.json");
		assertRegularFile(statePath, "installation state", home);
		if (existsSync(statePath)) {
			const state = JSON.parse(readFileSync(statePath, "utf8"));
			recoverGlobalAgentsTransactions(home, state);
			if (reconcileGlobalAgentsState(home, state.global_agents)) {
				writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
			}
		}
		const uninstall = deps.uninstallUnlocked ?? uninstallUnlocked;
		const install = deps.installUnlocked ?? installUnlocked;
		let uninstallStatus;
		uninstallStatus = await uninstall({
			purge: true,
			skipPluginRemoval: true,
			skipCachePurge: true,
		});
		if (uninstallStatus !== 0) {
			throw new Error(
				`reinstall uninstall phase failed with status ${uninstallStatus}`,
			);
		}
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
		const installStatus = await install({
			noTools: true,
			replace: false,
			purgeCache: false,
		});
		if (installStatus !== 0)
			throw new Error(
				`reinstall install phase failed with status ${installStatus}`,
			);
		// The outer reinstall lock remains held while the in-process lifecycle calls
		// complete; doctor is intentionally the final read-only child check.
		const bun = process.env.BUN_BIN || "bun";
		runCommand(bun, [join(root, "install.mjs"), "doctor", "--json"], home);
		console.log("[cf] Forge reinstall complete");
		return 0;
	});
}

async function reinstall(options) {
	return runReinstall(options, { uninstallUnlocked, installUnlocked });
}

export { reinstall };
