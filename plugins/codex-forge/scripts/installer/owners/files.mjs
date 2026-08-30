import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { basename, isAbsolute, join, relative, sep } from "node:path";
import {
	FALLBACK_CATALOG_SOURCE,
	forgeCatalogTarget,
	GENERATED_CATALOG_SOURCE,
} from "./catalog-contract.mjs";

export function fileSha(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function managedFilePairs(home, pluginRoot) {
	const pairs = [
		"model-instructions.md",
		"compact-prompt.md",
		"model-catalog.json",
	].map((name) => [
		join(pluginRoot, "assets", name),
		join(home, "forge", name),
	]);
	pairs.push(
		...readdirSync(join(pluginRoot, "agents"))
			.filter((name) => /^forge-.*\.toml$/.test(name))
			.sort()
			.map((name) => [
				join(pluginRoot, "agents", name),
				join(home, "agents", name),
			]),
	);
	pairs.push([
		join(pluginRoot, "assets", "forge.rules"),
		join(home, "rules", "forge.rules"),
	]);
	return pairs;
}

function pathInside(root, path) {
	const pathRelative = relative(root, path);
	return (
		pathRelative &&
		!isAbsolute(pathRelative) &&
		pathRelative !== ".." &&
		!pathRelative.startsWith(`..${sep}`)
	);
}

function expectedSource(home, target) {
	for (const name of ["model-instructions.md", "compact-prompt.md"])
		if (target === join(home, "forge", name)) return join("assets", name);
	if (target === join(home, "forge", "model-catalog.json"))
		return FALLBACK_CATALOG_SOURCE;
	if (target === join(home, "AGENTS.md"))
		return join("assets", "AGENTS.md.patch");
	if (target === join(home, "rules", "forge.rules"))
		return join("assets", "forge.rules");
	const agents = join(home, "agents");
	if (
		target === join(agents, basename(target)) &&
		/^forge-.*\.toml$/.test(basename(target))
	)
		return join("agents", basename(target));
	return null;
}

function recordManagedTarget({
	backup,
	prior,
	index,
	source,
	target,
	force,
	materialize,
}) {
	mkdirSync(join(target, ".."), { recursive: true });
	const old = prior.get(target);
	const overridden = Boolean(
		old && existsSync(target) && fileSha(target) !== old.installed_sha256,
	);
	let previousExisted;
	let previousBackup;
	if (old)
		({
			previous_existed: previousExisted = false,
			previous_backup: previousBackup = null,
		} = old);
	else {
		previousExisted = existsSync(target);
		previousBackup = null;
		if (previousExisted) {
			const saved = join(
				backup,
				"files",
				`${String(index).padStart(3, "0")}-${basename(target)}`,
			);
			mkdirSync(join(saved, ".."), { recursive: true });
			copyFileSync(target, saved);
			previousBackup = saved;
		}
	}
	if (overridden && !force)
		process.stderr.write(`[cf] preserving local override: ${target}\n`);
	else materialize();
	return {
		source,
		target,
		overridden,
		previous_existed: previousExisted,
		previous_backup: previousBackup,
	};
}

function validateMappings(home, mappings) {
	for (const item of mappings) {
		const expected = expectedSource(home, item.target);
		const priorGeneratedCatalog =
			item.target === forgeCatalogTarget(home) &&
			item.source === GENERATED_CATALOG_SOURCE;
		if (!expected || (item.source !== expected && !priorGeneratedCatalog))
			throw new Error("installation state contains an unmanaged file mapping");
		if (
			item.previous_backup &&
			!pathInside(join(home, "forge", "backups"), item.previous_backup)
		)
			throw new Error("installation state contains an unmanaged backup path");
	}
}

export function validateInstallationState(home, state) {
	const mappings = state.file_mappings ?? [];
	if (mappings.length) validateMappings(home, mappings);
	else
		for (const target of state.files ?? [])
			if (!expectedSource(home, target))
				throw new Error("installation state contains an unmanaged file target");
}

export function installFiles(
	home,
	pluginRoot,
	backup,
	priorState,
	{ force = false } = {},
) {
	const priorMappings = priorState.file_mappings ?? [];
	validateMappings(home, priorMappings);
	const prior = new Map(priorMappings.map((item) => [item.target, item]));
	const mappings = [];
	const currentTargets = new Set();
	const pairs = managedFilePairs(home, pluginRoot);
	for (const [index, [source, target]] of pairs.entries()) {
		currentTargets.add(target);
		const recorded = recordManagedTarget({
			backup,
			prior,
			index,
			source: relative(pluginRoot, source),
			target,
			force,
			materialize: () => copyFileSync(source, target),
		});
		mappings.push({
			source: recorded.source,
			target,
			source_sha256: fileSha(source),
			installed_sha256:
				recorded.overridden && !force
					? prior.get(target).installed_sha256
					: fileSha(target),
			previous_existed: recorded.previous_existed,
			previous_backup: recorded.previous_backup,
		});
	}
	for (const old of prior.values()) {
		if (currentTargets.has(old.target) || !existsSync(old.target)) continue;
		if (fileSha(old.target) !== old.installed_sha256) {
			process.stderr.write(
				`[cf] preserving retired local override: ${old.target}\n`,
			);
			continue;
		}
		if (
			old.previous_existed &&
			old.previous_backup &&
			existsSync(old.previous_backup)
		)
			copyFileSync(old.previous_backup, old.target);
		else rmSync(old.target, { force: true });
	}
	return mappings;
}

export function uninstallFiles(home, state, { force = false } = {}) {
	const mappings = state.file_mappings ?? [];
	if (mappings.length) {
		validateMappings(home, mappings);
		for (const item of mappings) {
			if (
				!force &&
				existsSync(item.target) &&
				fileSha(item.target) !== item.installed_sha256
			) {
				console.log(
					`[cf] preserving local override during uninstall: ${item.target}`,
				);
				continue;
			}
			if (
				item.previous_existed &&
				item.previous_backup &&
				existsSync(item.previous_backup)
			) {
				mkdirSync(join(item.target, ".."), { recursive: true });
				copyFileSync(item.previous_backup, item.target);
			} else rmSync(item.target, { force: true });
		}
		return;
	}
	for (const target of state.files ?? []) {
		if (!expectedSource(home, target))
			throw new Error("installation state contains an unmanaged file target");
		if (existsSync(target)) rmSync(target, { force: true });
	}
	const agents = join(home, "agents");
	if (existsSync(agents))
		for (const name of readdirSync(agents).filter((item) =>
			/^forge-.*\.toml$/.test(item),
		))
			rmSync(join(agents, name), { force: true });
}

export function revertFiles(home, pluginRoot, mappings) {
	validateMappings(home, mappings);
	for (const item of mappings) {
		mkdirSync(join(item.target, ".."), { recursive: true });
		const source = join(
			pluginRoot,
			item.source === GENERATED_CATALOG_SOURCE
				? FALLBACK_CATALOG_SOURCE
				: item.source,
		);
		if (!existsSync(source))
			throw new Error(`mapped source is missing: ${source}`);
		copyFileSync(source, item.target);
		item.source = relative(pluginRoot, source);
		item.source_sha256 = fileSha(source);
		item.installed_sha256 = fileSha(item.target);
	}
	return mappings.length;
}
