import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	applyForgeCatalogPatches,
	catalogHasForgeV1,
	generateForgeCatalogSnapshot,
	runBundledCatalog,
} from "../../plugins/codex-forge/scripts/installer/catalog.mjs";

const ROOT = resolve(import.meta.dir, "../..");
const PLUGIN = resolve(ROOT, "plugins/codex-forge");
const CATALOG_CLI = resolve(PLUGIN, "scripts/installer/catalog.mjs");
const temporary = [];

afterEach(() => {
	for (const path of temporary.splice(0))
		rmSync(path, { recursive: true, force: true });
});

function catalog(models) {
	return { models };
}

function executable(body) {
	const directory = mkdtempSync(join(tmpdir(), "forge-catalog-test-"));
	temporary.push(directory);
	const path = join(directory, "codex-fixture");
	writeFileSync(path, `#!/bin/sh\n${body}\n`);
	chmodSync(path, 0o755);
	return path;
}

function nodeExecutable(source) {
	const directory = mkdtempSync(join(tmpdir(), "forge-catalog-node-test-"));
	temporary.push(directory);
	const path = join(directory, "codex-fixture.mjs");
	writeFileSync(path, `#!/usr/bin/env node\n${source}\n`);
	chmodSync(path, 0o755);
	return path;
}

function runCatalogCli(arguments_, environment = {}) {
	return spawnSync("bun", [CATALOG_CLI, ...arguments_], {
		env: { ...process.env, ...environment },
		encoding: "utf8",
		timeout: 3_000,
	});
}

function processIsAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function processGroupIsAlive(pid) {
	try {
		process.kill(-pid, 0);
		return true;
	} catch {
		return false;
	}
}

function bundledCatalog(extra = {}) {
	return catalog([
		{
			slug: "gpt-5.6-sol",
			display_name: "GPT-5.6-Sol",
			multi_agent_version: "v2",
			use_responses_lite: true,
		},
		{
			slug: "gpt-5.6-terra",
			display_name: "GPT-5.6-Terra",
			multi_agent_version: "v2",
			use_responses_lite: true,
		},
		{
			slug: "gpt-5.6-luna",
			display_name: "GPT-5.6-Luna",
			multi_agent_version: "v1",
			use_responses_lite: true,
		},
		...Object.values(extra),
	]);
}

