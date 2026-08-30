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
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { TOML } from "bun";
import {
	parseGlobalAgents,
	removeGlobalAgentsSection,
} from "../../../plugins/codex-forge/scripts/installer/owners/global-agents.mjs";
import {
	enumerateCodexProcesses,
	isCodexProcessRow,
	parseUnixProcessTable,
	parseWindowsProcessTable,
} from "../../../plugins/codex-forge/scripts/installer/processes.mjs";

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

function _fakeCodex(
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

function _snapshotTree(root) {
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
	test("recognizes realistic Unix and Windows Codex process rows", () => {
		const unixRows = parseUnixProcessTable(
			[
				"1000 101 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/codex /usr/local/bin/codex --color auto",
				"1000 102 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/node /usr/local/bin/node /Applications/Codex.app/Contents/Resources/codex app-server",
				"1000 103 1 Sun Jan 01 00:00:00 2023 /Applications/Codex.app/Codex Proxy Helper /Applications/Codex.app/Codex Proxy Helper --server",
				"1000 104 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/node /usr/local/bin/node /Users/me/node_modules/@openai/codex/bin/codex.js --yolo",
				"1000 105 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/node /usr/local/bin/node /Users/me/codex-forge/scripts/install.mjs install",
			].join("\n"),
		);
		expect(unixRows.filter(isCodexProcessRow).map((row) => row.pid)).toEqual([
			101, 102, 103, 104,
		]);
		expect(unixRows[0]).toMatchObject({
			owner_uid: 1000,
			pid: 101,
			ppid: 1,
			start_identity: "Sun Jan 01 00:00:00 2023",
			image: "/usr/local/bin/codex",
			args: "/usr/local/bin/codex --color auto",
		});
		expect(unixRows[1].commandLine).toBe(
			"/usr/local/bin/node /Applications/Codex.app/Contents/Resources/codex app-server",
		);
		expect(unixRows[1].args.split(/\s+/)[0]).toBe("/usr/local/bin/node");
		expect(unixRows[1].args).toBe(
			"/usr/local/bin/node /Applications/Codex.app/Contents/Resources/codex app-server",
		);
		expect(unixRows[3].image).toBe("/usr/local/bin/node");
		expect(unixRows[3].args).toBe(
			"/usr/local/bin/node /Users/me/node_modules/@openai/codex/bin/codex.js --yolo",
		);
		expect(isCodexProcessRow(unixRows[1])).toBe(true);
		expect(isCodexProcessRow(unixRows[3])).toBe(true);
		expect(
			isCodexProcessRow({
				image: "/usr/local/bin/node",
				args: "/usr/local/bin/node -e 'console.log(\"codex\")'",
				commandLine: "/usr/local/bin/node -e 'console.log(\"codex\")'",
			}),
		).toBe(false);
		expect(
			isCodexProcessRow({
				image: "/usr/local/bin/node",
				args: "/usr/local/bin/node /tmp/not-codex.js codex",
				commandLine: "/usr/local/bin/node /tmp/not-codex.js codex",
			}),
		).toBe(false);

		const windowsRows = parseWindowsProcessTable(
			JSON.stringify([
				{
					ProcessId: 201,
					ParentProcessId: 1,
					Name: "codex.exe",
					CommandLine: "codex.exe",
				},
				{
					ProcessId: 202,
					ParentProcessId: 1,
					Name: "node.exe",
					CommandLine:
						'node.exe "C:\\Users\\me\\node_modules\\@openai\\codex\\bin\\codex.js" app-server',
				},
				{
					ProcessId: 203,
					ParentProcessId: 1,
					Name: "Codex Proxy.exe",
					CommandLine: "Codex Proxy.exe",
				},
				{
					ProcessId: 204,
					ParentProcessId: 1,
					Name: "node.exe",
					CommandLine:
						"node.exe C:\\Users\\me\\node_modules\\@openai\\codex\\bin\\codex.js --yolo",
				},
				{
					ProcessId: 206,
					ParentProcessId: 1,
					Name: "node.exe",
					CommandLine:
						'node.exe "\\\\server\\share\\@openai\\codex\\bin\\codex.js" app-server',
				},
				{
					ProcessId: 207,
					ParentProcessId: 1,
					Name: "node.exe",
					CommandLine:
						"node.exe \\\\server\\share\\@openai\\codex\\bin\\codex.js --yolo",
				},
				{
					ProcessId: 205,
					ParentProcessId: 1,
					Name: "node.exe",
					CommandLine: "node.exe C:\\codex-forge\\scripts\\install.mjs",
				},
			]),
		);
		expect(windowsRows.filter(isCodexProcessRow).map((row) => row.pid)).toEqual(
			[201, 202, 203, 204, 206, 207],
		);
		expect(parseWindowsProcessTable("[]")).toEqual([]);
		expect(() => parseWindowsProcessTable("not json")).toThrow(
			"malformed Windows process-table JSON",
		);
		expect(() =>
			parseWindowsProcessTable(JSON.stringify([{ ProcessId: 1 }])),
		).toThrow("malformed Windows process-table JSON");
		expect(
			isCodexProcessRow({ image: "/bin/sh", commandLine: "sh -c echo codex" }),
		).toBe(false);
		expect(
			isCodexProcessRow({
				image: "/usr/bin/python3",
				commandLine: "python3 label_codex",
			}),
		).toBe(false);
		expect(
			isCodexProcessRow({
				image: "/usr/bin/node",
				commandLine:
					'node --no-warnings "/Users/me/node_modules/@openai/codex/bin/codex.js" app-server',
			}),
		).toBe(true);
		expect(
			isCodexProcessRow({
				image: "/usr/bin/node",
				commandLine: "node -e 'console.log(\\\"codex\\\")'",
			}),
		).toBe(false);
	});
	test("enumeration requires current ownership and excludes foreign, self, and ancestors", () => {
		const previous = process.env.CODEX_FORGE_PROCESS_TABLE;
		const uid = process.getuid();
		process.env.CODEX_FORGE_PROCESS_TABLE = [
			`${uid} 5001 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/codex /usr/local/bin/codex --color auto`,
			`${uid + 1} 5002 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/codex /usr/local/bin/codex --foreign`,
			`${uid} ${process.pid} ${process.ppid} Sun Jan 01 00:00:00 2023 /usr/local/bin/codex /usr/local/bin/codex --self`,
			`${uid} ${process.ppid} 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/codex /usr/local/bin/codex --ancestor`,
		].join("\n");
		try {
			expect(enumerateCodexProcesses().map((row) => row.pid)).toEqual([5001]);
			process.env.CODEX_FORGE_PROCESS_TABLE =
				"5004 1 /usr/local/bin/codex --missing-owner";
			expect(() => enumerateCodexProcesses()).toThrow("verify owner");
		} finally {
			if (previous === undefined) delete process.env.CODEX_FORGE_PROCESS_TABLE;
			else process.env.CODEX_FORGE_PROCESS_TABLE = previous;
		}
	});
	test("production Unix enumerator smoke is read-only", () => {
		const previous = process.env.CODEX_FORGE_PROCESS_TABLE;
		delete process.env.CODEX_FORGE_PROCESS_TABLE;
		try {
			const rows = enumerateCodexProcesses();
			expect(Array.isArray(rows)).toBe(true);
			for (const row of rows) {
				expect(row.owner).toBe(process.getuid());
				expect(row.start_identity).toBeTruthy();
			}
		} finally {
			if (previous !== undefined)
				process.env.CODEX_FORGE_PROCESS_TABLE = previous;
		}
	});
	test("refuses install and uninstall while a Codex process is active", () => {
		const { home } = fixture();
		const environment = {
			CODEX_FORGE_PROCESS_TABLE: `${process.getuid()} 4242 1 Sun Jan 01 00:00:00 2023 /usr/local/bin/node /usr/local/bin/node /Applications/Codex.app/codex app-server`,
		};
		let result = runInstaller(home, ["install", "--no-tools"], environment);
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain(
			"Codex process(es) still active",
		);
		expect(existsSync(join(home, "forge", "install-state.json"))).toBe(false);

		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		result = runInstaller(home, ["uninstall", "--purge"], environment);
		expect(result.exitCode).toBe(2);
		expect(result.stderr.toString()).toContain(
			"close all Codex CLI/app/server processes",
		);
		expect(result.stderr.toString()).toContain(
			"run isolated reinstall from an external shell",
		);
		expect(existsSync(join(home, "forge", "install-state.json"))).toBe(true);
		const target = join(home, "agents", "forge-worker.toml");
		const before = readFileSync(target, "utf8");
		result = runInstaller(home, ["revert"], environment);
		expect(result.exitCode).toBe(2);
		expect(readFileSync(target, "utf8")).toBe(before);
	});
	test("fresh install sets the eight-thread default and restores unrelated configuration", () => {
		const { home, original } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const globalAgents = readFileSync(join(home, "AGENTS.md"), "utf8");
		expect(
			globalAgents.startsWith("# AGENTS.md\n\n<!-- CODEX_FORGE_START -->\n"),
		).toBe(true);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(globalAgents);
		const parsed = TOML.parse(readFileSync(join(home, "config.toml"), "utf8"));
		expect(parsed.foo).toBe("keep");
		expect(parsed.features.hooks).toBeUndefined();
		expect(parsed.model).toBe("gpt-5.6-sol");
		expect(parsed.model_reasoning_effort).toBe("medium");
		expect(parsed.plan_mode_reasoning_effort).toBe("medium");
		expect(parsed.model_instructions_file).toBe(
			join(home, "forge", "model-instructions.md"),
		);
		expect(parsed.model_catalog_json).toBe(
			join(home, "forge", "model-catalog.json"),
		);
		expect(
			readFileSync(join(home, "forge", "model-instructions.md"), "utf8"),
		).toBe(
			readFileSync(
				join(ROOT, "plugins", "codex-forge", "assets", "model-instructions.md"),
				"utf8",
			),
		);
		const catalog = JSON.parse(
			readFileSync(join(home, "forge", "model-catalog.json"), "utf8"),
		);
		for (const slug of ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]) {
			const model = catalog.models.find((item) => item.slug === slug);
			expect(model.multi_agent_version).toBe("v1");
			expect(model.use_responses_lite).toBe(false);
			expect(model.display_name).toBeTruthy();
		}
		expect(parsed.approval_policy).toBe("on-request");
		expect(parsed.agents.max_concurrent_threads_per_session).toBe(8);
		expect(parsed.agents.default_subagent_reasoning_effort).toBe("medium");
		expect(parsed.agents.max_depth).toBe(1);
		expect(parsed.features.multi_agent).toBeUndefined();
		expect(parsed.features.multi_agent_v2).toBeUndefined();
		expect(parsed.features.mcp_2026_07_28).toBe(true);
		expect(parsed.agents["forge-worker"]).toBeUndefined();
		expect(existsSync(join(home, "agents", "forge-worker.toml"))).toBe(true);
		expect(parsed.features.token_budget).toBeUndefined();
		expect(parsed.profiles).toBeUndefined();
		expect(parsed.agents.custom.description).toBe("keep");
		expect(parsed.apps._default.extra).toBe("keep");
		const state = JSON.parse(
			readFileSync(join(home, "forge", "install-state.json"), "utf8"),
		);
		expect(state.plugin_version).toBe("0.1.0-alpha.4");
		expect(state.file_mappings).toHaveLength(13);
		expect(
			state.file_mappings.some(
				(item) => item.target === join(home, "forge", "model-instructions.md"),
			),
		).toBe(true);
		expect(
			state.file_mappings.some(
				(item) =>
					item.source === "assets/model-catalog.json" &&
					item.target === join(home, "forge", "model-catalog.json"),
			),
		).toBe(true);
		expect(
			state.file_mappings.every(
				(item) => item.source_sha256 && item.installed_sha256,
			),
		).toBe(true);
		const diagnosis = install(home, "doctor", "--json");
		expect(diagnosis.exitCode).toBe(0);
		expect(JSON.parse(diagnosis.stdout.toString()).healthy).toBe(true);
		expect(JSON.parse(diagnosis.stdout.toString()).checks.model_catalog).toBe(
			true,
		);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(join(home, "config.toml"), "utf8")).toBe(original);
		expect(existsSync(join(home, "forge", "model-instructions.md"))).toBe(
			false,
		);
		expect(existsSync(join(home, "forge", "model-catalog.json"))).toBe(false);
		expect(existsSync(join(home, "AGENTS.md"))).toBe(false);
	});
	test("appends global AGENTS content, preserves it across upgrade, and restores preexisting content", () => {
		const { home } = fixture();
		const original = "# AGENTS.md\nUser governance\n";
		writeFileSync(join(home, "AGENTS.md"), original);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const installed = readFileSync(join(home, "AGENTS.md"), "utf8");
		expect(installed.startsWith(original)).toBe(true);
		expect(installed.match(/CODEX_FORGE_(?:START|END) /g)).toHaveLength(2);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(installed);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(original);
	});
	test("revert replaces only the Forge global section and uninstall preserves user additions", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const target = join(home, "AGENTS.md");
		writeFileSync(target, `${readFileSync(target, "utf8")}User addition\n`);
		expect(install(home, "revert").exitCode).toBe(0);
		const reverted = readFileSync(target, "utf8");
		expect(reverted).toContain("User addition");
		expect(reverted).toContain("Codex Forge is active");
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).toBe("# AGENTS.md\n\nUser addition\n");
		expect(removeGlobalAgentsSection(reverted)).toBe(
			"# AGENTS.md\n\nUser addition\n",
		);
	});
	test("purge removes only the Forge global section from preexisting AGENTS content", () => {
		const { home } = fixture();
		const original = "# AGENTS.md\nUser governance\n";
		writeFileSync(join(home, "AGENTS.md"), original);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		writeFileSync(
			join(home, "AGENTS.md"),
			`${readFileSync(join(home, "AGENTS.md"), "utf8")}User addition\n`,
		);
		expect(install(home, "uninstall", "--purge").exitCode).toBe(0);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(
			`${original}User addition\n`,
		);
	});
	test("fails closed for marker-like, unmatched, duplicate, and nested global blocks", () => {
		const { home } = fixture();
		for (const content of [
			"<!-- CODEX_FORGE_START -->\n",
			"<!-- CODEX_FORGE_START extra -->\n<!-- CODEX_FORGE_END -->\n",
			"prefix <!-- CODEX_FORGE_START -->\n<!-- CODEX_FORGE_END -->\n",
			"<!-- CODEX_FORGE_START --> suffix\n<!-- CODEX_FORGE_END -->\n",
			"<!-- codex_forge_start -->\n<!-- CODEX_FORGE_END -->\n",
			"<!-- CODEX_FORGE_START -->\n<!-- CODEX_FORGE_END -->\n<!-- CODEX_FORGE_START -->\n<!-- CODEX_FORGE_END -->\n",
			"<!-- CODEX_FORGE_START -->\n<!-- CODEX_FORGE_START -->\n<!-- CODEX_FORGE_END -->\n<!-- CODEX_FORGE_END -->\n",
		]) {
			writeFileSync(join(home, "AGENTS.md"), content);
			expect(() => parseGlobalAgents(content)).toThrow();
			expect(install(home, "install", "--no-tools").exitCode).toBe(2);
			expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(content);
		}
		const prose = "# user codex-forge note\n";
		writeFileSync(join(home, "AGENTS.md"), prose);
		expect(parseGlobalAgents(prose)).toEqual({ present: false });
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toContain(
			"<!-- CODEX_FORGE_START -->",
		);
		const owned =
			"<!-- CODEX_FORGE_START -->\nowned\n<!-- CODEX_FORGE_END -->\n";
		writeFileSync(join(home, "AGENTS.md"), owned);
		expect(install(home, "install", "--no-tools").exitCode).toBe(2);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(owned);
	});
	test("refuses an unrecorded historical Forge block", () => {
		const { home } = fixture();
		const content =
			"user prefix\n# >>> codex-forge:global-agents >>>\nowned\n# <<< codex-forge:global-agents <<<\nuser suffix\n";
		writeFileSync(join(home, "AGENTS.md"), content);
		expect(install(home, "install", "--no-tools").exitCode).toBe(2);
		expect(readFileSync(join(home, "AGENTS.md"), "utf8")).toBe(content);
	});
	test("rolls back a failed fresh install and failed restamp transaction", () => {
		const { home, original } = fixture();
		let result = runInstaller(home, ["install", "--no-tools"], {
			CODEX_FORGE_FAIL_INSTALL_AT: "before-state",
		});
		expect(result.exitCode).toBe(2);
		expect(readFileSync(join(home, "config.toml"), "utf8")).toBe(original);
		expect(existsSync(join(home, "AGENTS.md"))).toBe(false);
		expect(existsSync(join(home, "forge", "install-state.json"))).toBe(false);
		expect(existsSync(join(home, "forge", "backups"))).toBe(false);
		expect(existsSync(join(home, "forge"))).toBe(false);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const paths = [
			"config.toml",
			"AGENTS.md",
			"forge/install-state.json",
			"forge/model-instructions.md",
		];
		const before = new Map(
			paths.map((path) => [path, readFileSync(join(home, path))]),
		);
		result = runInstaller(home, ["install", "--no-tools", "--replace"], {
			CODEX_FORGE_FAIL_INSTALL_AT: "after-state",
		});
		expect(result.exitCode).toBe(2);
		for (const [path, bytes] of before)
			expect(readFileSync(join(home, path))).toEqual(bytes);
	});
	test("fails closed for invalid global state and never recreates a missing target", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const configBefore = readFileSync(join(home, "config.toml"));
		const workerBefore = readFileSync(
			join(home, "agents", "forge-worker.toml"),
		);
		const state = JSON.parse(readFileSync(statePath, "utf8"));
		state.global_agents.owned_sha256 = "bad";
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		expect(install(home, "uninstall").exitCode).toBe(2);
		expect(existsSync(join(home, "AGENTS.md"))).toBe(true);
		expect(readFileSync(join(home, "config.toml"))).toEqual(configBefore);
		expect(readFileSync(join(home, "agents", "forge-worker.toml"))).toEqual(
			workerBefore,
		);
		state.global_agents.owned_sha256 = "0".repeat(64);
		state.global_agents.source_sha256 = "0".repeat(64);
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		rmSync(join(home, "AGENTS.md"));
		expect(install(home, "revert").exitCode).toBe(2);
		expect(existsSync(join(home, "AGENTS.md"))).toBe(false);
		expect(readFileSync(join(home, "config.toml"))).toEqual(configBefore);
		expect(readFileSync(join(home, "agents", "forge-worker.toml"))).toEqual(
			workerBefore,
		);
	});
	test("round-trips a preexisting AGENTS file without a trailing newline", () => {
		const { home } = fixture();
		const target = join(home, "AGENTS.md");
		writeFileSync(target, "user governance");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(target)).toEqual(Buffer.from("user governance"));
	});
	test("preserves the original no-newline prefix when later content follows the block", () => {
		const { home } = fixture();
		const target = join(home, "AGENTS.md");
		writeFileSync(target, "user governance");
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		writeFileSync(target, `${readFileSync(target, "utf8")}\nLater user rule\n`);
		expect(install(home, "uninstall").exitCode).toBe(0);
		expect(readFileSync(target, "utf8")).toBe(
			"user governance\nLater user rule\n",
		);
	});
	test("doctor reports global source drift as an available upgrade", () => {
		const { home } = fixture();
		expect(install(home, "install", "--no-tools").exitCode).toBe(0);
		const statePath = join(home, "forge", "install-state.json");
		const state = JSON.parse(readFileSync(statePath, "utf8"));
		state.global_agents.source_sha256 = "0".repeat(64);
		writeFileSync(statePath, `${JSON.stringify(state)}\n`);
		const report = JSON.parse(
			install(home, "doctor", "--json").stdout.toString(),
		);
		expect(report.upgrade_available).toBe(true);
		expect(report.sources_changed).toContain("assets/AGENTS.md.patch");
	});
});
