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
