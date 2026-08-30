import { afterEach, describe, expect, test } from "bun:test";
import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, relative, resolve } from "node:path";
import { parseGlobalAgents } from "../../../plugins/codex-forge/scripts/installer/owners/global-agents.mjs";

const ROOT = resolve(import.meta.dir, "../../..");
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
		codexVersion = "0.151.0",
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

describe("installer lifecycle", () => {
	test("reinstall cleans only Forge cache and runs the existing installer sequence", () => {
		const { root, home } = fixture();
		const configPath = join(home, "config.toml");
		const unrelatedConfig =
			'\n[plugins."other@other-marketplace"]\nenabled = true\n\n[unrelated.tail]\nvalue = "preserve"\n';
		writeFileSync(
			configPath,
			`${readFileSync(configPath, "utf8")}${unrelatedConfig}`,
		);
		const sectionBytes = (text, header) => {
			const start = text.indexOf(header);
			const next = text.indexOf("\n[", start + header.length);
			return Buffer.from(text.slice(start, next < 0 ? text.length : next));
		};
		const configBefore = readFileSync(configPath, "utf8");
		const unrelatedConfigBytes = sectionBytes(
			configBefore,
			'[plugins."other@other-marketplace"]',
		);
		const unmanagedPrefix = Buffer.from("unmanaged global guidance\n");
		writeFileSync(join(home, "AGENTS.md"), unmanagedPrefix);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const afterInstallAgents = join(home, "AGENTS.md");
		const unmanagedSuffix = Buffer.from("\nunmanaged suffix bytes\n");
		writeFileSync(
			afterInstallAgents,
			Buffer.concat([readFileSync(afterInstallAgents), unmanagedSuffix]),
		);
		const forgeCache = join(
			home,
			"plugins",
			"cache",
			"codex-forge",
			"codex-forge",
			"0.1.0-alpha.3",
		);
		const otherCache = join(home, "plugins", "cache", "other", "other", "1");
		mkdirSync(forgeCache, { recursive: true });
		mkdirSync(otherCache, { recursive: true });
		writeFileSync(join(forgeCache, "asset"), "remove");
		writeFileSync(join(otherCache, "asset"), "keep");
		writeFileSync(join(home, "auth.json"), "credentials");
		mkdirSync(join(home, "sessions"));
		writeFileSync(join(home, "sessions", "keep.jsonl"), "session");
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(0);
		expect(existsSync(forgeCache)).toBe(false);
		expect(readFileSync(join(otherCache, "asset"), "utf8")).toBe("keep");
		expect(readFileSync(join(home, "auth.json"), "utf8")).toBe("credentials");
		expect(readFileSync(join(home, "sessions", "keep.jsonl"), "utf8")).toBe(
			"session",
		);
		const agents = parseGlobalAgents(readFileSync(afterInstallAgents, "utf8"));
		expect(Buffer.from(agents.before)).toEqual(unmanagedPrefix);
		expect(Buffer.from(agents.after)).toEqual(unmanagedSuffix);
		const configAfter = readFileSync(configPath, "utf8");
		expect(
			sectionBytes(configAfter, '[plugins."other@other-marketplace"]'),
		).toEqual(unrelatedConfigBytes);
		const commands = readFileSync(fake.log, "utf8").trim().split("\n");
		const at = (text) => commands.findIndex((line) => line.includes(text));
		for (const operation of [
			"uninstall --purge",
			"plugin list --json",
			"plugin remove codex-forge@codex-forge --json",
			"plugin marketplace list",
			"plugin marketplace remove codex-forge",
			"plugin marketplace add",
			"plugin add codex-forge@codex-forge",
			"install.mjs install --no-tools",
			"install.mjs doctor --json",
		])
			expect(at(operation)).toBeGreaterThanOrEqual(0);
		expect(at("uninstall --purge")).toBeLessThan(
			at("plugin remove codex-forge@codex-forge --json"),
		);
		expect(at("plugin list --json")).toBeLessThan(
			at("plugin remove codex-forge@codex-forge --json"),
		);
		expect(at("plugin marketplace remove codex-forge")).toBeLessThan(
			at("plugin marketplace add"),
		);
		expect(at("plugin marketplace add")).toBeLessThan(
			at("plugin add codex-forge@codex-forge"),
		);
		expect(at("plugin add codex-forge@codex-forge")).toBeLessThan(
			at("install.mjs install --no-tools"),
		);
		expect(at("install.mjs install --no-tools")).toBeLessThan(
			at("install.mjs doctor --json"),
		);
	});
	test("reinstall blocks active Codex for a freshly selected isolated home", () => {
		const { root } = fixture();
		const home = join(root, "missing-home");
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
			CODEX_FORGE_PROCESS_TABLE: " 4242 1 /Applications/Codex.app/Codex Proxy",
		});
		expect(result.exitCode).toBe(2);
		expect(existsSync(home), result.stderr.toString()).toBe(false);
		expect(
			existsSync(fake.log) ? readFileSync(fake.log, "utf8") : "",
		).not.toContain("codex plugin");
	});
	test("reinstall still blocks an existing home while Codex is active", () => {
		const { root, home } = fixture();
		const fake = fakeCodex(root);
		const before = snapshotTree(home);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
			CODEX_FORGE_PROCESS_TABLE: " 4242 1 /Applications/Codex.app/Codex Proxy",
		});
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain("pid 4242");
		expect(snapshotTree(home)).toEqual(before);
	});
	test("reinstall rejects a symlinked explicit fresh home", () => {
		const { root } = fixture();
		const target = join(root, "target");
		const outside = join(root, "outside");
		mkdirSync(outside);
		symlinkSync(outside, target);
		const fake = fakeCodex(root);
		const result = runInstaller(target, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
			CODEX_FORGE_PROCESS_TABLE: " 4242 1 /Applications/Codex.app/Codex Proxy",
		});
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain("symlink");
		expect(readdirSync(outside)).toEqual([]);
	});
	test("reinstall stops after the first failed mutation", () => {
		const { root, home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const fake = fakeCodex(root, { fail: "plugin marketplace add" });
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(2);
		const commands = readFileSync(fake.log, "utf8");
		expect(commands).toContain("plugin marketplace add");
		expect(commands).not.toContain("plugin add codex-forge@codex-forge");
		expect(commands).not.toContain("install.mjs install --no-tools");
		expect(commands).not.toContain("install.mjs doctor --json");
	});
	test("reinstall refuses malformed plugin-list payloads before any mutation", () => {
		for (const pluginListOutput of ["not json", '{"installed":{}}']) {
			const { root, home } = fixture();
			const before = snapshotTree(home);
			const fake = fakeCodex(root, { pluginListOutput });
			const result = runInstaller(home, ["reinstall"], {
				PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
				BUN_BIN: fake.bun,
				CODEX_REINSTALL_LOG: fake.log,
			});
			expect(result.exitCode).toBe(2);
			expect(snapshotTree(home)).toEqual(before);
			expect(readFileSync(fake.log, "utf8")).toContain("plugin list --json");
			expect(readFileSync(fake.log, "utf8")).not.toContain(
				"plugin marketplace",
			);
			expect(readFileSync(fake.log, "utf8")).not.toContain("plugin remove");
		}
	});
	test("reinstall suppresses every later stage after representative failures", () => {
		for (const failure of [
			{ fail: "plugin remove codex-forge@codex-forge" },
			{ fail: "plugin marketplace remove codex-forge" },
			{ fail: "plugin add codex-forge@codex-forge" },
			{ failBun: "install.mjs install --no-tools" },
			{ failBun: "install.mjs doctor --json" },
		]) {
			const { root, home } = fixture();
			expect(install(home, "install", "--no-tools").exitCode).toBe(0);
			const fake = fakeCodex(root, failure);
			const result = runInstaller(home, ["reinstall"], {
				PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
				BUN_BIN: fake.bun,
				CODEX_REINSTALL_LOG: fake.log,
			});
			expect(result.exitCode).toBe(2);
			const commands = readFileSync(fake.log, "utf8");
			const lines = commands.split("\n");
			const index = (text) => lines.findIndex((line) => line.includes(text));
			const failedAt = failure.fail ?? failure.failBun;
			const failureIndex = index(failedAt);
			expect(failureIndex).toBeGreaterThanOrEqual(0);
			for (const later of [
				"plugin marketplace add",
				"plugin add codex-forge@codex-forge",
				"install.mjs install --no-tools",
				"install.mjs doctor --json",
			])
				if (later !== failedAt)
					expect(index(later) === -1 || index(later) < failureIndex).toBe(true);
		}
	});
	test("reinstall rechecks liveness after plugin listing before any mutation", () => {
		const { root, home } = fixture();
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
			CODEX_FORGE_PROCESS_TABLE_AFTER_QUERY:
				" 5252 1 /usr/local/bin/codex --color auto",
		});
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain("pid 5252");
		expect(readFileSync(fake.log, "utf8")).toContain("plugin list --json");
		expect(readFileSync(fake.log, "utf8")).not.toContain("plugin remove");
		expect(existsSync(join(home, "config.toml"))).toBe(true);
	});
	test("reinstall requires the complete Forge plugin identity fields", () => {
		for (const entry of [
			{ pluginId: "codex-forge@codex-forge", name: "codex-forge" },
			{
				pluginId: "codex-forge@other",
				name: "codex-forge",
				marketplaceName: "codex-forge",
			},
			{
				pluginId: "codex-forge@codex-forge",
				name: "other",
				marketplaceName: "codex-forge",
			},
			{
				pluginId: "codex-forge@codex-forge",
				name: "codex-forge",
				marketplaceName: "other",
			},
		]) {
			const { root, home } = fixture();
			const fake = fakeCodex(root, { entry });
			const result = runInstaller(home, ["reinstall"], {
				PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
				BUN_BIN: fake.bun,
				CODEX_REINSTALL_LOG: fake.log,
			});
			expect(result.exitCode).toBe(0);
			expect(readFileSync(fake.log, "utf8")).not.toContain(
				"plugin remove codex-forge@codex-forge",
			);
		}
	});
	test("reinstall rejects malformed, mismatched, and symlinked checkout metadata before mutation", () => {
		for (const kind of ["malformed", "mismatched", "symlinked"]) {
			const { root, home } = fixture();
			const checkout = join(root, "checkout");
			const plugin = join(checkout, "plugins", "codex-forge", ".codex-plugin");
			mkdirSync(plugin, { recursive: true });
			writeFileSync(join(checkout, "install.mjs"), "#!/usr/bin/env bun\n");
			writeFileSync(
				join(checkout, "package.json"),
				JSON.stringify({ name: "codex-forge", version: "0.1.0-alpha.4" }),
			);
			const manifest = join(plugin, "plugin.json");
			if (kind === "malformed") writeFileSync(manifest, "not json");
			else if (kind === "mismatched")
				writeFileSync(
					manifest,
					JSON.stringify({ name: "codex-forge", version: "other" }),
				);
			else {
				const outside = join(root, "manifest.json");
				writeFileSync(
					outside,
					JSON.stringify({ name: "codex-forge", version: "0.1.0-alpha.4" }),
				);
				symlinkSync(outside, manifest);
			}
			const fake = fakeCodex(root);
			const before = readFileSync(join(home, "config.toml"));
			const result = runInstaller(home, ["reinstall"], {
				FORGE_CHECKOUT: checkout,
				PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
				BUN_BIN: fake.bun,
				CODEX_REINSTALL_LOG: fake.log,
			});
			expect(result.exitCode).toBe(2);
			expect(readFileSync(join(home, "config.toml"))).toEqual(before);
			expect(readFileSync(fake.log, "utf8")).not.toContain("codex plugin");
		}
	});
	test("reinstall validates cache safety before uninstalling a valid installed state", () => {
		const { root, home } = fixture();
		writeFileSync(join(home, "AGENTS.md"), "unmanaged global guidance\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const outside = join(root, "outside-cache");
		mkdirSync(outside, { recursive: true });
		writeFileSync(join(outside, "keep"), "keep");
		mkdirSync(
			join(outside, "cache", "other-marketplace", "other-plugin", "1"),
			{ recursive: true },
		);
		writeFileSync(
			join(outside, "cache", "other-marketplace", "other-plugin", "1", "asset"),
			"unrelated",
		);
		mkdirSync(join(home, "plugins"));
		mkdirSync(
			join(
				home,
				"plugins",
				"marketplaces",
				"other-marketplace",
				"other-plugin",
			),
			{ recursive: true },
		);
		writeFileSync(
			join(
				home,
				"plugins",
				"marketplaces",
				"other-marketplace",
				"other-plugin",
				"registration",
			),
			"preserve",
		);
		writeFileSync(join(home, "auth.json"), "credentials");
		mkdirSync(join(home, "sessions", "nested"), { recursive: true });
		writeFileSync(join(home, "sessions", "nested", "session.jsonl"), "session");
		symlinkSync(outside, join(home, "plugins", "cache"), "dir");
		const fake = fakeCodex(root);
		const before = snapshotTree(home);
		const outsideBefore = snapshotTree(outside);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(2);
		expect(snapshotTree(home)).toEqual(before);
		expect(snapshotTree(outside)).toEqual(outsideBefore);
		expect(readFileSync(fake.log, "utf8")).not.toContain("codex plugin");
	});
	test("reinstall refuses a symlinked Forge cache ancestor without touching outside data", () => {
		const { root, home } = fixture();
		const outside = join(root, "outside-cache");
		mkdirSync(outside, { recursive: true });
		mkdirSync(join(home, "plugins"));
		writeFileSync(join(outside, "keep"), "keep");
		symlinkSync(outside, join(home, "plugins", "cache"), "dir");
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(2);
		expect(readFileSync(join(outside, "keep"), "utf8")).toBe("keep");
		expect(readFileSync(fake.log, "utf8")).not.toContain(
			"plugin marketplace add",
		);
	});
});