describe("Forge model catalog patches", () => {
	test("stamps Forge slugs to V1 and standard Responses", () => {
		const patched = applyForgeCatalogPatches(
			catalog([
				{
					slug: "gpt-5.6-sol",
					display_name: "GPT-5.6-Sol",
					multi_agent_version: "v2",
					use_responses_lite: true,
				},
				{
					slug: "gpt-5.6-terra",
					display_name: "GPT-5.6-Terra",
					multi_agent_version: "v2",
					use_responses_lite: true,
				},
				{
					slug: "gpt-5.6-luna",
					display_name: "GPT-5.6-Luna",
					multi_agent_version: "v1",
					use_responses_lite: true,
				},
				{
					slug: "gpt-5.4",
					display_name: "GPT-5.4",
					multi_agent_version: null,
					use_responses_lite: false,
				},
			]),
		);
		expect(catalogHasForgeV1(patched)).toBe(true);
		expect(
			patched.models.find((model) => model.slug === "gpt-5.6-sol")
				.use_responses_lite,
		).toBe(false);
		expect(
			patched.models.find((model) => model.slug === "gpt-5.6-terra")
				.use_responses_lite,
		).toBe(false);
		expect(
			patched.models.find((model) => model.slug === "gpt-5.6-luna")
				.use_responses_lite,
		).toBe(false);
		expect(
			patched.models.find((model) => model.slug === "gpt-5.4")
				.multi_agent_version,
		).toBeNull();
		patched.models.find(
			(model) => model.slug === "gpt-5.6-sol",
		).use_responses_lite = true;
		expect(catalogHasForgeV1(patched)).toBe(false);
	});

	test("rejects a catalog missing a Forge slug or display_name", () => {
		expect(() =>
			applyForgeCatalogPatches(
				catalog([
					{
						slug: "gpt-5.6-sol",
						display_name: "GPT-5.6-Sol",
						multi_agent_version: "v2",
					},
				]),
			),
		).toThrow("missing gpt-5.6-terra");
		expect(() =>
			applyForgeCatalogPatches(
				catalog([
					{ slug: "gpt-5.6-sol", multi_agent_version: "v2" },
					{
						slug: "gpt-5.6-terra",
						display_name: "GPT-5.6-Terra",
						multi_agent_version: "v2",
					},
					{
						slug: "gpt-5.6-luna",
						display_name: "GPT-5.6-Luna",
						multi_agent_version: "v1",
					},
				]),
			),
		).toThrow("missing display_name");
	});

	test("uses one complete successful host-bundled snapshot", async () => {
		const directory = mkdtempSync(join(tmpdir(), "forge-catalog-data-"));
		temporary.push(directory);
		const input = join(directory, "catalog.json");
		writeFileSync(
			input,
			JSON.stringify(
				bundledCatalog({
					four: { slug: "gpt-5.4", display_name: "GPT-5.4" },
				}),
			),
		);
		const snapshot = await generateForgeCatalogSnapshot({
			pluginRoot: PLUGIN,
			executable: executable('printf "prefix\\n"; /bin/cat "$CATALOG_INPUT"'),
			env: { ...process.env, CATALOG_INPUT: input },
			timeoutMs: 1_000,
		});
		expect(snapshot.source).toBe("host-bundled");
		expect(snapshot.diagnostic).toBeNull();
		const parsed = JSON.parse(snapshot.text);
		expect(catalogHasForgeV1(parsed)).toBe(true);
		expect(parsed.models.some((model) => model.slug === "gpt-5.4")).toBe(true);
	});

	test.each([
		[
			"nonzero_exit",
			'printf \'{"models":[{"slug":"poison"}]}\\n\'; exit 7',
			{},
		],
		["malformed_output", 'printf "not-json\\n"', {}],
	])(
		"selects the complete checked-in fallback for %s",
		async (reason, body, options) => {
			const snapshot = await generateForgeCatalogSnapshot({
				pluginRoot: PLUGIN,
				executable: executable(body),
				timeoutMs: 1_000,
				...options,
			});
			expect(snapshot.source).toBe("checked-in-pinned");
			expect(snapshot.diagnostic.reason).toBe(reason);
			const parsed = JSON.parse(snapshot.text);
			expect(catalogHasForgeV1(parsed)).toBe(true);
			expect(parsed.models.some((model) => model.slug === "poison")).toBe(
				false,
			);
		},
	);

	test("terminates a timed-out process group and selects the fallback", async () => {
		const started = Date.now();
		const snapshot = await generateForgeCatalogSnapshot({
			pluginRoot: PLUGIN,
			executable: executable("trap '' TERM\n(sleep 30) &\nwait"),
			timeoutMs: 30,
			terminationGraceMs: 30,
		});
		expect(Date.now() - started).toBeLessThan(1_000);
		expect(snapshot.source).toBe("checked-in-pinned");
		expect(snapshot.diagnostic.reason).toBe("timeout");
		expect(catalogHasForgeV1(JSON.parse(snapshot.text))).toBe(true);
	});

	test("bounds collected output before terminating the process group", async () => {
		const started = Date.now();
		const result = await runBundledCatalog({
			executable: executable("yes x"),
			timeoutMs: 1_000,
			terminationGraceMs: 30,
			outputLimitBytes: 128,
		});
		expect(Date.now() - started).toBeLessThan(1_000);
		expect(result.reason).toBe("output_limit");
		expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(128);
	});

	test("escalates exactly once to SIGKILL for a TERM-resistant detached group", async () => {
		const directory = mkdtempSync(join(tmpdir(), "forge-catalog-resistant-"));
		temporary.push(directory);
		const groupFile = join(directory, "group.pid");
		const executablePath = executable(
			`trap '' TERM\necho $$ > "${groupFile}"\nwhile :; do :; done`,
		);
		try {
			const result = await runBundledCatalog({
				executable: executablePath,
				env: { ...process.env, GROUP_FILE: groupFile },
				timeoutMs: 1_000,
				terminationGraceMs: 100,
			});
			expect(result.reason).toBe("timeout");
			expect(result.signal).toBe("SIGKILL");
			const groupPid = Number(readFileSync(groupFile, "utf8"));
			expect(processGroupIsAlive(groupPid)).toBe(false);
		} finally {
			for (const pid of [groupFile]
				.filter((path) => existsSync(path))
				.map((path) => Number(readFileSync(path, "utf8")))) {
				if (Number.isInteger(pid) && pid > 0 && processIsAlive(pid)) {
					try {
						process.kill(pid, "SIGKILL");
					} catch {}
				}
			}
		}
	});

	test("fails closed when SIGKILL delivery returns EPERM and the group remains alive", async () => {
		const directory = mkdtempSync(join(tmpdir(), "forge-catalog-kill-eperm-"));
		temporary.push(directory);
		const groupFile = join(directory, "group.pid");
		const executablePath = executable(
			`trap '' TERM\necho $$ > "${groupFile}"\nwhile :; do :; done`,
		);
		const signalProcess = (pid, signal) => {
			if (signal === "SIGKILL") {
				const error = new Error("injected EPERM");
				error.code = "EPERM";
				throw error;
			}
			return process.kill(pid, signal);
		};
		try {
			const result = await runBundledCatalog({
				executable: executablePath,
				signalProcess,
				timeoutMs: 1_000,
				terminationGraceMs: 50,
			});
			expect(result.signal).toBe(null);
			expect(result.error).toMatch(/not verified|remained alive/);
			expect(processGroupIsAlive(Number(readFileSync(groupFile, "utf8")))).toBe(
				true,
			);
		} finally {
			if (existsSync(groupFile)) {
				try {
					process.kill(-Number(readFileSync(groupFile, "utf8")), "SIGKILL");
				} catch {}
			}
		}
	});

	test("does not attribute SIGKILL when the group is already gone and delivery was unverified", async () => {
		const directory = mkdtempSync(join(tmpdir(), "forge-catalog-kill-esrch-"));
		temporary.push(directory);
		const groupFile = join(directory, "group.pid");
		const executablePath = executable(
			`trap 'exit 0' TERM\necho $$ > "${groupFile}"\n(sleep 30) &\nwhile :; do :; done`,
		);
		const signalProcess = (pid, signal) => {
			if (signal === "SIGKILL") {
				try {
					process.kill(pid, signal);
				} catch {}
				const error = new Error("injected ESRCH after delivery race");
				error.code = "ESRCH";
				throw error;
			}
			return process.kill(pid, signal);
		};
		try {
			const result = await runBundledCatalog({
				executable: executablePath,
				signalProcess,
				timeoutMs: 1_000,
				terminationGraceMs: 50,
			});
			expect(result.signal).toBeNull();
			expect(result.error).toBe("SIGKILL delivery was not verified");
			expect(processGroupIsAlive(Number(readFileSync(groupFile, "utf8")))).toBe(
				false,
			);
		} finally {
			if (existsSync(groupFile)) {
				try {
					process.kill(-Number(readFileSync(groupFile, "utf8")), "SIGKILL");
				} catch {}
			}
		}
	});

	test("reports timer-wins SIGKILL cleanup when close is delayed by a detached pipe-holding descendant", async () => {
		const directory = mkdtempSync(join(tmpdir(), "forge-catalog-timer-wins-"));
		temporary.push(directory);
		const groupFile = join(directory, "group.pid");
		const descendantFile = join(directory, "descendant.pid");
		const settlements = [];
		// Node's detached child creates an independent process group without a
		// platform-specific setsid command. The leader ignores TERM; the detached
		// descendant retains the catalog pipes after the original group is killed.
		const executablePath = nodeExecutable(`
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(groupFile)}, String(process.pid));
const holder = spawn(process.execPath, ["-e", "setInterval(() => {}, 30_000)"], { detached: true, stdio: ["ignore", "inherit", "inherit"] });
writeFileSync(${JSON.stringify(descendantFile)}, String(holder.pid));
process.on("SIGTERM", () => {});
setInterval(() => {}, 30_000);
`);
		try {
			const result = await runBundledCatalog({
				executable: executablePath,
				timeoutMs: 1_000,
				terminationGraceMs: 100,
				onSettlement: (event) => settlements.push(event),
			});
			expect(result.reason).toBe("timeout");
			expect(result.signal).toBe("SIGKILL");
			expect(result.error).toBeNull();
			expect(settlements).toEqual([
				{ branch: "timer", gone: true, killDelivered: true },
			]);
			const groupPid = Number(readFileSync(groupFile, "utf8"));
			const descendantPid = Number(readFileSync(descendantFile, "utf8"));
			expect(descendantPid).toBeGreaterThan(0);
			expect(processGroupIsAlive(groupPid)).toBe(false);
		} finally {
			const groupPid = existsSync(groupFile)
				? Number(readFileSync(groupFile, "utf8"))
				: null;
			const descendantPid = existsSync(descendantFile)
				? Number(readFileSync(descendantFile, "utf8"))
				: null;
			if (existsSync(groupFile)) {
				try {
					process.kill(-groupPid, "SIGKILL");
				} catch {}
			}
			if (descendantPid)
				try {
					process.kill(descendantPid, "SIGKILL");
				} catch {}
			const deadline = Date.now() + 1_000;
			while (
				descendantPid &&
				processIsAlive(descendantPid) &&
				Date.now() < deadline
			)
				await new Promise((resolvePromise) => setTimeout(resolvePromise, 20));
			if (groupPid) expect(processGroupIsAlive(groupPid)).toBe(false);
			if (descendantPid) expect(processIsAlive(descendantPid)).toBe(false);
		}
	});

	test("SIGKILLs a TERM-resistant descendant after a status-zero leader exits", async () => {
		const directory = mkdtempSync(
			join(tmpdir(), "forge-catalog-normal-cleanup-"),
		);
		temporary.push(directory);
		const groupFile = join(directory, "group.pid");
		const descendantFile = join(directory, "descendant.pid");
		const executablePath = executable(`
echo $$ > "${groupFile}"
printf '%s\\n' '${JSON.stringify(bundledCatalog())}'
(trap '' TERM; while :; do sleep 1; done) >/dev/null 2>&1 &
echo $! > "${descendantFile}"
`);
		try {
			const result = await runBundledCatalog({
				executable: executablePath,
				timeoutMs: 2_000,
				terminationGraceMs: 100,
			});
			expect(result.status).toBe(0);
			expect(result.signal).toBe("SIGKILL");
			expect(result.error).toBeNull();
			const groupPid = Number(readFileSync(groupFile, "utf8"));
			const descendantPid = Number(readFileSync(descendantFile, "utf8"));
			expect(processGroupIsAlive(groupPid)).toBe(false);
			expect(processIsAlive(descendantPid)).toBe(false);
		} finally {
			const groupPid = existsSync(groupFile)
				? Number(readFileSync(groupFile, "utf8"))
				: null;
			const descendantPid = existsSync(descendantFile)
				? Number(readFileSync(descendantFile, "utf8"))
				: null;
			if (groupPid) {
				try {
					process.kill(-groupPid, "SIGKILL");
				} catch {}
			}
			if (descendantPid) {
				try {
					process.kill(descendantPid, "SIGKILL");
				} catch {}
			}
		}
	});

	test("does not accept status zero when detached cleanup reports an error", async () => {
		const executablePath = executable(
			`printf '%s\\n' '${JSON.stringify(bundledCatalog())}'\n(sleep 30 >/dev/null 2>&1) &\nexit 0`,
		);
		const signalProcess = (pid, signal) => {
			if (signal === 0) {
				const error = new Error("cleanup probe failed");
				error.code = "EIO";
				throw error;
			}
			return process.kill(pid, signal);
		};
		const snapshot = await generateForgeCatalogSnapshot({
			pluginRoot: PLUGIN,
			executable: executablePath,
			signalProcess,
		});
		expect(snapshot.source).toBe("checked-in-pinned");
		expect(snapshot.diagnostic.reason).toBe("cleanup_error");
		expect(snapshot.diagnostic.error).toBe("cleanup probe failed");
	});

	test("checked-in pin supplies all Forge V1 standard-Responses entries", async () => {
		const snapshot = await generateForgeCatalogSnapshot({
			pluginRoot: PLUGIN,
			executable: null,
		});
		expect(snapshot.source).toBe("checked-in-pinned");
		expect(snapshot.diagnostic.reason).toBe("codex_not_found");
		const parsed = JSON.parse(snapshot.text);
		for (const slug of ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]) {
			const model = parsed.models.find((item) => item.slug === slug);
			expect(model.display_name).toBeTruthy();
			expect(model.multi_agent_version).toBe("v1");
			expect(model.use_responses_lite).toBe(false);
		}
		for (const slug of ["gpt-daybreak-blue-latest", "gpt-daybreak-red-latest"])
			expect(parsed.models.some((model) => model.slug === slug)).toBe(true);
		expect(snapshot.text).toBe(
			readFileSync(resolve(PLUGIN, "assets/model-catalog.json"), "utf8"),
		);
	});

	test("developer refresh writes a successful catalog atomically and exits without a live process group", () => {
		const directory = mkdtempSync(join(tmpdir(), "forge-catalog-cli-"));
		temporary.push(directory);
		const input = join(directory, "catalog.json");
		const output = join(directory, "output.json");
		const pidFile = join(directory, "descendant.pid");
		writeFileSync(input, JSON.stringify(bundledCatalog()));
		const command = executable(
			'(sleep 30 </dev/null >/dev/null 2>&1) &\necho $! > "$DESCENDANT_PID"\ncat "$CATALOG_INPUT"',
		);
		const result = runCatalogCli([`--write=${output}`, `--codex=${command}`], {
			CATALOG_INPUT: input,
			DESCENDANT_PID: pidFile,
		});
		expect(result.error).toBeUndefined();
		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toBe(output);
		expect(readFileSync(output, "utf8")).toBe(
			`${JSON.stringify(applyForgeCatalogPatches(bundledCatalog()), null, 2)}\n`,
		);
		expect(processIsAlive(Number(readFileSync(pidFile, "utf8")))).toBe(false);
		expect(readdirSync(directory).some((name) => name.includes(".tmp"))).toBe(
			false,
		);
	});

	test("developer refresh requires an explicit output path", () => {
		const result = runCatalogCli([]);
		expect(result.error).toBeUndefined();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("requires --write=<path>");
	});

	test.each([
		[
			"timeout",
			"trap '' TERM\nsleep 30",
			["--timeout-ms=30", "--termination-grace-ms=30"],
		],
		["nonzero_exit", "exit 7", []],
		["malformed_output", 'printf "not-json\\n"', []],
	])(
		"developer refresh preserves the pinned output after %s",
		(reason, body, extraArguments) => {
			const directory = mkdtempSync(join(tmpdir(), "forge-catalog-cli-fail-"));
			temporary.push(directory);
			const output = join(directory, "output.json");
			writeFileSync(output, "private catalog\n");
			const result = runCatalogCli([
				`--write=${output}`,
				`--codex=${executable(body)}`,
				...extraArguments,
			]);
			expect(result.error).toBeUndefined();
			expect(result.status).toBe(1);
			expect(result.stderr).toContain(reason);
			expect(result.stderr).toContain("pinned catalog unchanged");
			expect(readFileSync(output, "utf8")).toBe("private catalog\n");
			expect(existsSync(output)).toBe(true);
		},
	);
});
