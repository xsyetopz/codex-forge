import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { basename, join, relative } from "node:path";

export function fileSha(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function managedFilePairs(home, pluginRoot) {
	const pairs = ["model-instructions.md", "compact-prompt.md"].map((name) => [
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

export function installFiles(
	home,
	pluginRoot,
	backup,
	priorState,
	{ force = false } = {},
) {
	const prior = new Map(
		(priorState.file_mappings ?? []).map((item) => [item.target, item]),
	);
	const mappings = [];
	for (const [index, [source, target]] of managedFilePairs(
		home,
		pluginRoot,
	).entries()) {
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
		else copyFileSync(source, target);
		mappings.push({
			source: relative(pluginRoot, source),
			target,
			source_sha256: fileSha(source),
			installed_sha256:
				overridden && !force ? old.installed_sha256 : fileSha(target),
			previous_existed: previousExisted,
			previous_backup: previousBackup,
		});
	}
	return mappings;
}

export function uninstallFiles(home, state, { force = false } = {}) {
	const mappings = state.file_mappings ?? [];
	if (mappings.length) {
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
		const name = basename(target);
		if (
			existsSync(target) &&
			(name.startsWith("forge-") ||
				["forge.rules", "model-instructions.md", "compact-prompt.md"].includes(
					name,
				))
		)
			rmSync(target, { force: true });
	}
	const agents = join(home, "agents");
	if (existsSync(agents))
		for (const name of readdirSync(agents).filter((item) =>
			/^forge-.*\.toml$/.test(item),
		))
			rmSync(join(agents, name), { force: true });
}

export function revertFiles(pluginRoot, mappings) {
	for (const item of mappings) {
		const source = join(pluginRoot, item.source);
		if (!existsSync(source))
			throw new Error(`mapped source is missing: ${source}`);
		mkdirSync(join(item.target, ".."), { recursive: true });
		copyFileSync(source, item.target);
		item.source_sha256 = fileSha(source);
		item.installed_sha256 = fileSha(item.target);
	}
	return mappings.length;
}
