import { describe, test } from "bun:test";
import {
	delimiter,
	dirname,
	existsSync,
	expect,
	fakeCodex,
	fixture,
	install,
	join,
	mkdirSync,
	parseGlobalAgents,
	ROOT,
	readdirSync,
	readFileSync,
	runInjected,
	runInstaller,
	snapshotTree,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "./support.mjs";

describe("installer sequencing", () => {
	test("verified termination failures leave the home and plugin state untouched", async () => {
		for (const failure of [
			"unable to signal Codex process pid 6101: EPERM",
			"Codex processes survived termination: codex (pid 6102)",
			"Codex process identity changed before SIGTERM: pid 6103",
			"Codex process arrived too late for termination: pid 6104",
		]) {
			const { root, home } = fixture();
			const fake = fakeCodex(root);
			const before = snapshotTree(home);
			let error;
			try {
				await runInjected(home, root, {
					terminateCodexProcesses: () => {
						throw new Error(failure);
					},
				});
			} catch (caught) {
				error = caught;
			}
			expect(error?.message).toBe(failure);
			expect(snapshotTree(home)).toEqual(before);
			expect(existsSync(fake.log) ? readFileSync(fake.log, "utf8") : "").toBe(
				"",
			);
		}
	});
	test("successful injected termination permits the normal reinstall mutation sequence", async () => {
		const { root, home } = fixture();
		const fake = fakeCodex(root);
		let terminations = 0;
		let prompted = 0;
		const result = await runInjected(
			home,
			root,
			{
				activeCodexProcesses: () => [
					{ pid: 4101, command: "codex-app-server", args: "" },
				],
				confirmProcessTermination: async (processes) => {
					prompted += 1;
					expect(processes.map(({ pid }) => pid)).toEqual([4101]);
					return true;
				},
				terminateCodexProcesses: () => {
					terminations += 1;
				},
				quietTermination: true,
			},
			{ CODEX_REINSTALL_LOG: fake.log },
		);
		expect(result).toBe(0);
		expect(prompted).toBe(1);
		expect(terminations).toBe(2);
		expect(readFileSync(fake.log, "utf8")).toContain("plugin marketplace add");
	});

	test("declining process termination cancels reinstall before mutation", async () => {
		const { root, home } = fixture();
		const fake = fakeCodex(root);
		const before = snapshotTree(home);
		let terminations = 0;
		const result = await runInjected(
			home,
			root,
			{
				activeCodexProcesses: () => [{ pid: 4201, command: "codex", args: "" }],
				confirmProcessTermination: async () => false,
				terminateCodexProcesses: () => {
					terminations += 1;
				},
			},
			{ CODEX_REINSTALL_LOG: fake.log },
		);
		expect(result).toBe(1);
		expect(terminations).toBe(0);
		expect(snapshotTree(home)).toEqual(before);
		expect(existsSync(fake.log)).toBe(false);
	});

	test("runReinstall injected uninstall nonzero skips all later stages", async () => {
		const { root, home } = fixture();
		const fake = fakeCodex(root);
		const forgeCacheFile = join(
			home,
			"plugins",
			"cache",
			"codex-forge",
			"codex-forge",
			"0.1.0-alpha.3",
			"asset",
		);
		mkdirSync(dirname(forgeCacheFile), { recursive: true });
		writeFileSync(forgeCacheFile, "must remain\n");
		const sentinel = join(root, "uninstall-sentinel");
		writeFileSync(sentinel, "unchanged\n");
		const before = snapshotTree(home);
		const calls = [];
		let error;
		try {
			await runInjected(
				home,
				root,
				{
					uninstallUnlocked: async (options) => {
						calls.push("uninstall");
						expect(options).toEqual({
							purge: true,
							skipPluginRemoval: true,
							skipCachePurge: true,
						});
						return 7;
					},
					installUnlocked: async () => {
						calls.push("install");
						return 0;
					},
				},
				{ CODEX_REINSTALL_LOG: fake.log },
			);
		} catch (caught) {
			error = caught;
		}
		expect(error?.message).toContain("uninstall phase failed with status 7");
		expect(calls).toEqual(["uninstall"]);
		expect(readFileSync(sentinel, "utf8")).toBe("unchanged\n");
		expect(snapshotTree(home)).toEqual(before);
		const log = readFileSync(fake.log, "utf8");
		for (const command of [
			"plugin remove",
			"plugin marketplace remove",
			"plugin marketplace add",
			"plugin add",
			"install.mjs install",
			"install.mjs doctor",
		])
			expect(log).not.toContain(command);
	});
	test("runReinstall injected install nonzero skips restoration and doctor", async () => {
		const { root, home } = fixture();
		const target = join(home, "AGENTS.md");
		writeFileSync(
			target,
			`# AGENTS.md\n\n${readFileSync(join(ROOT, "plugins/codex-forge/assets/AGENTS.md.patch"))}`,
		);
		const fake = fakeCodex(root);
		const canonicalBlock = readFileSync(target, "utf8");
		const rewritten = `distinct before\n${canonicalBlock}distinct after\n`;
		const calls = [];
		let error;
		try {
			await runInjected(
				home,
				root,
				{
					uninstallUnlocked: async () => {
						calls.push("uninstall");
						return 0;
					},
					installUnlocked: async () => {
						calls.push("install");
						writeFileSync(target, rewritten);
						return 9;
					},
				},
				{ CODEX_REINSTALL_LOG: fake.log },
			);
		} catch (caught) {
			error = caught;
		}
		expect(error?.message).toContain("install phase failed with status 9");
		expect(calls).toEqual(["uninstall", "install"]);
		expect(readFileSync(target, "utf8")).toBe(rewritten);
		const log = readFileSync(fake.log, "utf8");
		expect(log).toContain("plugin marketplace add");
		expect(log).toContain("plugin add codex-forge@codex-forge");
		expect(log).not.toContain("doctor --json");
		expect(log).not.toContain("completion");
	});
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
		expect(result.stderr.toString()).not.toContain("cache purge deferred");
		expect(existsSync(forgeCache)).toBe(false);
		expect(readFileSync(join(otherCache, "asset"), "utf8")).toBe("keep");
		expect(readFileSync(join(home, "auth.json"), "utf8")).toBe("credentials");
		expect(readFileSync(join(home, "sessions", "keep.jsonl"), "utf8")).toBe(
			"session",
		);
		const agents = parseGlobalAgents(readFileSync(afterInstallAgents, "utf8"));
		expect(Buffer.from(agents.before)).toEqual(
			Buffer.concat([unmanagedPrefix, unmanagedSuffix]),
		);
		expect(agents.after).toBe("");
		const configAfter = readFileSync(configPath, "utf8");
		expect(
			sectionBytes(configAfter, '[plugins."other@other-marketplace"]'),
		).toEqual(unrelatedConfigBytes);
		const commands = readFileSync(fake.log, "utf8").trim().split("\n");
		const at = (text) => commands.findIndex((line) => line.includes(text));
		for (const operation of [
			"plugin list --json",
			"plugin remove codex-forge@codex-forge --json",
			"plugin marketplace list",
			"plugin marketplace remove codex-forge",
			"plugin marketplace add",
			"plugin add codex-forge@codex-forge",
			"install.mjs doctor --json",
		])
			expect(at(operation)).toBeGreaterThanOrEqual(0);
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
			at("install.mjs doctor --json"),
		);
	});
	test("reinstall reconciles a stale global AGENTS mapping location when its block proves Forge ownership", () => {
		const { root, home } = fixture();
		writeFileSync(join(home, "AGENTS.md"), "user-owned guidance\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const state = JSON.parse(readFileSync(statePath, "utf8"));
		state.global_agents.target = join(home, "stale-home", "AGENTS.md");
		state.global_agents.source = "legacy/AGENTS.md.patch";
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode, result.stderr.toString()).toBe(0);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toContain(
			"user-owned guidance",
		);
	});
	test("reinstall reports an actionable conflict for a genuinely unmanaged global AGENTS mapping", () => {
		const { root, home } = fixture();
		writeFileSync(join(home, "AGENTS.md"), "user-owned guidance\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const state = JSON.parse(readFileSync(statePath, "utf8"));
		state.global_agents.target = join(home, "unmanaged", "AGENTS.md");
		writeFileSync(join(home, "AGENTS.md"), "user-owned guidance\n");
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		const fake = fakeCodex(root);
		const before = readFileSync(join(home, "AGENTS.md"));
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain("metadata drift");
		expect(readFileSync(join(home, "AGENTS.md"))).toEqual(before);
		expect(readFileSync(fake.log, "utf8")).not.toContain("plugin remove");
	});
	test("reinstall rejects a symlinked install state before reconciliation", () => {
		const { root, home } = fixture();
		writeFileSync(join(home, "AGENTS.md"), "user-owned guidance\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const outside = join(root, "state-backup.json");
		const saved = readFileSync(statePath);
		writeFileSync(outside, saved);
		unlinkSync(statePath);
		symlinkSync(outside, statePath);
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
		});
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain("symlink");
		expect(readFileSync(outside)).toEqual(saved);
		expect(readFileSync(fake.log, "utf8")).not.toContain("plugin remove");
	});
	test("reinstall rolls back reconciled metadata when uninstall fails", async () => {
		const { root, home } = fixture();
		writeFileSync(join(home, "AGENTS.md"), "user-owned guidance\n");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const state = JSON.parse(readFileSync(statePath, "utf8"));
		state.global_agents.target = join(home, "stale-home", "AGENTS.md");
		const stale = `${JSON.stringify(state)}\n`;
		writeFileSync(statePath, stale);
		const fake = fakeCodex(root);
		let error;
		try {
			await runInjected(
				home,
				root,
				{ uninstallUnlocked: async () => 7 },
				{ CODEX_REINSTALL_LOG: fake.log },
			);
		} catch (caught) {
			error = caught;
		}
		expect(error?.message).toContain("uninstall phase failed");
		const reconciled = JSON.parse(readFileSync(statePath, "utf8"));
		expect(reconciled.global_agents.target).toBe(join(home, "AGENTS.md"));
	});
	test("reinstall blocks active Codex for a freshly selected isolated home", () => {
		const { root } = fixture();
		const home = join(root, "missing-home");
		const fake = fakeCodex(root);
		const result = runInstaller(home, ["reinstall"], {
			PATH: `${fake.bin}${delimiter}${process.env.PATH}`,
			BUN_BIN: fake.bun,
			CODEX_REINSTALL_LOG: fake.log,
			CODEX_FORGE_PROCESS_TABLE: `${process.getuid()} 4242 1 Sun Jan 01 00:00:00 2023 /Applications/Codex.app/Codex /Applications/Codex.app/Codex Proxy`,
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
			CODEX_FORGE_PROCESS_TABLE: `${process.getuid()} 4242 1 Sun Jan 01 00:00:00 2023 /Applications/Codex.app/Codex /Applications/Codex.app/Codex Proxy`,
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
			CODEX_FORGE_PROCESS_TABLE: `${process.getuid()} 4242 1 Sun Jan 01 00:00:00 2023 /Applications/Codex.app/Codex /Applications/Codex.app/Codex Proxy`,
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
			CODEX_FORGE_PROCESS_TABLE_AFTER_QUERY: `${process.getuid()} 5252 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/codex /usr/local/bin/codex --color auto`,
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
				JSON.stringify({ name: "codex-forge", version: "0.1.0-alpha.5" }),
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
					JSON.stringify({ name: "codex-forge", version: "0.1.0-alpha.5" }),
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
