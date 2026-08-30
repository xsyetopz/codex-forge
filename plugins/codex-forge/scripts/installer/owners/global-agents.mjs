import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileSha } from "./files.mjs";

const OPEN = "# >>> codex-forge:AGENTS.md >>>";
const CLOSE = "# <<< codex-forge:AGENTS.md <<<";
const TOKEN = "codex-forge:AGENTS.md";
const HASH = /^[0-9a-f]{64}$/;
const hashText = (text) => createHash("sha256").update(text).digest("hex");
export const globalAgentsTarget = (home) => join(home, "AGENTS.md");

export function parseGlobalAgents(text) {
	const lines = [];
	let offset = 0;
	for (const value of text.match(/.*(?:\n|$)/g)?.filter(Boolean) ?? []) {
		lines.push({
			value: value.replace(/\n$/, ""),
			start: offset,
			end: offset + value.length,
		});
		offset += value.length;
	}
	const opens = lines.filter((line) => line.value === OPEN);
	const closes = lines.filter((line) => line.value === CLOSE);
	if (
		lines.some(
			(line) =>
				line.value.includes(TOKEN) &&
				line.value !== OPEN &&
				line.value !== CLOSE,
		)
	)
		throw new Error(
			"global AGENTS.md contains malformed Forge marker-like content; refusing to claim or overwrite it",
		);
	if (!opens.length && !closes.length) return { present: false };
	if (
		opens.length !== 1 ||
		closes.length !== 1 ||
		opens[0].start >= closes[0].start
	)
		throw new Error(
			"global AGENTS.md must contain exactly one well-formed Forge block; found duplicate or unmatched markers",
		);
	const start = opens[0].start;
	const end = closes[0].end;
	const owned = text.slice(start, end);
	return {
		present: true,
		before: text.slice(0, start),
		after: text.slice(end),
		owned,
		owned_sha256: hashText(owned),
	};
}

function sourceBlock(text) {
	const parsed = parseGlobalAgents(text);
	if (!parsed.present || parsed.before || parsed.after)
		throw new Error(
			"bundled global AGENTS source does not contain exactly one Forge block",
		);
	return parsed.owned;
}

export function replaceGlobalAgentsSection(
	text,
	sourceText,
	state = null,
	{ force = false } = {},
) {
	const source = sourceBlock(sourceText);
	const parsed = parseGlobalAgents(text);
	if (parsed.present && !state)
		throw new Error(
			"global AGENTS.md already contains Forge markers without recorded ownership; refusing to claim or overwrite it",
		);
	if (!parsed.present) {
		if (state)
			throw new Error(
				"global AGENTS.md is missing its recorded Forge block; refusing to recreate or overwrite it",
			);
		return `${text}${text && !text.endsWith("\n") ? "\n" : ""}${source}`;
	}
	if (state && parsed.owned_sha256 !== state.owned_sha256 && !force)
		throw new Error(
			"global AGENTS.md Forge block changed since install; use --replace only after reviewing the owned block",
		);
	return `${parsed.before}${source}${parsed.after}`;
}

export function removeGlobalAgentsSection(text) {
	const parsed = parseGlobalAgents(text);
	return parsed.present ? `${parsed.before}${parsed.after}` : text;
}

function assertHash(value, field) {
	if (typeof value !== "string" || !HASH.test(value))
		throw new Error(
			`installation state contains an invalid global AGENTS ${field}`,
		);
}

export function validateGlobalAgentsState(home, item) {
	if (!item || typeof item !== "object" || Array.isArray(item))
		throw new Error(
			"installation state contains an invalid global AGENTS mapping",
		);
	if (
		item.target !== globalAgentsTarget(home) ||
		item.source !== "assets/global-AGENTS.md"
	)
		throw new Error(
			"installation state contains an unmanaged global AGENTS mapping",
		);
	for (const field of ["source_sha256", "owned_sha256", "unmanaged_sha256"])
		assertHash(item[field], field);
	assertHash(item.pre_block_sha256, "pre_block_sha256");
	if (typeof item.previous_existed !== "boolean")
		throw new Error(
			"installation state contains an invalid global AGENTS previous_existed field",
		);
	if (item.inserted_prefix !== "" && item.inserted_prefix !== "\n")
		throw new Error(
			"installation state contains an invalid global AGENTS inserted_prefix field",
		);
}

