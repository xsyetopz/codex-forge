import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmodSync,
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { forgeCatalogSatisfiesContract } from "../../../plugins/codex-forge/scripts/installer/catalog.mjs";
import { PLUGIN, ROOT, read } from "./support.mjs";

test("Reddit evidence captures remain byte-identical to the audited corpus", () => {
	const manifest = read(join(ROOT, "docs", "evidence", "reddit.sha256"))
		.trim()
		.split("\n")
		.map((line) => {
			const match = line.match(/^([a-f0-9]{64}) {2}(docs\/reddit\/.+\.md)$/);
			expect(match).toBeTruthy();
			return [match[2], match[1]];
		});
	const expected = new Map(manifest);
	const files = readdirSync(join(ROOT, "docs", "reddit"))
		.filter((name) => name.endsWith(".md"))
		.map((name) => `docs/reddit/${name}`)
		.sort();
	expect(files).toEqual([...expected.keys()].sort());
	for (const path of files)
		expect(
			createHash("sha256")
				.update(read(join(ROOT, path)))
				.digest("hex"),
		).toBe(expected.get(path));
});

test("model instruction replacement remains lean, positive, and pinned", () => {
	const modelInstructions = read(
		join(PLUGIN, "assets", "model-instructions.md"),
	);
	const developerInstructions = read(
		join(PLUGIN, "assets", "developer-instructions.txt"),
	);
	const words = modelInstructions.trim().split(/\s+/).length;
	const digest = createHash("sha256").update(modelInstructions).digest("hex");
	expect(words).toBe(290);
	expect(digest).toBe(
		"3ed2a357d3c1da3452066959bf8670a42b24811525884937c6e0cd2cdd74fd4c",
	);
	for (const text of [modelInstructions, developerInstructions])
		for (const negative of [
			/\bdo not\b/i,
			/\bnever\b/i,
			/\bnot\b/i,
			/\bwithout\b/i,
			/\bavoid\b/i,
		])
			expect(text).not.toMatch(negative);
	expect(modelInstructions).toContain("!RAW");
	expect(modelInstructions.indexOf("Honor exact requirements")).toBeLessThan(
		modelInstructions.indexOf(
			"produce precise, safe outcomes through harness tools",
		),
	);
});

