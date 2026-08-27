#!/usr/bin/env bun
// Derived from OpenAI's built-in skill-creator validator and substantially
// modified for Codex Forge's progressive-disclosure package contract.
import {
	existsSync,
	lstatSync,
	readdirSync,
	readFileSync,
	realpathSync,
} from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { YAML } from "bun";

const ALLOWED_FRONTMATTER = new Set([
	"name",
	"description",
	"license",
	"compatibility",
	"metadata",
	"allowed-tools",
]);
const AUXILIARY_NAMES = new Set([
	"README.md",
	"INSTALLATION_GUIDE.md",
	"QUICK_REFERENCE.md",
	"CHANGELOG.md",
]);

function filesUnder(directory) {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? filesUnder(path) : [path];
	});
}

function frontmatter(content, errors) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) {
		errors.push("SKILL.md needs YAML frontmatter delimited by --- lines");
		return { data: {}, body: content };
	}
	try {
		const data = YAML.parse(match[1]);
		if (!data || typeof data !== "object" || Array.isArray(data)) {
			errors.push("frontmatter needs a YAML mapping");
			return { data: {}, body: content.slice(match[0].length) };
		}
		return { data, body: content.slice(match[0].length) };
	} catch (error) {
		errors.push(`frontmatter YAML is invalid: ${error.message}`);
		return { data: {}, body: content.slice(match[0].length) };
	}
}

function inside(root, path) {
	const rel = relative(root, path);
	return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== "..");
}

