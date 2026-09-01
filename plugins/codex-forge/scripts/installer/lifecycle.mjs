import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { TOML } from "bun";
import {
	codexHome,
	managedInstallPaths,
	PLUGIN_ROOT,
	purgeCachedInstalls,
	removeFreshEmptyDirectories,
	sha,
} from "./owners/cache.mjs";
import {
	mergeConfig,
	parseManagedConfig,
	resolveMaxConcurrentThreads,
	stripManaged,
} from "./owners/config.mjs";
import {
	installFiles,
	revertFiles,
	uninstallFiles,
	validateInstallationState,
} from "./owners/files.mjs";
import {
	globalAgentsTarget,
	installGlobalAgents,
	recoverGlobalAgentsTransactions,
	revertGlobalAgents,
	uninstallGlobalAgents,
	validateGlobalAgentsTarget,
} from "./owners/global-agents.mjs";
import {
	assertRegularFile,
	restoreSnapshot,
	snapshotPaths,
	withInstallerLock,
	writeAtomic,
} from "./owners/transaction.mjs";
import { requireCodexClosed } from "./processes.mjs";
import {
	pluginManifest,
	readJson,
	removePluginInstallations,
} from "./registry.mjs";

const PLUGIN = "codex-forge";

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
	if (Object.keys(priorState).length)
		parseManagedConfig(current, { requirePresent: true });
	if (current.includes("# >>> codex-forge >>>")) {
		process.stderr.write(
			"[cf] existing Forge config was modified; preserving non-Forge edits during reinstall\n",
		);
		return stripManaged(current, {
			createdTables: priorState.created_tables,
		});
	}
	return current;
}
async function installUnlocked(options) {
	requireCodexClosed();
	const home = codexHome();
	mkdirSync(home, { recursive: true });
	const configPath = join(home, "config.toml");
	const current = existsSync(configPath)
		? readFileSync(configPath, "utf8")
		: "";
	const statePath = join(home, "forge", "install-state.json");
	assertRegularFile(statePath, "installation state", home);
	const priorState = readJson(statePath);
	validateInstallationState(home, priorState);
	const priorConfigUnchanged =
		Object.keys(priorState).length > 0 &&
		sha(current) === priorState.config_after_sha256;
	const priorBackup = priorState.backup
		? join(priorState.backup, "config.toml")
		: "";
	const hasRestorablePriorConfig =
		priorConfigUnchanged && Boolean(priorBackup) && existsSync(priorBackup);
	const old = originalConfig(current, priorState);
	try {
		if (old.trim()) TOML.parse(old);
	} catch (error) {
		process.stderr.write(
			`[cf] refusing to modify invalid config.toml: ${error.message}\n`,
		);
		return 2;
	}
	const snapshot = snapshotPaths(
		managedInstallPaths(home, priorState, globalAgentsTarget),
	);
	const transactionDirectories = [
		join(home, "forge"),
		join(home, "forge", "backups"),
		join(home, "agents"),
		join(home, "rules"),
	];
	const existingDirectories = new Set(
		transactionDirectories.filter((path) => existsSync(path)),
	);
	let backup;
	let state;
	let globalAgentsTransaction;
	try {
		backup = nextBackup(home);
		mkdirSync(dirname(backup), { recursive: true });
		mkdirSync(backup, { recursive: false });
		writeFileSync(join(backup, "config.toml"), old);
		const mappings = installFiles(home, PLUGIN_ROOT, backup, priorState, {
			force: options.replace,
		});
		const globalAgentsResult = installGlobalAgents(
			home,
			PLUGIN_ROOT,
			priorState,
			{
				force: options.replace,
				onPending: (pending) => {
					mkdirSync(dirname(statePath), { recursive: true });
					writeAtomic(
						statePath,
						`${JSON.stringify({ ...priorState, pending_global_agents_transaction: pending }, null, 2)}\n`,
					);
				},
				clearPending: () => {
					const currentState = existsSync(statePath) ? readJson(statePath) : {};
					delete currentState.pending_global_agents_transaction;
					writeAtomic(statePath, `${JSON.stringify(currentState, null, 2)}\n`);
				},
			},
		);
		const globalAgents = globalAgentsResult.mapping ?? globalAgentsResult;
		globalAgentsTransaction = globalAgentsResult.transaction;
		const preserveFrom = hasRestorablePriorConfig ? old : current;
		const maxConcurrentThreads =
			priorConfigUnchanged &&
			Number.isInteger(priorState.max_concurrent_threads_per_session)
				? priorState.max_concurrent_threads_per_session
				: resolveMaxConcurrentThreads(preserveFrom);
		const [updated, createdTables] = mergeConfig(old, home, PLUGIN_ROOT, {
			preserveFrom,
			maxConcurrentThreads,
		});
		writeFileSync(configPath, updated);
		if (
			process.env.NODE_ENV === "test" &&
			process.env.CODEX_FORGE_FAIL_INSTALL_AT === "before-state"
		)
			throw new Error("forced install failure before state write");
		state = {
			plugin_version: pluginManifest().version,
			max_concurrent_threads_per_session: maxConcurrentThreads,
			installed_at: Date.now() / 1000,
			backup,
			config_before_sha256: sha(old),
			config_after_sha256: sha(updated),
			files: mappings.map((item) => item.target),
			file_mappings: mappings,
			global_agents: globalAgents,
			...(globalAgentsTransaction?.receipt
				? { global_agents_transaction_receipt: globalAgentsTransaction.receipt }
				: {}),
			created_tables: createdTables,
		};
		mkdirSync(dirname(statePath), { recursive: true });
		writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
		if (
			process.env.NODE_ENV === "test" &&
			process.env.CODEX_FORGE_FAIL_INSTALL_AT === "after-state"
		)
			throw new Error("forced install failure after state write");
		if (globalAgentsTransaction) globalAgentsTransaction.commit();
		if (globalAgentsTransaction?.receipt) {
			delete state.global_agents_transaction_receipt;
			writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
		}
	} catch (error) {
		if (globalAgentsTransaction) {
			try {
				globalAgentsTransaction.rollback();
			} catch (rollbackError) {
				process.stderr.write(`[cf] ${rollbackError.message}\n`);
				return 2;
			}
		}
		if (
			error?.message?.includes("global AGENTS.md") &&
			error?.message?.includes("quarantine")
		)
			snapshot.delete(globalAgentsTarget(home));
		restoreSnapshot(snapshot);
		if (backup) rmSync(backup, { recursive: true, force: true });
		removeFreshEmptyDirectories(transactionDirectories, existingDirectories);
		process.stderr.write(`[cf] ${error.message}\n`);
		return 2;
	}
	if (options.purgeCache)
		purgeCachedInstalls(home, PLUGIN, state.plugin_version);
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
async function uninstallUnlocked(options) {
	requireCodexClosed();
	const home = codexHome();
	const configPath = join(home, "config.toml");
	const statePath = join(home, "forge", "install-state.json");
	let globalAgentsTransaction;
	assertRegularFile(statePath, "installation state", home);
	const state = readJson(statePath);
	validateInstallationState(home, state);
	recoverGlobalAgentsTransactions(home, state);
	if (state.global_agents)
		validateGlobalAgentsTarget(home, state.global_agents);
	// Claim and complete the global AGENTS transaction before touching config or
	// mapped files. Ownership/race failures therefore leave the install intact.
	if (state.global_agents)
		globalAgentsTransaction = uninstallGlobalAgents(home, state, {
			force: options.purge,
			deferCommit: true,
			onPending: (pending) => {
				state.pending_global_agents_transaction = pending;
				writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
			},
			clearPending: () => {
				const currentState = readJson(statePath);
				delete currentState.pending_global_agents_transaction;
				writeAtomic(statePath, `${JSON.stringify(currentState, null, 2)}\n`);
			},
		});
	if (state.global_agents) {
		// Persist the completed global-file step before later config/file work so
		// a later failure does not claim that Forge still owns the block.
		try {
			delete state.global_agents;
			delete state.pending_global_agents_transaction;
			state.global_agents_transaction_receipt = globalAgentsTransaction.receipt;
			writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
			globalAgentsTransaction.commit();
			delete state.global_agents_transaction_receipt;
			writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
		} catch (error) {
			globalAgentsTransaction.rollback();
			throw error;
		}
	}
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
		const cleaned = stripManaged(current, {
			createdTables: state.created_tables,
		});
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
		requireCodexClosed();
		pluginsRemoved = options.skipPluginRemoval
			? true
			: await removePluginInstallations(home, configPath);
		if (!options.skipCachePurge) purgeCachedInstalls(home, PLUGIN, null);
		rmSync(join(home, "forge", "backups"), { recursive: true, force: true });
		try {
			rmdirSync(join(home, "forge"));
		} catch {}
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
async function revertUnlocked() {
	requireCodexClosed();
	const statePath = join(codexHome(), "forge", "install-state.json");
	assertRegularFile(statePath, "installation state", codexHome());
	if (!existsSync(statePath)) {
		process.stderr.write("[cf] no Forge installation state found\n");
		return 1;
	}
	const state = readJson(statePath);
	validateInstallationState(codexHome(), state);
	if (state.global_agents)
		validateGlobalAgentsTarget(codexHome(), state.global_agents);
	const mappings = state.file_mappings ?? [];
	if (!mappings.length) {
		process.stderr.write(
			"[cf] installation predates hashed file mappings; reinstall first\n",
		);
		return 2;
	}
	let count;
	try {
		count = revertFiles(codexHome(), PLUGIN_ROOT, mappings);
		revertGlobalAgents(codexHome(), PLUGIN_ROOT, state);
	} catch (error) {
		process.stderr.write(`[cf] ${error.message}\n`);
		return 2;
	}
	writeAtomic(statePath, `${JSON.stringify(state, null, 2)}\n`);
	console.log(`[cf] reverted ${count} mapped files to plugin sources`);
	return 0;
}

const install = async (options) => {
	requireCodexClosed();
	const home = codexHome();
	return withInstallerLock(home, async (_lock) => {
		requireCodexClosed();
		mkdirSync(home, { recursive: true });
		return installUnlocked(options);
	});
};
const uninstall = async (options) => {
	requireCodexClosed();
	const home = codexHome();
	if (!existsSync(home)) return uninstallUnlocked(options);
	return withInstallerLock(home, async () => {
		requireCodexClosed();
		return uninstallUnlocked(options);
	});
};
const revert = async () => {
	requireCodexClosed();
	const home = codexHome();
	if (!existsSync(home)) return revertUnlocked();
	return withInstallerLock(home, async () => {
		requireCodexClosed();
		return revertUnlocked();
	});
};

export {
	install,
	installUnlocked,
	revert,
	revertUnlocked,
	uninstall,
	uninstallUnlocked,
};
