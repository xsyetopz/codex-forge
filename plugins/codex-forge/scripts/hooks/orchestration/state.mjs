#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import {
	appendFile,
	chmod,
	lstat,
	mkdir,
	open,
	readdir,
	readFile,
	rename,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const PHASES = Object.freeze([
	"awaiting_worker",
	"worker_running",
	"awaiting_reviewer",
	"reviewer_running",
	"repair_worker",
	"awaiting_recheck",
	"repair_required",
	"reviewed",
	"passed",
	"blocked",
]);

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOCK_TTL_MS = 30 * 1000;
const DEFAULT_LOCK_WAIT_MS = 2 * 1000;
const INTEGRITY_STATES = new Set([
	"ok",
	"duplicate_worker",
	"duplicate_reviewer",
	"reviewer_before_worker",
	"worker_identity_mismatch",
	"reviewer_identity_mismatch",
	"worker_out_of_order",
	"reviewer_out_of_order",
]);
const IDENTITY_STATUSES = new Set([
	"spawning",
	"running",
	"stopped",
	"repair_running",
	"repair_stopped",
	"recheck_running",
]);

export function runtimeDirectory() {
	return process.env.CODEX_FORGE_RUNTIME_DIR || join(tmpdir(), "codex-forge");
}

export function sessionKey(sessionId) {
	return createHash("sha256").update(String(sessionId)).digest("hex");
}

export function sessionPaths(sessionId) {
	const key = sessionKey(sessionId);
	const file = join(runtimeDirectory(), `${key}.json`);
	return { key, file, lock: `${file}.lock`, audit: `${file}.audit.jsonl` };
}