test("README installation and validation commands match distributed entrypoints", () => {
	const readme = read(join(ROOT, "README.md"));
	for (const command of [
		"bun install.mjs install",
		"bun install.mjs doctor",
		"bun install.mjs revert",
		"bun install.mjs uninstall",
		"bun run validate:schemas",
		"bun run test",
	])
		expect(readme).toContain(command);
	for (const path of [
		"AGENTS.md",
		"CONTRIBUTING.md",
		"Justfile",
		"docs/README.md",
		"docs/architecture.md",
		"docs/operations/reinstall-recovery.md",
		"docs/operations/compaction.md",
		"docs/reference/failure-controls.md",
		"docs/evidence/codex-cli-0.151.0.md",
		"docs/evidence/community-observations.md",
		"docs/evidence/model-instructions.md",
		"docs/evidence/research-synthesis.md",
		"docs/evidence/session-observations.md",
	])
		expect(existsSync(join(ROOT, path))).toBe(true);
	const recovery = read(join(ROOT, "docs/operations/reinstall-recovery.md"));
	const packagedRecovery = read(
		join(
			PLUGIN,
			"skills",
			"forge-setup",
			"references",
			"reinstall-recovery.md",
		),
	);
	for (const command of [
		"bun install.mjs reinstall",
		"bun install.mjs doctor --purge-cache",
		"bun install.mjs doctor --json",
		"osascript -e 'tell application \"Codex Proxy\" to quit'",
		"kill -TERM <stale-pid>",
		"kill -KILL <stale-pid>",
		"/hooks",
		"multi_agent_v1spawn_agent",
		"multi_agent_v1wait_agent",
		"multi_agent_v1close_agent",
		"multi_agent_v1send_input",
	])
		expect(recovery).toContain(command);
	expect(recovery).toContain(
		"Run recovery commands from a separate macOS Terminal window",
	);
	expect(recovery).toContain("c.models?.some");
	expect(recovery).toContain(
		'export CODEX_HOME="${' + 'CODEX_HOME:-$HOME/.codex}"',
	);
	expect(
		forgeCatalogSatisfiesContract(join(PLUGIN, "assets", "model-catalog.json")),
	).toBe(true);
	expect(recovery).not.toContain('multi_agent_version = "v1"');
	expect(recovery).not.toContain("use_responses_lite = false");
	const defaultHome = mkdtempSync(join(tmpdir(), "forge-recovery-contract-"));
	try {
		mkdirSync(join(defaultHome, ".codex", "forge"), { recursive: true });
		cpSync(
			join(PLUGIN, "assets", "model-catalog.json"),
			join(defaultHome, ".codex", "forge", "model-catalog.json"),
		);
		const defaultPathSetup =
			'export CODEX_HOME="${' + 'CODEX_HOME:-$HOME/.codex}"';
		const verificationCommand = recovery.match(/node -e '([^']+)'/)?.[0];
		expect(defaultPathSetup).toBeTruthy();
		expect(verificationCommand).toBeTruthy();
		const verification = spawnSync(
			"sh",
			[
				"-eu",
				"-c",
				`unset CODEX_HOME\n${defaultPathSetup}\n${verificationCommand}`,
			],
			{
				env: { ...process.env, HOME: defaultHome },
				encoding: "utf8",
			},
		);
		expect(verification.status).toBe(0);
		expect(verification.stdout).toContain("Forge V1 catalog: ok");
	} finally {
		rmSync(defaultHome, { recursive: true, force: true });
	}
	for (const marker of [
		"osascript -e",
		"kill -TERM <stale-pid>",
		"export CODEX_HOME=",
		"multi_agent_v1spawn_agent",
		"multi_agent_v1wait_agent",
		"multi_agent_v1close_agent",
	])
		expect(packagedRecovery).toContain(marker);
	expect(packagedRecovery).toContain("bun install.mjs reinstall");
	expect(packagedRecovery).toContain("never an upgrade source");
	expect(packagedRecovery).not.toContain(
		'bun "$PLUGIN_ROOT/scripts/install.mjs" install',
	);
	expect(packagedRecovery).toContain(
		'bun "$PLUGIN_ROOT/scripts/install.mjs" doctor --purge-cache',
	);
	for (const marker of [
		"model_catalog_json",
		"model_instructions_file",
		"multi_agent_v2",
		'"multi_agent_version": "v1"',
		'"use_responses_lite": false',
	])
		expect(packagedRecovery).toContain(marker);
	const sourceBlock = recovery.match(/```sh\n(FORGE_CHECKOUT[\s\S]*?)```/)?.[1];
	const sourceSequenceHome = mkdtempSync(
		join(tmpdir(), "forge-source-contract-"),
	);
	try {
		const fakeBin = join(sourceSequenceHome, "bin");
		const fakeCheckout = join(sourceSequenceHome, "checkout");
		const log = join(sourceSequenceHome, "bun.log");
		mkdirSync(fakeBin, { recursive: true });
		mkdirSync(fakeCheckout, { recursive: true });
		writeFileSync(join(fakeCheckout, "install.mjs"), "fixture");
		const fakeBun = join(fakeBin, "bun");
		writeFileSync(fakeBun, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$FORGE_LOG"\n');
		chmodSync(fakeBun, 0o755);
		const sourceScript = sourceBlock.replace(
			'FORGE_CHECKOUT="/path/to/current/codex-forge"',
			`FORGE_CHECKOUT="${fakeCheckout}"`,
		);
		expect(sourceBlock).toBeTruthy();
		expect(sourceBlock).not.toContain("PLUGIN_ROOT");
		const sequence = spawnSync(
			"sh",
			["-eu", "-c", `unset PLUGIN_ROOT\n${sourceScript}`],
			{
				env: {
					...process.env,
					PATH: `${fakeBin}:${process.env.PATH}`,
					FORGE_LOG: log,
				},
				encoding: "utf8",
			},
		);
		expect(sequence.status).toBe(0);
		expect(readFileSync(log, "utf8")).toContain("install.mjs reinstall");
	} finally {
		rmSync(sourceSequenceHome, { recursive: true, force: true });
	}
	const packagedLines = packagedRecovery.split("\n");
	const resolverStart = packagedLines.findIndex((line) =>
		line.startsWith('INSTALLED_VERSION="$(node -e'),
	);
	const resolverEnd = packagedLines.findIndex(
		(line, index) => index > resolverStart && line === "export PLUGIN_ROOT",
	);
	const resolver = packagedLines.slice(resolverStart, resolverEnd).join("\n");
	expect(resolverStart).toBeGreaterThan(-1);
	expect(resolverEnd).toBeGreaterThan(resolverStart);
	const resolverHome = mkdtempSync(join(tmpdir(), "forge-root-contract-"));
	try {
		const installedRoot = join(
			resolverHome,
			"plugins",
			"cache",
			"codex-forge-marketplace",
			"codex-forge",
			"0.1.0-alpha.4",
		);
		mkdirSync(join(resolverHome, "forge"), { recursive: true });
		writeFileSync(
			join(resolverHome, "forge", "install-state.json"),
			JSON.stringify({ plugin_version: "0.1.0-alpha.4" }),
		);
		mkdirSync(join(installedRoot, "skills", "forge-setup", "references"), {
			recursive: true,
		});
		mkdirSync(join(installedRoot, "scripts"), { recursive: true });
		mkdirSync(join(installedRoot, ".codex-plugin"), { recursive: true });
		mkdirSync(
			join(
				resolverHome,
				"plugins",
				"cache",
				"stale-marketplace",
				"codex-forge",
				"0.1.0-alpha.3",
				"skills",
				"forge-setup",
				"references",
			),
			{ recursive: true },
		);
		writeFileSync(
			join(
				installedRoot,
				"skills",
				"forge-setup",
				"references",
				"reinstall-recovery.md",
			),
			"fixture",
		);
		writeFileSync(join(installedRoot, "scripts", "install.mjs"), "fixture");
		writeFileSync(
			join(installedRoot, ".codex-plugin", "plugin.json"),
			JSON.stringify({ version: "0.1.0-alpha.4" }),
		);
		const resolved = spawnSync(
			"sh",
			[
				"-eu",
				"-c",
				`unset PLUGIN_ROOT\nexport CODEX_HOME="$CODEX_HOME"\n${resolver}\nprintf '%s' "$PLUGIN_ROOT"`,
			],
			{ env: { ...process.env, CODEX_HOME: resolverHome }, encoding: "utf8" },
		);
		expect(resolved.status).toBe(0);
		expect(resolved.stdout).toBe(installedRoot);
		const ambiguousRoot = join(
			resolverHome,
			"plugins",
			"cache",
			"second-marketplace",
			"codex-forge",
			"0.1.0-alpha.4",
		);
		mkdirSync(join(ambiguousRoot, "skills", "forge-setup", "references"), {
			recursive: true,
		});
		mkdirSync(join(ambiguousRoot, "scripts"), { recursive: true });
		mkdirSync(join(ambiguousRoot, ".codex-plugin"), { recursive: true });
		writeFileSync(
			join(
				ambiguousRoot,
				"skills",
				"forge-setup",
				"references",
				"reinstall-recovery.md",
			),
			"fixture",
		);
		writeFileSync(join(ambiguousRoot, "scripts", "install.mjs"), "fixture");
		writeFileSync(
			join(ambiguousRoot, ".codex-plugin", "plugin.json"),
			JSON.stringify({ version: "0.1.0-alpha.4" }),
		);
		const ambiguous = spawnSync(
			"sh",
			["-eu", "-c", `unset PLUGIN_ROOT\n${resolver}`],
			{
				env: { ...process.env, CODEX_HOME: resolverHome },
				encoding: "utf8",
			},
		);
		expect(ambiguous.status).not.toBe(0);
	} finally {
		rmSync(resolverHome, { recursive: true, force: true });
	}
	expect(read(join(ROOT, "Justfile"))).toContain("bun install.mjs reinstall");
	expect(readme).toContain("docs/evidence/model-instructions.md");
	expect(readme).toContain("AGENTS.md");
	expect(readme).toContain("CONTRIBUTING.md");
	expect(readme).toContain("290-word");
	expect(readme).not.toContain("283-word");
	expect(readme).not.toContain("359-word");
	expect(read(join(ROOT, "AGENTS.md"))).toContain(
		"docs/evidence/model-instructions.md",
	);
	expect(read(join(ROOT, "CONTRIBUTING.md"))).toContain(
		"tests/unit/contracts/documentation.test.mjs",
	);
	const setup = read(join(PLUGIN, "skills", "forge-setup", "SKILL.md"));
	const lifecycle = read(
		join(PLUGIN, "skills", "forge-setup", "references", "managed-files.md"),
	);
	for (const document of [readme, setup, lifecycle]) {
		expect(document).toContain("/hooks");
		expect(document.toLowerCase()).toContain("trust");
	}
});
