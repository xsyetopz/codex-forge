#!/usr/bin/env bun

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { YAML } from "bun";

const usage = () => {
	console.error(
		"Usage: bun validate-skill.mjs <skill-directory> [--explicit-only]",
	);
	process.exit(2);
};

const args = process.argv.slice(2);
const directoryArgument = args.shift();
let explicitOnly = false;
for (const option of args) {
	if (option === "--explicit-only") explicitOnly = true;
	else usage();
}
if (!directoryArgument) usage();

const directory = resolve(directoryArgument);
const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(path, "utf8");
const withinSkill = (path) => {
	const pathFromSkill = relative(directory, path);
	return pathFromSkill !== ".." && !pathFromSkill.startsWith(`..${sep}`);
};

if (!existsSync(directory) || !statSync(directory).isDirectory())
	fail(`skill directory not found: ${directory}`);

const skillPath = resolve(directory, "SKILL.md");
let skill = "";
let frontmatter = {};
if (!existsSync(skillPath)) fail("SKILL.md not found");
else {
	skill = read(skillPath);
	const match = skill.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
	if (!match) fail("SKILL.md must begin with YAML frontmatter");
	else {
		try {
			frontmatter = YAML.parse(match[1]);
		} catch (error) {
			fail(`invalid SKILL.md frontmatter: ${error.message}`);
		}
	}
}

if (
	!frontmatter ||
	typeof frontmatter !== "object" ||
	Array.isArray(frontmatter)
)
	fail("SKILL.md frontmatter must be a mapping");
else {
	const allowed = new Set([
		"name",
		"description",
		"license",
		"allowed-tools",
		"metadata",
	]);
	for (const key of Object.keys(frontmatter))
		if (!allowed.has(key)) fail(`unsupported SKILL.md frontmatter key: ${key}`);

	const name = frontmatter.name;
	if (typeof name !== "string" || !name)
		fail("frontmatter name must be a non-empty string");
	else {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
			fail("frontmatter name must use lowercase hyphen-case");
		if (name.length > 64) fail("frontmatter name exceeds 64 characters");
		if (name !== basename(directory))
			fail("frontmatter name must match the skill directory");
	}

	const description = frontmatter.description;
	if (typeof description !== "string" || !description.trim())
		fail("frontmatter description must be a non-empty string");
	else {
		if (description.length > 1024)
			fail("frontmatter description exceeds 1024 characters");
		if (/[<>]/.test(description))
			fail("frontmatter description must not contain angle brackets");
		if (/\[TODO:/i.test(description))
			fail("frontmatter description contains a TODO placeholder");
	}
}

if (/^\s*\[TODO:[^\n]*\]\s*$/im.test(skill))
	fail("SKILL.md contains a TODO placeholder");
if (skill.split("\n").length > 500) fail("SKILL.md exceeds 500 lines");

const forbiddenNames = new Set([
	"readme.md",
	"changelog.md",
	"installation.md",
	"install.md",
]);
const walk = (root) => {
	if (!existsSync(root)) return [];
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(root, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
};
const files = existsSync(directory) ? walk(directory) : [];
for (const path of files) {
	const name = basename(path).toLowerCase();
	if (forbiddenNames.has(name))
		fail(`unsupported auxiliary documentation: ${relative(directory, path)}`);
	if (relative(directory, path) === "references/index.md")
		fail("references/index.md is not allowed; link references directly");
}

const linkedMarkdown = new Set();
for (const match of skill.matchAll(/\]\(([^)]+\.md(?:#[^)]+)?)\)/g)) {
	const target = match[1].split("#", 1)[0];
	if (/^[a-z]+:/i.test(target)) continue;
	const resolvedTarget = resolve(dirname(skillPath), target);
	if (!withinSkill(resolvedTarget))
		fail(`Markdown link leaves the skill: ${target}`);
	else if (!existsSync(resolvedTarget)) fail(`broken Markdown link: ${target}`);
	else linkedMarkdown.add(relative(directory, resolvedTarget));
}
for (const path of files.filter(
	(path) =>
		relative(directory, path).startsWith(`references${sep}`) &&
		path.endsWith(".md"),
)) {
	const pathFromSkill = relative(directory, path);
	if (!linkedMarkdown.has(pathFromSkill))
		fail(`orphan reference is not linked from SKILL.md: ${pathFromSkill}`);
}

const metadataPath = resolve(directory, "agents", "openai.yaml");
if (!existsSync(metadataPath)) fail("agents/openai.yaml not found");
else {
	const source = read(metadataPath);
	let metadata;
	try {
		metadata = YAML.parse(source);
	} catch (error) {
		fail(`invalid agents/openai.yaml: ${error.message}`);
	}
	if (metadata && typeof metadata === "object") {
		for (const key of Object.keys(metadata))
			if (!["interface", "dependencies", "policy"].includes(key))
				fail(`unsupported agents/openai.yaml key: ${key}`);
		const ui = metadata.interface;
		if (!ui || typeof ui !== "object")
			fail("openai.yaml interface is required");
		else {
			if (typeof ui.display_name !== "string" || !ui.display_name)
				fail("interface.display_name must be a non-empty string");
			if (
				typeof ui.short_description !== "string" ||
				ui.short_description.length < 25 ||
				ui.short_description.length > 64
			)
				fail("interface.short_description must contain 25–64 characters");
			if (
				typeof ui.default_prompt !== "string" ||
				!ui.default_prompt.includes(`$${frontmatter.name ?? ""}`)
			)
				fail("interface.default_prompt must name the skill with $skill-name");
		}
		const invocation = metadata.policy?.allow_implicit_invocation;
		if (invocation !== undefined && typeof invocation !== "boolean")
			fail("policy.allow_implicit_invocation must be a boolean");
		if (explicitOnly && invocation !== false)
			fail(
				"explicit-only validation requires allow_implicit_invocation: false",
			);
		if (!explicitOnly && invocation === false)
			fail(
				"allow_implicit_invocation: false requires the --explicit-only decision",
			);
	}
	for (const key of ["display_name", "short_description", "default_prompt"])
		if (!new RegExp(`^\\s+${key}:\\s+["']`, "m").test(source))
			fail(`interface.${key} must use a quoted YAML string`);
}

if (failures.length > 0) {
	for (const failure of failures) console.error(`[invalid] ${failure}`);
	process.exit(1);
}
console.log(`[valid] ${directory}`);
