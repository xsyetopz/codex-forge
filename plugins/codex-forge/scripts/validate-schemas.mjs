#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { YAML } from "bun";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCHEMAS = join(ROOT, "schemas");
const loadJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function typeMatches(value, type) {
	return (
		{
			object:
				value !== null && typeof value === "object" && !Array.isArray(value),
			array: Array.isArray(value),
			string: typeof value === "string",
			number: typeof value === "number" && Number.isFinite(value),
			integer: Number.isInteger(value),
			boolean: typeof value === "boolean",
			null: value === null,
		}[type] ?? true
	);
}

function resolveReference(root, reference) {
	if (!reference.startsWith("#/"))
		throw new Error(`unsupported schema reference: ${reference}`);
	return reference
		.slice(2)
		.split("/")
		.reduce(
			(value, key) => value[key.replaceAll("~1", "/").replaceAll("~0", "~")],
			root,
		);
}

function validateNode(value, schema, root, path = "$") {
	if (schema.$ref)
		return validateNode(value, resolveReference(root, schema.$ref), root, path);
	const errors = [];
	if (schema.const !== undefined && value !== schema.const)
		errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
	if (
		schema.enum &&
		!schema.enum.some((item) => JSON.stringify(item) === JSON.stringify(value))
	)
		errors.push(
			`${path}: must be one of ${schema.enum.map(JSON.stringify).join(", ")}`,
		);
	const types = Array.isArray(schema.type)
		? schema.type
		: schema.type
			? [schema.type]
			: [];
	if (types.length && !types.some((type) => typeMatches(value, type)))
		return [`${path}: must be ${types.join(" or ")}`];
	if (schema.anyOf) {
		const matches = schema.anyOf.filter(
			(branch) => validateNode(value, branch, root, path).length === 0,
		).length;
		if (!matches) errors.push(`${path}: must match at least one allowed shape`);
	}
	if (schema.oneOf) {
		const matches = schema.oneOf.filter(
			(branch) => validateNode(value, branch, root, path).length === 0,
		).length;
		if (matches !== 1)
			errors.push(`${path}: must match exactly one allowed shape`);
	}
	if (schema.not && validateNode(value, schema.not, root, path).length === 0)
		errors.push(`${path}: matches a forbidden shape`);
	if (typeof value === "string") {
		if (schema.minLength !== undefined && value.length < schema.minLength)
			errors.push(
				`${path}: must contain at least ${schema.minLength} characters`,
			);
		if (schema.pattern && !new RegExp(schema.pattern).test(value))
			errors.push(`${path}: must match ${schema.pattern}`);
		if (schema.format === "uri")
			try {
				new URL(value);
			} catch {
				errors.push(`${path}: must be a URI`);
			}
	}
	if (
		typeof value === "number" &&
		schema.minimum !== undefined &&
		value < schema.minimum
	)
		errors.push(`${path}: must be >= ${schema.minimum}`);
	if (Array.isArray(value)) {
		if (schema.minItems !== undefined && value.length < schema.minItems)
			errors.push(`${path}: must contain at least ${schema.minItems} items`);
		if (schema.maxItems !== undefined && value.length > schema.maxItems)
			errors.push(`${path}: must contain at most ${schema.maxItems} items`);
		if (
			schema.uniqueItems &&
			new Set(value.map((item) => JSON.stringify(item))).size !== value.length
		)
			errors.push(`${path}: items must be unique`);
		if (schema.items)
			value.forEach((item, index) => {
				errors.push(
					...validateNode(item, schema.items, root, `${path}.${index}`),
				);
			});
	}
	if (value !== null && typeof value === "object" && !Array.isArray(value)) {
		const properties = schema.properties ?? {};
		for (const key of schema.required ?? [])
			if (!(key in value))
				errors.push(`${path}: missing required property ${key}`);
		if (
			schema.minProperties !== undefined &&
			Object.keys(value).length < schema.minProperties
		)
			errors.push(
				`${path}: must contain at least ${schema.minProperties} properties`,
			);
		for (const [key, item] of Object.entries(value)) {
			if (properties[key])
				errors.push(
					...validateNode(item, properties[key], root, `${path}.${key}`),
				);
			else if (schema.additionalProperties === false)
				errors.push(`${path}.${key}: additional property is not allowed`);
			else if (
				schema.additionalProperties &&
				typeof schema.additionalProperties === "object"
			)
				errors.push(
					...validateNode(
						item,
						schema.additionalProperties,
						root,
						`${path}.${key}`,
					),
				);
		}
	}
	return errors;
}

function validate(instance, schemaName, label) {
	const schema = loadJson(join(SCHEMAS, schemaName));
	const errors = validateNode(instance, schema, schema);
	if (errors.length)
		throw new Error(
			`Schema validation failed:\n${errors.map((error) => `- ${label}:${error}`).join("\n")}`,
		);
}

export function main() {
	validate(
		loadJson(join(ROOT, "hooks", "hooks.json")),
		"hooks.json",
		"hooks/hooks.json",
	);
	validate(
		loadJson(join(ROOT, ".codex-plugin", "plugin.json")),
		"plugin.json",
		"plugin.json",
	);
	const metadataFiles = readdirSync(join(ROOT, "skills"), {
		withFileTypes: true,
	})
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(ROOT, "skills", entry.name, "agents", "openai.yaml"))
		.filter(existsSync)
		.sort();
	if (!metadataFiles.length)
		throw new Error("Schema validation failed: no skill metadata found");
	for (const path of metadataFiles)
		validate(
			YAML.parse(readFileSync(path, "utf8")),
			"skill.json",
			relative(ROOT, path),
		);
	console.log(
		`Schema validation passed: hooks, plugin manifest, ${metadataFiles.length} skills`,
	);
}

try {
	main();
} catch (error) {
	process.stderr.write(`${error.message}\n`);
	process.exit(1);
}
