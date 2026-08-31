import { lstat } from "node:fs/promises";
import { dirname, parse, resolve } from "node:path";

async function directoryExists(path) {
	try {
		return (await lstat(path)).isDirectory();
	} catch {
		return false;
	}
}

export async function codeGraphRoot(cwd = process.cwd()) {
	let current = resolve(cwd);
	const root = parse(current).root;
	for (;;) {
		if (await directoryExists(resolve(current, ".codegraph"))) return current;
		if (current === root) return null;
		current = dirname(current);
	}
}

export async function hasCodeGraph(cwd = process.cwd()) {
	return Boolean(await codeGraphRoot(cwd));
}
