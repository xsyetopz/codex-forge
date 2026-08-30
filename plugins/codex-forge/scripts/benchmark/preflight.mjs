#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	lstatSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const packageRoot = resolve(
	process.argv[2] || "benchmark-artifacts/terminal-bench-4.0/forge-package",
);
const regularFiles = (root) => {
	const files = [];
	const visit = (directory, prefix = "") => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			const path = join(directory, entry.name);
			const stat = lstatSync(path);
			if (stat.isSymbolicLink())
				throw new Error(`package symlink is not allowed: ${relative}`);
			if (stat.isDirectory()) visit(path, relative);
			else if (stat.isFile()) files.push(relative);
		}
	};
	visit(root);
	return files.sort();
};
const first = spawnSync("codex", ["--version"], { encoding: "utf8" });
if (first.status !== 0)
	throw new Error(first.stderr || "codex --version failed");
const manifest = JSON.parse(
	readFileSync(join(packageRoot, "manifest.json"), "utf8"),
);
const declared = new Map(
	manifest.uploaded_files.map((item) => [item.path, item.sha256]),
);
if (declared.size !== manifest.uploaded_files.length)
	throw new Error("manifest contains duplicate uploaded paths");
const actual = regularFiles(packageRoot).filter(
	(path) => path !== "manifest.json",
);
const declaredPaths = [...declared.keys()].sort();
if (
	actual.length !== declared.size ||
	actual.some((path, index) => path !== declaredPaths[index])
)
	throw new Error("package contains undeclared or missing files");
for (const item of manifest.uploaded_files) {
	if (
		!item.path ||
		item.path.startsWith("/") ||
		item.path.split("/").includes("..")
	)
		throw new Error(`manifest path escapes root: ${item.path}`);
	const path = join(packageRoot, item.path);
	if (!existsSync(path) || !lstatSync(path).isFile())
		throw new Error(`package manifest file missing ${item.path}`);
	if (
		createHash("sha256").update(readFileSync(path)).digest("hex") !==
		item.sha256
	)
		throw new Error(`package digest mismatch: ${item.path}`);
}
const home = mkdtempSync(join(tmpdir(), "forge-benchmark-preflight-"));
try {
	const install = spawnSync("sh", [join(packageRoot, "install-portable.sh")], {
		env: { ...process.env, CODEX_HOME: home },
		encoding: "utf8",
	});
	if (install.status !== 0)
		throw new Error(install.stderr || "portable install failed");
	const help = spawnSync("codex", ["exec", "--help"], {
		env: { ...process.env, CODEX_HOME: home },
		encoding: "utf8",
	});
	if (help.status !== 0)
		throw new Error(help.stderr || "codex exec --help failed");
	const config = readFileSync(join(home, "config.toml"), "utf8");
	for (const required of [
		`${home}/forge/model-instructions.md`,
		`${home}/forge/model-catalog.json`,
		`${home}/forge/compact-prompt.md`,
		`${home}/plugins/codex-forge`,
		"[agents]",
	]) {
		if (!config.includes(required))
			throw new Error(`portable config missing ${required}`);
	}
	for (const required of [
		"forge/model-instructions.md",
		"forge/model-catalog.json",
		"forge/compact-prompt.md",
		"forge/developer-instructions.txt",
		"forge/hooks.json",
		"rules/forge.rules",
		"AGENTS.md",
		"agents/forge-worker.toml",
		"plugins/codex-forge/.codex-plugin/plugin.json",
	]) {
		const path = join(home, required);
		if (!existsSync(path) || !lstatSync(path).isFile())
			throw new Error(`installed package missing ${required}`);
	}
	for (const item of manifest.uploaded_files) {
		const path = join(home, item.path);
		if (item.path === "install-portable.sh") continue;
		if (!existsSync(path) || !lstatSync(path).isFile())
			throw new Error(`installed package missing ${item.path}`);
		if (
			item.path !== "config.toml" &&
			createHash("sha256").update(readFileSync(path)).digest("hex") !==
				item.sha256
		)
			throw new Error(`installed package digest mismatch: ${item.path}`);
	}
	console.log(
		JSON.stringify({
			codex_version: first.stdout.trim(),
			inference: false,
			package: packageRoot,
			config: join(home, "config.toml"),
		}),
	);
} finally {
	rmSync(home, { recursive: true, force: true });
}
