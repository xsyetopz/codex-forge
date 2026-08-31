import { createHash, randomUUID } from "node:crypto";
import {
	chmodSync,
	closeSync,
	existsSync,
	fstatSync,
	linkSync,
	lstatSync,
	mkdtempSync,
	openSync,
	readdirSync,
	readFileSync,
	realpathSync,
	renameSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileSha } from "./files.mjs";
import { assertRegularFile, writeAtomic } from "./transaction.mjs";

const OPEN = "<!-- CODEX_FORGE_START -->";
const CLOSE = "<!-- CODEX_FORGE_END -->";
const HASH = /^[0-9a-f]{64}$/;
const RECOVERY =
	"Safe recovery: back up AGENTS.md and install-state.json, inspect the entire Forge-marked block, move any desired in-block edits outside the markers, then restore/remove only that block and retry";
const TRANSACTION_VERSION = 1;
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
	if (lines.some((line) => /^#\s*(?:>>>|<<<)\s*codex-forge\b/.test(line.value)))
		throw new Error(
			"global AGENTS.md contains legacy Forge marker-like content; refusing normal ownership parsing",
		);
	const comments = text.match(/<!--[\s\S]*?(?:-->|$)/g) ?? [];
	if (
		comments.some(
			(comment) =>
				comment.includes("CODEX_FORGE") &&
				(!["<!-- CODEX_FORGE_START -->", "<!-- CODEX_FORGE_END -->"].includes(
					comment,
				) ||
					!lines.some((line) => line.value === comment)),
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
			"bundled AGENTS patch does not contain exactly one Forge block",
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

function assertExclusive(stat) {
	if (stat.nlink !== 1)
		throw new Error(
			"global AGENTS.md has multiple hard links; refusing mutation because another user-owned path could be changed",
		);
}

function recordFor(stat, contents) {
	return {
		dev: stat.dev,
		ino: stat.ino,
		uid: stat.uid,
		sha256: hashText(contents),
		mode: stat.mode & 0o7777,
	};
}

export function validateGlobalAgentsState(home, item) {
	if (!item || typeof item !== "object" || Array.isArray(item))
		throw new Error(
			"installation state contains an invalid global AGENTS mapping",
		);
	if (
		item.target !== globalAgentsTarget(home) ||
		item.source !== "assets/AGENTS.md.patch"
	)
		throw new Error(
			`installation state contains global AGENTS metadata drift. Reinstall reconciles this only when $CODEX_HOME/AGENTS.md contains the exact recorded Forge block. ${RECOVERY}`,
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

// A moved CODEX_HOME or an older state writer can leave only the mapping
// location/source stale. Reconcile that metadata only when the current target
// still contains the exact recorded Forge block; an unrecorded/user-owned file
// therefore remains fail-closed.
export function reconcileGlobalAgentsState(home, item) {
	if (!item || typeof item !== "object" || Array.isArray(item)) return false;
	if (
		item.target === globalAgentsTarget(home) &&
		item.source === "assets/AGENTS.md.patch"
	)
		return false;
	for (const field of [
		"source_sha256",
		"owned_sha256",
		"unmanaged_sha256",
		"pre_block_sha256",
	])
		if (typeof item[field] !== "string" || !HASH.test(item[field]))
			return false;
	if (typeof item.previous_existed !== "boolean") return false;
	if (item.inserted_prefix !== "" && item.inserted_prefix !== "\n")
		return false;
	const target = globalAgentsTarget(home);
	try {
		assertRegularFile(target, "global AGENTS.md", home);
		if (!existsSync(target)) return false;
		const parsed = parseGlobalAgents(readFileSync(target, "utf8"));
		if (!parsed.present || parsed.owned_sha256 !== item.owned_sha256)
			return false;
	} catch {
		return false;
	}
	item.target = target;
	item.source = "assets/AGENTS.md.patch";
	return true;
}

export function validateGlobalAgentsTarget(home, item) {
	validateGlobalAgentsState(home, item);
	const target = globalAgentsTarget(home);
	assertRegularFile(target, "global AGENTS.md", home);
	if (!existsSync(target))
		throw new Error("global AGENTS.md is missing; refusing mutation");
	const stat = lstatSync(target);
	assertExclusive(stat);
	const descriptor = openSync(target, "r");
	try {
		const descriptorStat = fstatSync(descriptor);
		assertExclusive(descriptorStat);
		if (descriptorStat.dev !== stat.dev || descriptorStat.ino !== stat.ino)
			throw new Error(
				"global AGENTS.md pathname changed during ownership validation; refusing mutation",
			);
	} finally {
		closeSync(descriptor);
	}
	const contents = readFileSync(target, "utf8");
	const parsed = parseGlobalAgents(contents);
	if (!parsed.present || parsed.owned_sha256 !== item.owned_sha256)
		throw new Error(
			`global AGENTS.md Forge block hash conflict; refusing mutation. ${RECOVERY}`,
		);
	return { contents, parsed, stat, target };
}

function privatePath(target, suffix) {
	return join(
		mkdtempSync(join(dirname(target), `.codex-forge-${suffix}-`)),
		"file",
	);
}

function publishExclusive(temp, target) {
	linkSync(temp, target);
	rmSync(temp, { force: true });
}

function claimTarget(
	target,
	expected,
	operation,
	expectedGlobalAgents,
	transactionId,
	allowAbsent = false,
) {
	if (!["install", "uninstall"].includes(operation))
		throw new Error("global AGENTS transaction operation is required");
	if (expectedGlobalAgents === undefined)
		throw new Error("global AGENTS transaction expected ownership is required");
	if (typeof transactionId !== "string" || !transactionId)
		throw new Error("global AGENTS transaction ID is required");
	let targetStat;
	try {
		targetStat = lstatSync(target);
	} catch (error) {
		if (error?.code === "ENOENT" && allowAbsent) targetStat = null;
		else if (error?.code === "ENOENT") return null;
		else throw error;
	}
	if (
		process.env.NODE_ENV === "test" &&
		process.env.CODEX_FORGE_MUTATE_GLOBAL_AGENTS_BEFORE_CLAIM
	) {
		const mutation = process.env.CODEX_FORGE_MUTATE_GLOBAL_AGENTS_BEFORE_CLAIM;
		if (mutation === "rename") {
			renameSync(target, `${target}.original`);
			writeFileSync(target, "replacement user file\n");
		} else if (mutation === "symlink") {
			const replacement = `${target}.replacement`;
			writeFileSync(replacement, "replacement user file\n");
			renameSync(target, `${target}.original`);
			symlinkSync(replacement, target);
		} else writeFileSync(target, "user mutation before claim\n");
	}
	const transaction = mkdtempSync(
		join(dirname(target), ".codex-forge-agents-"),
	);
	const quarantine = join(transaction, "original");
	const phase = join(transaction, "phase");
	writeFileSync(
		join(transaction, "manifest"),
		`${JSON.stringify({
			version: TRANSACTION_VERSION,
			id: transactionId,
			operation,
			target,
			expected_global_agents: expectedGlobalAgents,
			original: expected ? recordFor(expected.stat, expected.contents) : null,
			result: { present: true },
			published: null,
		})}\n`,
		{ flag: "wx", mode: 0o600 },
	);
	writeFileSync(phase, "claimed\n", { flag: "wx", mode: 0o600 });
	if (!targetStat)
		return {
			quarantine: null,
			transaction,
			phase,
			manifest: join(transaction, "manifest"),
			contents: "",
			stat: null,
		};
	renameSync(target, quarantine);
	try {
		const stat = lstatSync(quarantine);
		if (
			!stat.isFile() ||
			stat.isSymbolicLink() ||
			stat.nlink !== 1 ||
			(targetStat &&
				(stat.dev !== targetStat.dev || stat.ino !== targetStat.ino))
		)
			throw new Error(
				"global AGENTS.md claim is not an exclusive regular file",
			);
		const contents = readFileSync(quarantine, "utf8");
		if (
			expected &&
			(stat.dev !== expected.stat.dev ||
				stat.ino !== expected.stat.ino ||
				contents !== expected.contents)
		)
			throw new Error("global AGENTS.md changed before path claim");
		return {
			quarantine,
			transaction,
			phase,
			manifest: join(transaction, "manifest"),
			contents: targetStat ? contents : "",
			stat: targetStat ? stat : null,
		};
	} catch (error) {
		if (!existsSync(target)) renameSync(quarantine, target);
		throw new Error(`${error.message}; quarantine: ${quarantine}`);
	}
}

export function recoverGlobalAgentsTransactions(home, state = null) {
	const parent = dirname(globalAgentsTarget(home));
	const target = globalAgentsTarget(home);
	for (const name of readdirSync(parent).filter((item) =>
		item.startsWith(".codex-forge-agents-"),
	)) {
		const transaction = join(parent, name);
		const original = join(transaction, "original");
		const rootStat = lstatSync(transaction);
		if (
			!rootStat.isDirectory() ||
			rootStat.isSymbolicLink() ||
			(rootStat.mode & 0o7777) !== 0o700 ||
			(typeof process.getuid === "function" &&
				rootStat.uid !== process.getuid()) ||
			realpathSync(transaction) !== join(realpathSync(parent), name)
		)
			throw new Error(
				`global AGENTS transaction provenance is unverified; target: ${target}; quarantine: ${original}`,
			);
		if (
			!["manifest,phase", "manifest,original,phase"].includes(
				readdirSync(transaction).sort().join(","),
			)
		)
			throw new Error(
				`global AGENTS transaction contains unsafe artifacts; target: ${target}; quarantine: ${original}`,
			);
		for (const artifact of ["manifest", "phase", "original"]) {
			const artifactPath = join(transaction, artifact);
			if (artifact === "original" && !existsSync(artifactPath)) continue;
			const artifactStat = lstatSync(artifactPath);
			if (
				!artifactStat.isFile() ||
				artifactStat.isSymbolicLink() ||
				artifactStat.nlink !== 1 ||
				(artifact !== "original" && (artifactStat.mode & 0o7777) !== 0o600) ||
				artifactStat.mode & 0o002 ||
				(typeof process.getuid === "function" &&
					artifactStat.uid !== process.getuid()) ||
				dirname(realpathSync(artifactPath)) !== realpathSync(transaction)
			)
				throw new Error(
					`global AGENTS transaction artifact provenance is unverified; target: ${target}; quarantine: ${original}`,
				);
		}
		let manifest;
		try {
			manifest = JSON.parse(
				readFileSync(join(transaction, "manifest"), "utf8"),
			);
		} catch {
			throw new Error(
				`global AGENTS transaction manifest is invalid; target: ${target}; quarantine: ${original}`,
			);
		}
		const phase = readFileSync(join(transaction, "phase"), "utf8").trim();
		const stat = existsSync(original) ? lstatSync(original) : null;
		const originalContents = stat ? readFileSync(original, "utf8") : "";
		if (
			manifest?.version !== TRANSACTION_VERSION ||
			typeof manifest.id !== "string" ||
			!manifest.id ||
			!["install", "uninstall"].includes(manifest.operation) ||
			manifest.target !== target ||
			Object.keys(manifest).sort().join(",") !==
				[
					"version",
					"id",
					"operation",
					"target",
					"expected_global_agents",
					"original",
					"result",
					"published",
				]
					.sort()
					.join(",") ||
			(manifest.original !== null && !manifest.original) ||
			!manifest.result ||
			typeof manifest.result.present !== "boolean" ||
			(manifest.published !== null && !manifest.published) ||
			(manifest.original &&
				(!Number.isInteger(manifest.original.dev) ||
					!Number.isInteger(manifest.original.ino))) ||
			(manifest.original &&
				manifest.original.uid !== undefined &&
				!Number.isInteger(manifest.original.uid)) ||
			(manifest.published !== null &&
				(!Number.isInteger(manifest.published.dev) ||
					!Number.isInteger(manifest.published.ino) ||
					!Number.isInteger(manifest.published.uid) ||
					!Number.isInteger(manifest.published.mode) ||
					!HASH.test(manifest.published.sha256))) ||
			(manifest.original &&
				manifest.original.sha256 !== hashText(originalContents)) ||
			(manifest.original &&
				(manifest.original.dev !== stat?.dev ||
					manifest.original.ino !== stat?.ino)) ||
			(manifest.original &&
				manifest.original.uid !== undefined &&
				manifest.original.uid !== stat?.uid) ||
			(manifest.original && manifest.original.mode !== (stat?.mode & 0o7777)) ||
			!["claimed", "published"].includes(phase)
		)
			throw new Error(
				`global AGENTS transaction manifest or phase is invalid; target: ${target}; quarantine: ${original}`,
			);
		if (!state) {
			const statePath = join(home, "forge", "install-state.json");
			assertRegularFile(statePath, "installation state", home);
			if (!existsSync(statePath))
				throw new Error(
					`global AGENTS transaction requires install-state oracle; target: ${target}; quarantine: ${original}`,
				);
			try {
				state = JSON.parse(readFileSync(statePath, "utf8"));
			} catch {
				throw new Error(
					`global AGENTS transaction install-state oracle is invalid; target: ${target}; quarantine: ${original}`,
				);
			}
		}
		const expected = manifest.expected_global_agents;
		try {
			validateGlobalAgentsState(home, expected);
		} catch {
			throw new Error(
				`global AGENTS transaction ownership is invalid; target: ${target}; quarantine: ${original}`,
			);
		}
		const pending = state.pending_global_agents_transaction;
		const receipt = state.global_agents_transaction_receipt;
		const anchor = pending ?? receipt;
		const anchored =
			anchor &&
			anchor.id === manifest.id &&
			anchor.operation === manifest.operation &&
			anchor.target === target &&
			JSON.stringify(anchor.expected_global_agents) ===
				JSON.stringify(expected);
		if (!anchored)
			throw new Error(
				`global AGENTS transaction is not anchored by install state; target: ${target}; quarantine: ${original}`,
			);
		const actual = state.global_agents;
		const committed =
			manifest.operation === "install"
				? Boolean(expected) &&
					JSON.stringify(actual) === JSON.stringify(expected)
				: !actual;
		if (committed) {
			if (manifest.result.present) {
				if (!manifest.published || !existsSync(target))
					throw new Error(
						`global AGENTS committed target is missing; target: ${target}; quarantine: ${original}`,
					);
				const published = lstatSync(target);
				if (
					published.nlink !== 1 ||
					(typeof process.getuid === "function" &&
						published.uid !== process.getuid()) ||
					published.dev !== manifest.published.dev ||
					published.ino !== manifest.published.ino ||
					published.uid !== manifest.published.uid ||
					(published.mode & 0o7777) !== manifest.published.mode ||
					hashText(readFileSync(target, "utf8")) !== manifest.published.sha256
				)
					throw new Error(
						`global AGENTS committed target does not match manifest; target: ${target}; quarantine: ${original}`,
					);
			} else if (existsSync(target))
				throw new Error(
					`global AGENTS committed target should be absent; target: ${target}; quarantine: ${original}`,
				);
			if (state.pending_global_agents_transaction) {
				delete state.pending_global_agents_transaction;
				writeAtomic(
					join(home, "forge", "install-state.json"),
					`${JSON.stringify(state, null, 2)}\n`,
				);
			}
			rmSync(transaction, { recursive: true, force: true });
			continue;
		}
		if (existsSync(target)) {
			if (!manifest.published)
				throw new Error(
					`global AGENTS transaction recovery is blocked; target: ${target}; quarantine: ${original}`,
				);
			const published = lstatSync(target);
			if (
				published.nlink !== 1 ||
				published.dev !== manifest.published.dev ||
				published.ino !== manifest.published.ino ||
				(published.mode & 0o7777) !== manifest.published.mode ||
				hashText(readFileSync(target, "utf8")) !== manifest.published.sha256
			)
				throw new Error(
					`global AGENTS transaction recovery target was replaced; target: ${target}; quarantine: ${original}`,
				);
			rmSync(target);
		}
		if (existsSync(original)) renameSync(original, target);
		delete state.pending_global_agents_transaction;
		writeAtomic(
			join(home, "forge", "install-state.json"),
			`${JSON.stringify(state, null, 2)}\n`,
		);
		rmSync(transaction, { recursive: true, force: true });
	}
}

function restoreClaim(claim, target) {
	if (!claim) return;
	if (existsSync(target))
		throw new Error(
			`global AGENTS.md recovery is unsafe because the pathname is occupied; quarantine: ${claim.quarantine}`,
		);
	renameSync(claim.quarantine, target);
}

export function installGlobalAgents(
	home,
	pluginRoot,
	priorState,
	{ force = false, onPending = null, clearPending = null } = {},
) {
	const sourcePath = join(pluginRoot, "assets", "AGENTS.md.patch");
	const target = globalAgentsTarget(home);
	recoverGlobalAgentsTransactions(home, priorState);
	assertRegularFile(target, "global AGENTS.md", home);
	const prior = priorState.global_agents;
	if (prior) validateGlobalAgentsState(home, prior);
	if (prior && !existsSync(target))
		throw new Error(
			"global AGENTS.md is missing; refusing to recreate a previously managed target",
		);
	const hadTarget = existsSync(target);
	const expected = hadTarget
		? { stat: lstatSync(target), contents: readFileSync(target, "utf8") }
		: null;
	if (expected) assertExclusive(expected.stat);
	const current = expected?.contents ?? "# AGENTS.md\n\n";
	const sourceText = readFileSync(sourcePath, "utf8");
	const updated = replaceGlobalAgentsSection(current, sourceText, prior, {
		force,
	});
	const updatedParsed = parseGlobalAgents(updated);
	const expectedMapping = {
		source: relative(pluginRoot, sourcePath),
		target,
		source_sha256: fileSha(sourcePath),
		owned_sha256: updatedParsed.owned_sha256,
		unmanaged_sha256: hashText(`${updatedParsed.before}${updatedParsed.after}`),
		pre_block_sha256: prior?.pre_block_sha256 ?? hashText(current),
		inserted_prefix:
			prior?.inserted_prefix ?? (current.endsWith("\n") ? "" : "\n"),
		previous_existed: prior?.previous_existed ?? hadTarget,
	};
	const transactionId = randomUUID();
	const pending = {
		id: transactionId,
		operation: "install",
		target,
		expected_global_agents: expectedMapping,
	};
	if (onPending) onPending(pending);
	const claim = claimTarget(
		target,
		expected,
		"install",
		expectedMapping,
		transactionId,
		true,
	);
	try {
		const temp = claim
			? join(claim.transaction, "replacement")
			: privatePath(target, "codex-forge-temp");
		writeFileSync(temp, updated, { flag: "wx" });
		if (claim?.stat) chmodSync(temp, claim.stat.mode & 0o7777);
		try {
			publishExclusive(temp, target);
		} catch (error) {
			rmSync(temp, { force: true });
			throw error;
		}
		if (claim) {
			claim.published = { stat: lstatSync(target), contents: updated };
			writeFileSync(
				claim.manifest,
				`${JSON.stringify({
					version: TRANSACTION_VERSION,
					id: transactionId,
					operation: "install",
					target,
					expected_global_agents: expectedMapping,
					original: claim.stat ? recordFor(claim.stat, claim.contents) : null,
					result: { present: true },
					published: recordFor(claim.published.stat, updated),
				})}\n`,
			);
			writeFileSync(claim.phase, "published\n");
		}
		return {
			mapping: expectedMapping,
			transaction: claim && {
				receipt: pending,
				commit: () =>
					rmSync(claim.transaction, { recursive: true, force: true }),
				rollback: () => {
					if (claim.published && existsSync(target)) {
						const stat = lstatSync(target);
						if (
							stat.nlink !== 1 ||
							stat.dev !== claim.published.stat.dev ||
							stat.ino !== claim.published.stat.ino ||
							hashText(readFileSync(target, "utf8")) !==
								hashText(claim.published.contents)
						)
							throw new Error(
								`global AGENTS rollback target was replaced; target: ${target}; quarantine: ${claim.quarantine}`,
							);
						rmSync(target);
					}
					if (claim.quarantine) restoreClaim(claim, target);
					rmSync(claim.transaction, { recursive: true, force: true });
					if (clearPending) clearPending();
				},
			},
		};
	} catch (error) {
		try {
			if (claim?.quarantine) restoreClaim(claim, target);
			else if (claim)
				rmSync(claim.transaction, { recursive: true, force: true });
		} catch (restoreError) {
			throw new Error(`${error.message}; ${restoreError.message}`);
		}
		throw error;
	}
}

export function uninstallGlobalAgents(home, state, _options = {}) {
	recoverGlobalAgentsTransactions(home, state);
	const item = state.global_agents;
	if (!item) return;
	const validated = validateGlobalAgentsTarget(home, item);
	const { target } = validated;
	const transactionId = randomUUID();
	const pending = {
		id: transactionId,
		operation: "uninstall",
		target,
		expected_global_agents: item,
	};
	if (_options.onPending) _options.onPending(pending);
	const claim = claimTarget(
		target,
		validated,
		"uninstall",
		item,
		transactionId,
	);
	const parsed = parseGlobalAgents(claim.contents);
	if (parsed.owned_sha256 !== item.owned_sha256) {
		restoreClaim(claim, target);
		throw new Error("global AGENTS.md changed during claim; refusing mutation");
	}
	const unmanaged = `${parsed.before}${parsed.after}`;
	const candidateBefore =
		item.inserted_prefix && parsed.before.endsWith(item.inserted_prefix)
			? parsed.before.slice(0, -item.inserted_prefix.length)
			: parsed.before;
	const prefixProven = hashText(candidateBefore) === item.pre_block_sha256;
	const restored = prefixProven
		? `${candidateBefore}${parsed.after}`
		: unmanaged;
	const removeTarget =
		!item.previous_existed &&
		(!restored.trim() ||
			restored === "# AGENTS.md\n" ||
			restored === "# AGENTS.md\n\n");
	try {
		if (!removeTarget) {
			const temp = join(claim.transaction, "replacement");
			writeFileSync(temp, restored, { flag: "wx" });
			chmodSync(temp, claim.stat.mode & 0o7777);
			try {
				if (existsSync(target))
					throw new Error("global AGENTS.md pathname occupied during publish");
				publishExclusive(temp, target);
				claim.published = {
					stat: lstatSync(target),
					contents: restored,
				};
				writeFileSync(
					claim.manifest,
					`${JSON.stringify({
						version: TRANSACTION_VERSION,
						id: transactionId,
						operation: "uninstall",
						target,
						expected_global_agents: item,
						original: recordFor(claim.stat, claim.contents),
						result: { present: true },
						published: recordFor(claim.published.stat, restored),
					})}\n`,
				);
				writeFileSync(claim.phase, "published\n");
			} catch (error) {
				rmSync(temp, { force: true });
				throw error;
			}
		}
		if (removeTarget) writeFileSync(claim.phase, "published\n");
		if (removeTarget)
			writeFileSync(
				claim.manifest,
				`${JSON.stringify({
					version: TRANSACTION_VERSION,
					id: transactionId,
					operation: "uninstall",
					target,
					expected_global_agents: item,
					original: recordFor(claim.stat, claim.contents),
					result: { present: false },
					published: null,
				})}\n`,
			);
		const transaction = {
			receipt: pending,
			commit: () => rmSync(claim.transaction, { recursive: true, force: true }),
			rollback: () => {
				if (existsSync(target)) {
					const published = lstatSync(target);
					if (
						!claim.published ||
						published.nlink !== 1 ||
						published.dev !== claim.published.stat.dev ||
						published.ino !== claim.published.stat.ino ||
						readFileSync(target, "utf8") !== claim.published.contents ||
						(published.mode & 0o7777) !== (claim.published.stat.mode & 0o7777)
					)
						throw new Error(
							`global AGENTS rollback target was replaced; target: ${target}; quarantine: ${claim.quarantine}`,
						);
					rmSync(target, { force: true });
				}
				renameSync(claim.quarantine, target);
				rmSync(claim.transaction, { recursive: true, force: true });
				if (_options.clearPending) _options.clearPending();
			},
		};
		if (_options.deferCommit) return transaction;
		transaction.commit();
	} finally {
		if (
			existsSync(claim.quarantine) &&
			!existsSync(target) &&
			!_options.deferCommit
		)
			restoreClaim(claim, target);
	}
}

export function revertGlobalAgents(home, pluginRoot, state) {
	const item = state.global_agents;
	if (!item) return false;
	validateGlobalAgentsTarget(home, item);
	const target = globalAgentsTarget(home);
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
