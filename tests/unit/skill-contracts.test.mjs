import { afterEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { YAML } from "bun";

const PLUGIN = resolve(import.meta.dir, "../../plugins/codex-forge");
const VALIDATOR = join(
	PLUGIN,
	"skills/forge-skill-creator/scripts/validate-skill.mjs",
);
const INITIALIZER = join(
	PLUGIN,
	"skills/forge-skill-creator/scripts/init-skill.mjs",
);
const read = (path) => readFileSync(path, "utf8");
const decode = (bytes) => new TextDecoder().decode(bytes);
const run = (...args) =>
	Bun.spawnSync({
		cmd: ["bun", ...args],
		cwd: PLUGIN,
		stdout: "pipe",
		stderr: "pipe",
	});
const temporaryDirectories = [];
const temporaryDirectory = () => {
	const directory = mkdtempSync(join(tmpdir(), "codex-forge-skill-"));
	temporaryDirectories.push(directory);
	return directory;
};

afterEach(() => {
	for (const directory of temporaryDirectories.splice(0))
		rmSync(directory, { recursive: true, force: true });
});

describe("skills", () => {
	const skillDirectories = readdirSync(join(PLUGIN, "skills"), {
		withFileTypes: true,
	})
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	test("surface remains focused", () =>
		expect(skillDirectories).toEqual(["forge-setup", "forge-skill-creator"]));

	for (const name of skillDirectories)
		test(`${name} follows the Forge agent-skill contract`, () => {
			const directory = join(PLUGIN, "skills", name);
			const skill = read(join(directory, "SKILL.md"));
			const frontmatterMatch = skill.match(/^---\n([\s\S]*?)\n---/);
			expect(frontmatterMatch).not.toBeNull();
			const frontmatter = YAML.parse(frontmatterMatch[1]);
			expect(frontmatter.name).toBe(name);
			expect(frontmatter.description).toBeTruthy();
			expect(Object.keys(frontmatter).sort()).toEqual(
				["description", "license", "name"].sort(),
			);
			for (const heading of [
				"## Start with evidence",
				"## Workflow",
				"## Validation",
				"## Boundaries",
			])
				expect(skill).toContain(heading);
			expect(skill.split("\n").length).toBeLessThanOrEqual(500);
			expect(existsSync(join(directory, "references", "index.md"))).toBe(false);

			const metadata = YAML.parse(
				read(join(directory, "agents", "openai.yaml")),
			);
			expect(metadata.interface.display_name).toBeTruthy();
			expect(
				metadata.interface.short_description.length,
			).toBeGreaterThanOrEqual(25);
			expect(metadata.interface.short_description.length).toBeLessThanOrEqual(
				64,
			);
			expect(metadata.interface.default_prompt).toContain(`$${name}`);
			expect(metadata.policy.allow_implicit_invocation).toBe(false);

			for (const link of [...skill.matchAll(/\]\(([^)]+\.md)\)/g)].map(
				(match) => match[1],
			))
				expect(existsSync(join(directory, link))).toBe(true);

			const result = run(VALIDATOR, directory, "--explicit-only");
			expect(decode(result.stderr)).toBe("");
			expect(result.exitCode).toBe(0);
		});

	test("validator rejects unsupported frontmatter", () => {
		const parent = temporaryDirectory();
		const directory = join(parent, "bad-skill");
		mkdirSync(join(directory, "agents"), { recursive: true });
		Bun.write(
			join(directory, "SKILL.md"),
			`---
name: bad-skill
description: A sufficiently descriptive invalid fixture for structural checks.
compatibility: unsupported
---

# Bad Skill
`,
		);
		Bun.write(
			join(directory, "agents/openai.yaml"),
			`interface:
  display_name: "Bad Skill"
  short_description: "A deliberately invalid skill fixture"
  default_prompt: "Use $bad-skill to test validation."
`,
		);

		const result = run(VALIDATOR, directory);
		expect(result.exitCode).toBe(1);
		expect(decode(result.stderr)).toContain(
			"unsupported SKILL.md frontmatter key: compatibility",
		);
	});

	test("initializer creates the standard anatomy and explicit policy", () => {
		const parent = temporaryDirectory();
		const result = run(
			INITIALIZER,
			"sample-skill",
			"--path",
			parent,
			"--resources",
			"scripts,references",
			"--explicit-only",
		);
		expect(decode(result.stderr)).toBe("");
		expect(result.exitCode).toBe(0);

		const directory = join(parent, "sample-skill");
		expect(existsSync(join(directory, "SKILL.md"))).toBe(true);
		expect(existsSync(join(directory, "agents/openai.yaml"))).toBe(true);
		expect(existsSync(join(directory, "scripts"))).toBe(true);
		expect(existsSync(join(directory, "references"))).toBe(true);
		expect(read(join(directory, "agents/openai.yaml"))).toContain(
			"allow_implicit_invocation: false",
		);
	});
});
