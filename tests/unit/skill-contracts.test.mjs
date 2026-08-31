import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { YAML } from "bun";

const PLUGIN = resolve(import.meta.dir, "../../plugins/codex-forge");
const read = (path) => readFileSync(path, "utf8");

describe("skills", () => {
	const skillDirectories = readdirSync(join(PLUGIN, "skills"), {
		withFileTypes: true,
	})
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
	test("surface remains focused", () =>
		expect(skillDirectories).toEqual(["forge-setup"]));
	for (const name of skillDirectories)
		test(`${name} is concise and indexable`, () => {
			const directory = join(PLUGIN, "skills", name);
			const skill = read(join(directory, "SKILL.md"));
			expect(skill).toContain(`name: ${name}`);
			expect(skill).toMatch(
				/description: (?:Use this skill when\b|Explicit `\$[a-z0-9-]+` workflow\b)/,
			);
			expect(skill).toContain("## Workflow");
			expect(skill).toContain("## Gotchas");
			expect(skill.split("\n").length).toBeLessThanOrEqual(500);
			expect(existsSync(join(directory, "references", "index.md"))).toBe(false);
			const metadata = YAML.parse(
				read(join(directory, "agents", "openai.yaml")),
			);
			expect(metadata.interface.display_name).toBeTruthy();
			expect(metadata.interface.default_prompt).toContain(`$${name}`);
			expect(metadata.policy.allow_implicit_invocation).toBe(false);
			for (const link of [...skill.matchAll(/\]\(([^)]+\.md)\)/g)].map(
				(match) => match[1],
			))
				expect(existsSync(join(directory, link))).toBe(true);
		});
});