function integerEnv(name, fallback) {
	const parsed = Number.parseInt(process.env[name] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function emptyState() {
	return {
		version: 1,
		phase: "awaiting_worker",
		activated: true,
		reviewed: false,
		review_result: null,
		worker: null,
		reviewer: null,
		integrity: "ok",
		paused: false,
		// Stop emits one terminal recovery instruction for a blocked session.
		// Persisting this edge prevents the Stop hook from re-entering the same
		// blocked response when the host retries the event.
		stop_notice_emitted: false,
		activated_at: Date.now(),
		updated_at: Date.now(),
	};
}

function validIdentity(value) {
	return (
		value === null ||
		(typeof value === "object" &&
			!Array.isArray(value) &&
			(value.id === null ||
				(typeof value.id === "string" && value.id.trim().length > 0)) &&
			(value.status === undefined || IDENTITY_STATUSES.has(value.status)) &&
			(value.spawn_tool_use_id === undefined ||
				typeof value.spawn_tool_use_id === "string"))
	);
}

function hasIdentity(value, role) {
	return (
		value &&
		typeof value.id === "string" &&
		value.id.trim() &&
		value.role === role
	);
}

export function validState(value) {
	return Boolean(
		value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			value.version === 1 &&
			PHASES.includes(value.phase) &&
			value.activated === true &&
			typeof value.reviewed === "boolean" &&
			(value.review_result === null ||
				value.review_result === "pass" ||
				value.review_result === "fail") &&
			validIdentity(value.worker) &&
			validIdentity(value.reviewer) &&
			(value.worker === null || value.worker.role === "forge-worker") &&
			(value.reviewer === null || value.reviewer.role === "forge-reviewer") &&
			INTEGRITY_STATES.has(value.integrity ?? "ok") &&
			(value.paused === undefined || typeof value.paused === "boolean") &&
			(value.stop_notice_emitted === undefined ||
				typeof value.stop_notice_emitted === "boolean") &&
			typeof value.activated_at === "number" &&
			typeof value.updated_at === "number" &&
			(!["reviewed", "passed"].includes(value.phase) ||
				(value.integrity === "ok" &&
					value.reviewed === true &&
					value.review_result === "pass" &&
					hasIdentity(value.worker, "forge-worker") &&
					hasIdentity(value.reviewer, "forge-reviewer"))) &&
			(value.reviewed !== true || ["reviewed", "passed"].includes(value.phase)),
	);
}

async function ensureDirectory() {
	const directory = runtimeDirectory();
	await mkdir(directory, { recursive: true, mode: 0o700 });
	const info = await lstat(directory);
	if (!info.isDirectory() || info.isSymbolicLink())
		throw new Error("Forge orchestration runtime path is not a directory");
	if (typeof process.getuid === "function" && info.uid !== process.getuid())
		throw new Error(
			"Forge orchestration runtime directory has a different owner",
		);
	if ((info.mode & 0o077) !== 0)
		throw new Error(
			"Forge orchestration runtime directory permissions are too broad",
		);
	if ((info.mode & 0o700) !== 0o700) await chmod(directory, 0o700);
	return directory;
}

async function acquireLock(lockPath) {
	const waitMs = integerEnv("CODEX_FORGE_LOCK_WAIT_MS", DEFAULT_LOCK_WAIT_MS);
	const lockTtl = integerEnv("CODEX_FORGE_LOCK_TTL_MS", DEFAULT_LOCK_TTL_MS);
	const started = Date.now();
	for (;;) {
		try {
			await mkdir(lockPath, { mode: 0o700 });
			await chmod(lockPath, 0o700);
			const token = randomBytes(16).toString("hex");
			const owner = join(lockPath, "owner");
			try {
				await writeFile(owner, token, {
					encoding: "utf8",
					mode: 0o600,
					flag: "wx",
				});
			} catch (error) {
				await rm(lockPath, { recursive: true, force: true });
				throw error;
			}
			return async () => {
				try {
					if ((await readFile(owner, "utf8")) === token)
						await rm(lockPath, { recursive: true, force: true });
				} catch {}
			};
		} catch (error) {
			if (error?.code !== "EEXIST") throw error;
			try {
				const info = await stat(lockPath);
				if (Date.now() - info.mtimeMs > lockTtl)
					await rm(lockPath, { recursive: true, force: true });
			} catch (statError) {
				if (statError?.code !== "ENOENT") throw statError;
			}
			if (Date.now() - started >= waitMs) {
				const busy = new Error("Forge orchestration state lock is busy");
				busy.code = "ELOCKED";
				throw busy;
			}
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}
}

async function readUnlocked(file) {
	try {
		const info = await lstat(file);
		if (
			!info.isFile() ||
			info.isSymbolicLink() ||
			(info.mode & 0o077) !== 0 ||
			(typeof process.getuid === "function" && info.uid !== process.getuid())
		)
			return { state: null, corrupt: true };
		const raw = await readFile(file, "utf8");
		const value = JSON.parse(raw);
		return validState(value)
			? { state: value, corrupt: false }
			: { state: null, corrupt: true };
	} catch (error) {
		if (error?.code === "ENOENT") return { state: null, corrupt: false };
		return { state: null, corrupt: true };
	}
}

async function writeAtomic(file, state) {
	const temporary = `${file}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
	await writeFile(temporary, `${JSON.stringify(state)}\n`, {
		encoding: "utf8",
		mode: 0o600,
		flag: "wx",
	});
	await chmod(temporary, 0o600);
	try {
		const descriptor = await open(temporary, "r");
		try {
			await descriptor.sync();
		} finally {
			await descriptor.close();
		}
		await rename(temporary, file);
	} catch (error) {
		await rm(temporary, { force: true });
		throw error;
	}
}

/**
 * Run one serialized transition for a hashed session state file.
 * The callback returns { state, value, write }; write=false leaves the file unchanged.
 */
export async function transitionSession(sessionId, callback) {
	if (typeof sessionId !== "string" || !sessionId.trim())
		return { ok: false, reason: "missing session id" };
	const paths = sessionPaths(sessionId);
	let release;
	try {
		await ensureDirectory();
		release = await acquireLock(paths.lock);
		const loaded = await readUnlocked(paths.file);
		if (loaded.corrupt) return { ok: false, corrupt: true, paths };
		const current = loaded.state;
		const result = await callback(current ? structuredClone(current) : null);
		if (result?.write !== false) {
			const next = result?.state ?? current;
			if (next && !validState(next)) {
				const error = new Error("invalid Forge orchestration state transition");
				error.code = "ESTATE";
				throw error;
			}
			if (next) {
				next.updated_at = Date.now();
				await writeAtomic(paths.file, next);
			}
		}
		return {
			ok: true,
			state: result?.state ?? current,
			value: result?.value,
			paths,
		};
	} catch (error) {
		return { ok: false, error, paths };
	} finally {
		if (release) await release();
	}
}

export async function removeSession(sessionId) {
	if (typeof sessionId !== "string" || !sessionId.trim()) return false;
	const paths = sessionPaths(sessionId);
	let release;
	try {
		await ensureDirectory();
		release = await acquireLock(paths.lock);
		await rm(paths.file, { force: true });
		await rm(paths.audit, { force: true });
		return true;
	} catch {
		return false;
	} finally {
		if (release) await release();
	}
}

/**
 * Record non-blocking orchestration observations separately from the lifecycle
 * state. Audit failures never change the caller's policy decision.
 */
export async function appendSessionAudit(sessionId, event) {
	if (typeof sessionId !== "string" || !sessionId.trim()) return false;
	const paths = sessionPaths(sessionId);
	let release;
	try {
		await ensureDirectory();
		release = await acquireLock(paths.lock);
		try {
			const info = await lstat(paths.audit);
			if (
				!info.isFile() ||
				info.isSymbolicLink() ||
				(info.mode & 0o077) !== 0 ||
				(typeof process.getuid === "function" && info.uid !== process.getuid())
			)
				return false;
		} catch (error) {
			if (error?.code !== "ENOENT") return false;
		}
		await appendFile(paths.audit, `${JSON.stringify(event)}\n`, {
			encoding: "utf8",
			mode: 0o600,
			flag: "a",
		});
		await chmod(paths.audit, 0o600);
		return true;
	} catch {
		return false;
	} finally {
		if (release) await release();
	}
}

export async function cleanupExpiredStates(
	now = Date.now(),
	preserveSessionId = null,
) {
	let directory;
	try {
		directory = await ensureDirectory();
	} catch {
		return { removed: 0, directory: runtimeDirectory() };
	}
	const ttl = integerEnv("CODEX_FORGE_STATE_TTL_MS", DEFAULT_TTL_MS);
	const preservedKey =
		typeof preserveSessionId === "string" && preserveSessionId.trim()
			? sessionKey(preserveSessionId)
			: null;
	let removed = 0;
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch {
		return { removed, directory };
	}
	for (const entry of entries) {
		if (!entry.isFile() || !/^[a-f0-9]{64}\.json$/.test(entry.name)) continue;
		if (preservedKey && entry.name === `${preservedKey}.json`) continue;
		const file = join(directory, entry.name);
		let release;
		try {
			release = await acquireLock(`${file}.lock`);
			const info = await stat(file);
			if (now - info.mtimeMs > ttl) {
				await rm(file, { force: true });
				await rm(`${file}.audit.jsonl`, { force: true });
				removed += 1;
			}
		} catch {
		} finally {
			if (release) await release();
		}
	}
	for (const entry of entries) {
		if (!entry.isDirectory() || !entry.name.endsWith(".json.lock")) continue;
		if (preservedKey && entry.name === `${preservedKey}.json.lock`) continue;
		const lock = join(directory, entry.name);
		try {
			const info = await stat(lock);
			if (
				now - info.mtimeMs >
				integerEnv("CODEX_FORGE_LOCK_TTL_MS", DEFAULT_LOCK_TTL_MS)
			)
				await rm(lock, { recursive: true, force: true });
		} catch {}
	}
	return { removed, directory };
}

export function newState() {
	return emptyState();
}