function validate(skillDirectory) {
	const root = resolve(skillDirectory);
	const errors = [];
	const warnings = [];
	const skillFile = join(root, "SKILL.md");
	if (!existsSync(skillFile))
		return { root, errors: ["SKILL.md is required"], warnings };

	const content = readFileSync(skillFile, "utf8");
	const { data, body } = frontmatter(content, errors);
	for (const key of Object.keys(data))
		if (!ALLOWED_FRONTMATTER.has(key))
			errors.push(`unsupported frontmatter field: ${key}`);

	const name = typeof data.name === "string" ? data.name.trim() : "";
	if (!name) errors.push("frontmatter name is required");
	else {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
			errors.push("name needs lowercase letters, digits, and single hyphens");
		if (name.length > 64) errors.push("name exceeds 64 characters");
		if (name !== basename(root))
			errors.push(`name must match directory '${basename(root)}'`);
	}

	const description =
		typeof data.description === "string" ? data.description.trim() : "";
	if (!description) errors.push("frontmatter description is required");
	if (description.length > 1024)
		errors.push("description exceeds 1024 characters");
	if (
		description &&
		!/^(?:Use this skill when\b|Explicit `\$[a-z0-9-]+` workflow\b)/.test(
			description,
		)
	)
		warnings.push(
			"description needs intent routing or an explicit selector boundary",
		);

	if (data.compatibility !== undefined) {
		if (typeof data.compatibility !== "string" || !data.compatibility.trim())
			errors.push("compatibility needs a non-empty string");
		else if (data.compatibility.length > 500)
			errors.push("compatibility exceeds 500 characters");
	}
	if (
		data.license !== undefined &&
		(typeof data.license !== "string" || !data.license.trim())
	)
		errors.push("license needs a non-empty string");
	if (
		data["allowed-tools"] !== undefined &&
		typeof data["allowed-tools"] !== "string"
	)
		errors.push("allowed-tools needs a space-separated string");
	if (data.metadata !== undefined) {
		if (
			!data.metadata ||
			typeof data.metadata !== "object" ||
			Array.isArray(data.metadata)
		)
			errors.push("metadata needs a string-to-string mapping");
		else if (
			Object.values(data.metadata).some((value) => typeof value !== "string")
		)
			errors.push("metadata values need strings");
	}

	const lines = content.split(/\r?\n/).length;
	if (lines > 500)
		errors.push(`SKILL.md has ${lines} lines; keep it at or below 500`);
	if (!body.trim())
		errors.push("SKILL.md needs task instructions after frontmatter");
	if (/\b(?:TODO|FIXME|TBD)\b|\[TODO:/i.test(content))
		errors.push("unfinished placeholder found");

	for (const file of filesUnder(root)) {
		if (AUXILIARY_NAMES.has(basename(file)))
			errors.push(
				`move auxiliary documentation out of the skill: ${relative(root, file)}`,
			);
		if (basename(file) === ".DS_Store")
			errors.push(
				`remove filesystem metadata from the skill: ${relative(root, file)}`,
			);
		if (lstatSync(file).isSymbolicLink()) {
			const target = realpathSync(file);
			if (!inside(root, target))
				errors.push(`symlink leaves the skill root: ${relative(root, file)}`);
		}
	}
	for (const resource of ["scripts", "references", "assets"]) {
		const directory = join(root, resource);
		if (existsSync(directory) && readdirSync(directory).length === 0)
			errors.push(
				`add a runtime resource or remove the empty ${resource}/ directory`,
			);
	}
	for (const file of filesUnder(join(root, "scripts")))
		if ((lstatSync(file).mode & 0o111) === 0)
			errors.push(
				`make the deterministic script executable: ${relative(root, file)}`,
			);

	const markdownLinks = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
		.map((match) => match[1].split("#", 1)[0])
		.filter((path) => path && !/^[a-z][a-z0-9+.-]*:/i.test(path));
	for (const target of markdownLinks) {
		const resolved = resolve(root, target);
		if (!inside(root, resolved))
			errors.push(`link leaves the skill root: ${target}`);
		else if (!existsSync(resolved))
			errors.push(`linked file is missing: ${target}`);
		if (target.startsWith("references/") && target.split("/").length !== 2)
			errors.push(`keep references one level deep: ${target}`);
	}

	const referenceDirectory = join(root, "references");
	for (const file of filesUnder(referenceDirectory)) {
		const rel = relative(root, file).split(sep).join("/");
		if (basename(file) === "index.md")
			errors.push(
				"link focused references directly from SKILL.md instead of references/index.md",
			);
		if (!markdownLinks.includes(rel))
			errors.push(`reference isn't linked directly from SKILL.md: ${rel}`);
		if (
			/\[[^\]]*\]\((?:\.\.\/)?[^)]+\.md(?:#[^)]+)?\)/.test(
				readFileSync(file, "utf8"),
			)
		)
			errors.push(`reference-to-reference Markdown chain found: ${rel}`);
		if (
			readFileSync(file, "utf8").split(/\r?\n/).length > 300 &&
			!/^## Contents$/m.test(readFileSync(file, "utf8"))
		)
			errors.push(`reference over 300 lines needs a Contents section: ${rel}`);
	}

	const openai = join(root, "agents", "openai.yaml");
	if (!existsSync(openai))
		warnings.push("agents/openai.yaml is recommended for Codex discovery");
	else {
		try {
			const metadata = YAML.parse(readFileSync(openai, "utf8"));
			const ui = metadata?.interface;
			if (!ui?.display_name)
				errors.push("agents/openai.yaml needs interface.display_name");
			if (!ui?.short_description)
				errors.push("agents/openai.yaml needs interface.short_description");
			if (
				ui?.short_description &&
				(ui.short_description.length < 25 || ui.short_description.length > 64)
			)
				errors.push("interface.short_description needs 25-64 characters");
			if (ui?.default_prompt && !ui.default_prompt.includes(`$${name}`))
				errors.push(`interface.default_prompt needs to mention $${name}`);
		} catch (error) {
			errors.push(`agents/openai.yaml is invalid: ${error.message}`);
		}
	}

	const negations = (
		body.match(/\b(?:don't|don't|never|cannot|can't|must not|avoid)\b/gi) ?? []
	).length;
	const instructionLines = body
		.split(/\r?\n/)
		.filter((line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line)).length;
	if (
		negations > 3 &&
		negations > Math.max(1, Math.floor(instructionLines / 4))
	)
		warnings.push(
			`instructions contain ${negations} negative directives; prefer positive target-state wording where equivalent`,
		);

	return { root, errors, warnings };
}

const targets = process.argv.slice(2);
if (!targets.length) {
	process.stderr.write("Usage: check-skill.mjs <skill-directory> [...]\n");
	process.exit(2);
}
let failed = false;
for (const target of targets) {
	const result = validate(target);
	for (const warning of result.warnings)
		process.stderr.write(`[WARN] ${result.root}: ${warning}\n`);
	for (const error of result.errors)
		process.stderr.write(`[ERROR] ${result.root}: ${error}\n`);
	if (result.errors.length) failed = true;
	else process.stdout.write(`[OK] ${result.root}\n`);
}
process.exit(failed ? 1 : 0);
