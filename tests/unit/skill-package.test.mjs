import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");
const SKILLS = join(ROOT, "plugins", "codex-forge", "skills");
const CHECKER = join(
	SKILLS,
	"forge-skill-creator",
	"scripts",
	"check-skill.mjs",
);
const INITIALIZER = join(
	SKILLS,
	"forge-skill-creator",
	"scripts",
	"init-skill.mjs",
);
const temporary = [];

afterEach(() => {
	for (const path of temporary.splice(0))
		rmSync(path, { recursive: true, force: true });
});

function run(script, args) {
	return spawnSync("bun", [script, ...args], { encoding: "utf8" });
}

describe("Forge skill package tools", () => {
	test("accepts every distributed Forge skill", () => {
		const directories = readdirSync(SKILLS, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => join(SKILLS, entry.name));
		const result = run(CHECKER, directories);
		expect(result.status).toBe(0);
		expect(result.stderr).toBe("");
	});

	test("rejects router indirection and unfinished scaffolds", () => {
		const parent = mkdtempSync(join(tmpdir(), "forge-skill-check-"));
		temporary.push(parent);
		const result = run(INITIALIZER, ["sample-skill", "--path", parent]);
		expect(result.status).toBe(0);
		const root = join(parent, "sample-skill");
		mkdirSync(join(root, "references"));
		writeFileSync(join(root, "references", "index.md"), "# Router\n");
		const checked = run(CHECKER, [root]);
		expect(checked.status).toBe(1);
		expect(checked.stderr).toContain("unfinished placeholder");
		expect(checked.stderr).toContain("references/index.md");
	});
});
