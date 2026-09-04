import { afterEach, expect } from "bun:test";
import { createHash } from "node:crypto";
import {
	chmodSync,
	existsSync,
	linkSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, relative, resolve } from "node:path";
import {
	installGlobalAgents,
	parseGlobalAgents,
	uninstallGlobalAgents,
} from "../../../../plugins/codex-forge/scripts/installer/owners/global-agents.mjs";
import {
	acquireInstallerLock,
	withInstallerLock,
} from "../../../../plugins/codex-forge/scripts/installer/owners/transaction.mjs";
import { runReinstall } from "../../../../plugins/codex-forge/scripts/installer/reinstall.mjs";

const ROOT = resolve(import.meta.dir, "../../../..");
const temporary = [];
afterEach(() => {
	for (const path of temporary.splice(0))
		rmSync(path, { recursive: true, force: true });
});

function fixture(
	config = 'foo = "keep"\n\n[features]\n\n[agents]\nenabled = true\n\n[agents.custom]\ndescription = "keep"\nconfig_file = "/tmp/custom.toml"\n\n[apps._default]\nextra = "keep"\n\n[plugins."codex-forge@test"]\nenabled = true\n',
) {
	const root = mkdtempSync(join(tmpdir(), "forge-test-"));
	temporary.push(root);
	const home = join(root, "codex");
	mkdirSync(home);
	writeFileSync(join(home, "config.toml"), config);
	return { root, home, original: config };
}

function install(home, ...args) {
	return runInstaller(home, args);
}

function fakeCodex(
	root,
	{
		installed = true,
		marketplace = true,
		fail = "",
		failBun = "",
		codexVersion = "0.153.1",
		entry,
		pluginListOutput,
	} = {},
) {
	const bin = join(root, "bin");
	mkdirSync(bin);
	const path = join(bin, "codex");
	const installedJson =
		pluginListOutput ??
		(installed
			? JSON.stringify({
					installed: [
						entry ?? {
							pluginId: "codex-forge@codex-forge",
							name: "codex-forge",
							marketplaceName: "codex-forge",
						},
					],
				})
			: '{"installed":[]}');
	const marketplaceText = marketplace
		? "codex-forge  /checkout"
		: "other  /checkout";
	writeFileSync(
		path,
		`#!/bin/sh
printf 'codex %s\\n' "$*" >> "$CODEX_REINSTALL_LOG"
if [ "$*" = "plugin list --json" ]; then printf '%s\\n' '${installedJson}'; fi
if [ "$*" = "plugin marketplace list" ]; then printf '%s\\n' '${marketplaceText}'; fi
if [ "$*" = "--version" ]; then printf 'codex %s\\n' '${codexVersion}'; fi
${fail ? `case "$*" in "${fail}"*) exit 7 ;; esac` : ""}
exit 0
`,
	);
	chmodSync(path, 0o755);
	const bun = join(bin, "bun");
	writeFileSync(
		bun,
		`#!/bin/sh
printf 'bun %s\\n' "$*" >> "$CODEX_REINSTALL_LOG"
${failBun ? `case "$*" in *"${failBun}"*) exit 7 ;; esac` : ""}
exec ${process.execPath} "$@"
`,
	);
	chmodSync(bun, 0o755);
	return { bin, bun, log: join(root, "codex.log") };
}

function snapshotTree(root) {
	const result = {};
	const visit = (path) => {
		const name = relative(root, path) || ".";
		const stat = lstatSync(path);
		if (stat.isSymbolicLink())
			result[name] = { type: "symlink", target: readlinkSync(path) };
		else if (stat.isDirectory()) {
			result[name] = { type: "directory" };
			for (const child of readdirSync(path)) visit(join(path, child));
		} else
			result[name] = {
				type: "file",
				bytes: readFileSync(path).toString("base64"),
			};
	};
	visit(root);
	return result;
}

function installerLockPaths(home) {
	const canonicalHome = resolve(home);
	const key = createHash("sha256")
		.update(canonicalHome)
		.digest("hex")
		.slice(0, 16);
	return {
		parent: join(dirname(canonicalHome), `.codex-forge-installer-${key}.lock`),
	};
}

function runInstaller(home, args, extraEnvironment = {}) {
	return Bun.spawnSync(["bun", join(ROOT, "install.mjs"), ...args], {
		env: {
			...process.env,
			NODE_ENV: "test",
			CODEX_FORGE_PROCESS_TABLE: "",
			...extraEnvironment,
			CODEX_HOME: home,
		},
		stdout: "pipe",
		stderr: "pipe",
	});
}

async function runInjected(home, root, deps, extra = {}) {
	const previous = {};
	for (const [key, value] of Object.entries({
		CODEX_HOME: home,
		CODEX_BIN: join(root, "bin", "codex"),
		CODEX_FORGE_PROCESS_TABLE: "",
		...extra,
	})) {
		previous[key] = process.env[key];
		process.env[key] = value;
	}
	try {
		return await runReinstall({}, deps);
	} finally {
		for (const [key, value] of Object.entries(previous)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	}
}

export {
	acquireInstallerLock,
	chmodSync,
	createHash,
	delimiter,
	dirname,
	existsSync,
	expect,
	fakeCodex,
	fixture,
	install,
	installerLockPaths,
	installGlobalAgents,
	join,
	linkSync,
	mkdirSync,
	parseGlobalAgents,
	ROOT,
	readdirSync,
	readFileSync,
	relative,
	resolve,
	rmSync,
	runInjected,
	runInstaller,
	snapshotTree,
	symlinkSync,
	temporary,
	uninstallGlobalAgents,
	unlinkSync,
	withInstallerLock,
	writeFileSync,
};
