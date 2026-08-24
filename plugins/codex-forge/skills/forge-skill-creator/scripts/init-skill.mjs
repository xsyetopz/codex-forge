#!/usr/bin/env bun
// Derived from OpenAI's built-in skill-creator initializer and substantially
// modified for Codex Forge's compact Workflow/Gotchas starter.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const name = args[0] ?? "";
const pathIndex = args.indexOf("--path");
const parent = pathIndex >= 0 ? args[pathIndex + 1] : "";
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64 || !parent) {
	process.stderr.write(
		"Usage: init-skill.mjs <lowercase-skill-name> --path <parent-directory>\n",
	);
	process.exit(2);
}
const root = resolve(parent, name);
if (existsSync(root)) {
	process.stderr.write(
		`Choose a new path or update the existing skill in place: ${root}\n`,
	);
	process.exit(1);
}
mkdirSync(resolve(root, "agents"), { recursive: true });
const title = name
	.split("-")
	.map((word) => word[0].toUpperCase() + word.slice(1))
	.join(" ");
writeFileSync(
	resolve(root, "SKILL.md"),
	`---\nname: ${name}\ndescription: Use this skill when [TODO: describe the user intent and nearest routing boundary].\n---\n\n# ${title}\n\n## Workflow\n\n1. [TODO: replace this line with the shortest complete task workflow.]\n\n## Gotchas\n\n- [TODO: add only surprising facts that materially change execution.]\n`,
);
writeFileSync(
	resolve(root, "agents", "openai.yaml"),
	`interface:\n  display_name: "${title}"\n  short_description: "Create and use ${title} workflows"\n  default_prompt: "Use $${name} to complete this task."\n`,
);
process.stdout.write(`[OK] Created ${root}\n`);
