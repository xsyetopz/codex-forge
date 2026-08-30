import { createHash } from "node:crypto";
import {
	closeSync,
	existsSync,
	fsyncSync,
	lstatSync,
	mkdirSync,
	openSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export function assertNoSymlinkPath(path, label, boundary = null) {
	const components = [];
	for (
		let current = path;
		current && current !== dirname(current);
		current = dirname(current)
	) {
		components.push(current);
		if (boundary && current === boundary) break;
	}
	for (const component of components.reverse()) {
		let stat;
		try {
			stat = lstatSync(component);
		} catch (error) {
			if (error?.code === "ENOENT") continue;
			throw error;
		}
		if (stat.isSymbolicLink())
			throw new Error(`${label} path contains a symlink; refusing mutation`);
	}
	return true;
}

export function assertRegularFile(path, label, boundary = null) {
	assertNoSymlinkPath(path, label, boundary);
	let stat;
	try {
		stat = lstatSync(path);
	} catch (error) {
		if (error?.code === "ENOENT") return false;
		throw error;
	}
	if (stat.isSymbolicLink() || !stat.isFile())
		throw new Error(`${label} must be a regular file; refusing mutation`);
	return true;
}

export function writeAtomic(path, contents) {
	if (process.env.NODE_ENV === "test") {
		writeAtomic.ordinal = (writeAtomic.ordinal ?? 0) + 1;
		const ordinal = Number(process.env.CODEX_FORGE_FAIL_ATOMIC_RENAME_ORDINAL);
		const pathMatch = process.env.CODEX_FORGE_FAIL_ATOMIC_RENAME_PATH;
		if (
			(ordinal > 0 && writeAtomic.ordinal === ordinal) ||
			(pathMatch && path.includes(pathMatch))
		)
			throw new Error("injected atomic rename failure");
	}
	const temporary = join(
		dirname(path),
		`.${basename(path)}.${process.pid}.${Date.now()}.tmp`,
	);
	try {
		writeFileSync(temporary, contents, {
			encoding: "utf8",
			flag: "wx",
			mode: 0o600,
		});
		const descriptor = openSync(temporary, "r");
		try {
			fsyncSync(descriptor);
		} finally {
			closeSync(descriptor);
		}
		if (
			process.env.NODE_ENV === "test" &&
			process.env.CODEX_FORGE_FAIL_ATOMIC_RENAME
		)
			throw new Error("injected atomic rename failure");
		renameSync(temporary, path);
		const directory = openSync(dirname(path), "r");
		try {
			fsyncSync(directory);
		} finally {
			closeSync(directory);
		}
	} catch (error) {
		rmSync(temporary, { force: true });
		throw error;
	}
}

export function acquireInstallerLock(home) {
	const canonicalHome = resolve(home);
	const parent = dirname(canonicalHome);
	assertNoSymlinkPath(parent, "CODEX_HOME parent", parent);
	const key = createHash("sha256")
		.update(canonicalHome)
		.digest("hex")
		.slice(0, 16);
	const lock = join(parent, `.codex-forge-installer-${key}.lock`);
	if (existsSync(canonicalHome))
		assertNoSymlinkPath(canonicalHome, "CODEX_HOME", canonicalHome);
	const acquired = [];
	try {
		mkdirSync(lock, { mode: 0o700 });
		acquired.push(lock);
	} catch (error) {
		for (const path of acquired.reverse())
			rmSync(path, { recursive: true, force: true });
		if (error?.code === "EEXIST")
			throw new Error(
				"Forge installer lock is busy; refusing concurrent mutation",
			);
		throw error;
	}
	return {
		release: () => {
			for (const path of acquired.reverse())
				rmSync(path, { recursive: true, force: true });
		},
	};
}

export async function withInstallerLock(home, operation) {
	const lock = acquireInstallerLock(home);
	try {
		return await operation(lock);
	} finally {
		lock.release();
	}
}

export function snapshotPaths(paths) {
	return new Map(
		paths.map((path) => [path, existsSync(path) ? readFileSync(path) : null]),
	);
}

export function restoreSnapshot(snapshot) {
	for (const [path, bytes] of snapshot) {
		if (bytes === null) rmSync(path, { force: true });
		else {
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, bytes);
		}
	}
}
