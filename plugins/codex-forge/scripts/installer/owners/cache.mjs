import { createHash } from "node:crypto";
import {
	existsSync,
	lstatSync,
	readdirSync,
	realpathSync,
	rmdirSync,
	rmSync,
	statSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, join, relative, resolve } from "node:path";

export const PLUGIN_ROOT = resolve(import.meta.dirname, "../../..");
export const REQUIRED_CODEX_CLI_VERSION = "0.153.1";
export const sha = (text) => createHash("sha256").update(text).digest("hex");
export const codexHome = () =>
	process.env.CODEX_HOME
		? resolve(process.env.CODEX_HOME.replace(/^~(?=$|[\\/])/, homedir()))
		: join(homedir(), ".codex");
export const directories = (path) =>
	!existsSync(path)
		? []
		: readdirSync(path)
				.map((name) => join(path, name))
				.filter((item) => statSync(item).isDirectory());
export function cachedInstalls(home, canonicalPluginName) {
	if (!canonicalPluginName)
		throw new Error("canonical plugin name is required");
	return directories(join(home, "plugins", "cache"))
		.flatMap((marketplace) =>
			directories(join(marketplace, canonicalPluginName)),
		)
		.sort();
}

export function validateCacheRoot(home) {
	const base = resolve(home);
	const marketplaceRoot = join(base, "plugins", "cache", "codex-forge");
	const root = join(marketplaceRoot, "codex-forge");
	for (const path of [
		base,
		join(base, "plugins"),
		join(base, "plugins", "cache"),
		marketplaceRoot,
		root,
	]) {
		let stat;
		try {
			stat = lstatSync(path);
		} catch (error) {
			if (error.code === "ENOENT") continue;
			throw error;
		}
		if (stat.isSymbolicLink())
			throw new Error(`refusing symlinked Forge cache path: ${path}`);
		if (!stat.isDirectory())
			throw new Error(`refusing non-directory Forge cache path: ${path}`);
	}
	if (!existsSync(root)) return false;
	const realParent = realpathSync(marketplaceRoot);
	const realRoot = realpathSync(root);
	const relativeRoot = relative(realParent, realRoot);
	if (
		relativeRoot === ".." ||
		relativeRoot.startsWith(`..${process.platform === "win32" ? "\\\\" : "/"}`)
	)
		throw new Error(`refusing Forge cache path escape: ${root}`);
	const visit = (path) => {
		const pathRelative = relative(root, path);
		if (
			pathRelative === ".." ||
			pathRelative.startsWith(
				`..${process.platform === "win32" ? "\\\\" : "/"}`,
			)
		)
			throw new Error(`refusing path outside Forge cache root: ${path}`);
		const stat = lstatSync(path);
		if (stat.isSymbolicLink())
			throw new Error(`refusing symlink in Forge cache: ${path}`);
		if (stat.isDirectory())
			for (const name of readdirSync(path)) visit(join(path, name));
	};
	visit(root);
	return true;
}

export function removeForgeCache(home) {
	const root = join(home, "plugins", "cache", "codex-forge", "codex-forge");
	if (!validateCacheRoot(home)) return false;
	rmSync(root, { recursive: true, force: false });
	return true;
}
export function managedInstallPaths(home, priorState, globalAgentsTarget) {
	const paths = [
		join(home, "config.toml"),
		join(home, "forge", "install-state.json"),
		globalAgentsTarget(home),
		join(home, "forge", "model-instructions.md"),
		join(home, "forge", "compact-prompt.md"),
		join(home, "forge", "model-catalog.json"),
		join(home, "rules", "forge.rules"),
	];
	for (const name of readdirSync(join(PLUGIN_ROOT, "agents")))
		if (/^forge-.*\.toml$/.test(name)) paths.push(join(home, "agents", name));
	for (const item of priorState.file_mappings ?? []) paths.push(item.target);
	return [...new Set(paths)];
}
export function removeFreshEmptyDirectories(directoriesToRemove, existing) {
	for (const path of directoriesToRemove.slice().reverse())
		if (!existing.has(path) && existsSync(path) && !readdirSync(path).length)
			rmdirSync(path);
}
export function purgeCachedInstalls(home, canonicalPluginName, keepVersion) {
	const candidates = cachedInstalls(home, canonicalPluginName).filter(
		(path) => keepVersion === null || basename(path) !== keepVersion,
	);
	if (candidates.length)
		process.stderr.write(
			"[cf] cache purge deferred: cross-process cache ownership is UNVERIFIED; " +
				"close every Codex session and the app server, then confirm upstream cache " +
				"retention externally\n",
		);
	return [];
}