export function validateGlobalAgentsTarget(home, item) {
	validateGlobalAgentsState(home, item);
	const target = globalAgentsTarget(home);
	if (!existsSync(target))
		throw new Error("global AGENTS.md is missing; refusing mutation");
	const parsed = parseGlobalAgents(readFileSync(target, "utf8"));
	if (!parsed.present || parsed.owned_sha256 !== item.owned_sha256)
		throw new Error(
			"global AGENTS.md Forge block ownership is unverified; refusing mutation",
		);
}

export function installGlobalAgents(
	home,
	pluginRoot,
	priorState,
	{ force = false } = {},
) {
	const sourcePath = join(pluginRoot, "assets", "global-AGENTS.md");
	const target = globalAgentsTarget(home);
	const prior = priorState.global_agents;
	if (prior) validateGlobalAgentsState(home, prior);
	if (prior && !existsSync(target))
		throw new Error(
			"global AGENTS.md is missing; refusing to recreate a previously managed target",
		);
	const hadTarget = existsSync(target);
	const current = hadTarget ? readFileSync(target, "utf8") : "# AGENTS.md\n";
	const updated = replaceGlobalAgentsSection(
		current,
		readFileSync(sourcePath, "utf8"),
		prior,
		{ force },
	);
	writeFileSync(target, updated);
	const parsed = parseGlobalAgents(updated);
	return {
		source: relative(pluginRoot, sourcePath),
		target,
		source_sha256: fileSha(sourcePath),
		owned_sha256: parsed.owned_sha256,
		unmanaged_sha256: hashText(`${parsed.before}${parsed.after}`),
		pre_block_sha256: prior?.pre_block_sha256 ?? hashText(current),
		inserted_prefix:
			prior?.inserted_prefix ?? (current.endsWith("\n") ? "" : "\n"),
		previous_existed: prior?.previous_existed ?? hadTarget,
	};
}

export function uninstallGlobalAgents(home, state, _options = {}) {
	const item = state.global_agents;
	if (!item) return;
	validateGlobalAgentsTarget(home, item);
	const target = globalAgentsTarget(home);
	if (!existsSync(target)) return;
	const parsed = parseGlobalAgents(readFileSync(target, "utf8"));
	const unmanaged = `${parsed.before}${parsed.after}`;
	const candidateBefore =
		item.inserted_prefix && parsed.before.endsWith(item.inserted_prefix)
			? parsed.before.slice(0, -item.inserted_prefix.length)
			: parsed.before;
	const prefixProven = hashText(candidateBefore) === item.pre_block_sha256;
	const restored = prefixProven
		? `${candidateBefore}${parsed.after}`
		: unmanaged;
	if (
		!item.previous_existed &&
		(!restored.trim() || restored === "# AGENTS.md\n")
	)
		rmSync(target, { force: true });
	else writeFileSync(target, restored);
}

export function revertGlobalAgents(home, pluginRoot, state) {
	const item = state.global_agents;
	if (!item) return false;
	validateGlobalAgentsTarget(home, item);
	const target = globalAgentsTarget(home);
	if (!existsSync(target))
		throw new Error(
			"global AGENTS.md is missing; refusing to recreate or authorize revert mutation",
		);
	const parsed = parseGlobalAgents(readFileSync(target, "utf8"));
	if (!parsed.present || parsed.owned_sha256 !== item.owned_sha256)
		throw new Error(
			"global AGENTS.md Forge block ownership is unverified; refusing revert mutation",
		);
	const source = join(pluginRoot, item.source);
	const updated = `${parsed.before}${sourceBlock(readFileSync(source, "utf8"))}${parsed.after}`;
	writeFileSync(target, updated);
	item.source_sha256 = fileSha(source);
	item.owned_sha256 = parseGlobalAgents(updated).owned_sha256;
	return true;
}
