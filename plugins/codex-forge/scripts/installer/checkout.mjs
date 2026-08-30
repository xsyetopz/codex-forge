import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { PLUGIN_ROOT } from "./owners/cache.mjs";

const PLUGIN = "codex-forge";

function checkoutRoot() {
	return resolve(process.env.FORGE_CHECKOUT ?? resolve(PLUGIN_ROOT, "../.."));
}
function regularFile(path, label, boundary = null) {
	const absolute = resolve(path);
	let cursor = absolute;
	while (
		cursor &&
		cursor !== dirname(cursor) &&
		(!boundary || cursor !== resolve(boundary))
	) {
		try {
			if (lstatSync(cursor).isSymbolicLink())
				throw new Error(`${label} path contains a symlink: ${cursor}`);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		cursor = dirname(cursor);
	}
	if (boundary) {
		try {
			if (lstatSync(resolve(boundary)).isSymbolicLink())
				throw new Error(`${label} path contains a symlink: ${boundary}`);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
	}
	if (!existsSync(absolute)) throw new Error(`missing ${label}: ${path}`);
	const stat = lstatSync(absolute);
	if (stat.isSymbolicLink() || !stat.isFile())
		throw new Error(`${label} must be a regular nonsymlinked file: ${path}`);
}
function validateCheckout() {
	const root = checkoutRoot();
	const checkoutPluginRoot = join(root, "plugins", PLUGIN);
	regularFile(join(root, "install.mjs"), "checkout installer", root);
	regularFile(join(root, "package.json"), "checkout package metadata", root);
	regularFile(
		join(checkoutPluginRoot, ".codex-plugin", "plugin.json"),
		"Forge plugin manifest",
		root,
	);
	let metadata;
	let manifest;
	try {
		metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
		manifest = JSON.parse(
			readFileSync(
				join(checkoutPluginRoot, ".codex-plugin", "plugin.json"),
				"utf8",
			),
		);
	} catch {
		throw new Error("checkout metadata is malformed; refusing reinstall");
	}
	if (
		metadata.name !== PLUGIN ||
		typeof metadata.version !== "string" ||
		manifest.name !== PLUGIN ||
		typeof manifest.version !== "string" ||
		metadata.version !== manifest.version
	)
		throw new Error(
			"checkout plugin/package metadata mismatch; refusing reinstall",
		);
	return root;
}

export { checkoutRoot, regularFile, validateCheckout };
