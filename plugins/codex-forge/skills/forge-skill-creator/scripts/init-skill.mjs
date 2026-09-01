#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const usage = () => {
	console.error(
		"Usage: bun init-skill.mjs <skill-name> --path <skills-directory> [--resources scripts,references,assets] [--explicit-only]",
	);
	process.exit(2);
};

const args = process.argv.slice(2);
const name = args.shift();
let parent;
let resources = [];
let explicitOnly = false;

while (args.length > 0) {
	const option = args.shift();
	if (option === "--path") parent = args.shift();
	else if (option === "--resources")
		resources = (args.shift() ?? "")
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean);
	else if (option === "--explicit-only") explicitOnly = true;
	else usage();
}

if (!name || !parent) usage();
if (
	name.length > 64 ||
	!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
	basename(name) !== name
)
	throw new Error(
		"skill name must be lowercase hyphen-case, contain at most 64 characters, and contain no path separators",
	);

const allowedResources = new Set(["scripts", "references", "assets"]);
for (const resource of resources)
	if (!allowedResources.has(resource))
		throw new Error(`unsupported resource directory: ${resource}`);
resources = [...new Set(resources)];

const directory = resolve(parent, name);
if (existsSync(directory))
	throw new Error(`skill already exists: ${directory}`);

const title = name
	.split("-")
	.map((word) => word[0].toUpperCase() + word.slice(1))
	.join(" ");
const skill = `---
name: ${name}
description: "[TODO: State what this skill does, when it applies, and important exclusions.]"
---

# ${title}

[TODO: Add only task-specific procedure and decision criteria that the base agent would not reliably infer.]
`;
const policy = explicitOnly
	? "\npolicy:\n  allow_implicit_invocation: false\n"
	: "";
const openai = `interface:
  display_name: ${JSON.stringify(title)}
  short_description: "[TODO: Add a 25–64 character scanning label]"
  default_prompt: ${JSON.stringify(`Use $${name} to perform the bounded task.`)}
${policy}`;

mkdirSync(resolve(directory, "agents"), { recursive: true });
for (const resource of resources)
	mkdirSync(resolve(directory, resource), { recursive: true });
writeFileSync(resolve(directory, "SKILL.md"), skill);
writeFileSync(resolve(directory, "agents", "openai.yaml"), openai);
console.log(directory);
