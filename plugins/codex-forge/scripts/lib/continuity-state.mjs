import { createHash, randomBytes } from "node:crypto";
import {
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

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOCK_TTL_MS = 30 * 1000;
const DEFAULT_LOCK_WAIT_MS = 2 * 1000;
const MAX_HANDOFF_CHARS = 1800;
const MAX_AGENTS = 16;
const MAX_SPAWN_ADMISSIONS = 6;
const MAX_ROUTINE_REVIEWS = 1;
const MAX_TAIL_REVIEWS = 1;
const AGENT_STATUSES = new Set(["running", "stopped"]);

export function boundedHandoff(value, limit = MAX_HANDOFF_CHARS) {
	if (typeof value !== "string") return null;
	const text = value.trim();
	if (!text) return null;
	return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function runtimeDirectory() {
	return (
		process.env.CODEX_FORGE_RUNTIME_DIR || join(tmpdir(), "codex-forge-v3")
	);
}

export function sessionKey(sessionId) {
	return createHash("sha256").update(String(sessionId)).digest("hex");
}

export function sessionPaths(sessionId) {
	const key = sessionKey(sessionId);
	const file = join(runtimeDirectory(), `${key}.json`);
	return {
		key,
		file,
		lock: `${file}.lock`,
	};
}

function integerEnv(name, fallback) {
	const parsed = Number.parseInt(process.env[name] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function emptyState() {
	const now = Date.now();
	return {
		version: 4,
		agents: [],
		spawn_admissions: [],
		created_at: now,
		updated_at: now,
	};
}

function validSpawnAdmission(value) {
	return Boolean(
		value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			typeof value.tool_use_id === "string" &&
			value.tool_use_id.trim() &&
			typeof value.role === "string" &&
			value.role.startsWith("forge-") &&
			typeof value.admitted_at === "number",
	);
}

function validAgent(value) {
	return Boolean(
		value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			typeof value.id === "string" &&
			value.id.trim() &&
			typeof value.role === "string" &&
			value.role.startsWith("forge-") &&
			AGENT_STATUSES.has(value.status) &&
			(value.handoff === undefined ||
				(typeof value.handoff === "string" &&
					value.handoff.length <= MAX_HANDOFF_CHARS)) &&
			typeof value.started_at === "number" &&
			typeof value.updated_at === "number",
	);
}

export function validState(value) {
	return Boolean(
		value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			value.version === 4 &&
			Array.isArray(value.agents) &&
			value.agents.length <= MAX_AGENTS &&
			value.agents.every(validAgent) &&
			Array.isArray(value.spawn_admissions) &&
			value.spawn_admissions.length <= MAX_SPAWN_ADMISSIONS &&
			value.spawn_admissions.every(validSpawnAdmission) &&
			typeof value.created_at === "number" &&
			typeof value.updated_at === "number",
	);
}

function upgradeState(value) {
	if (validState(value)) return value;
	if (
		!value ||
		typeof value !== "object" ||
		Array.isArray(value) ||
		value.version !== 3 ||
		!Array.isArray(value.agents) ||
		value.agents.length > MAX_AGENTS ||
		!value.agents.every(validAgent) ||
		typeof value.created_at !== "number" ||
		typeof value.updated_at !== "number"
	)
		return null;
	return {
		...value,
		version: 4,
		spawn_admissions: value.agents
			.slice(0, MAX_SPAWN_ADMISSIONS)
			.map((agent) => ({
				tool_use_id: `legacy:${agent.id}`,
				role: agent.role,
				admitted_at: agent.started_at,
			})),
	};
}

async function ensureDirectory() {
	const directory = runtimeDirectory();
	await mkdir(directory, { recursive: true, mode: 0o700 });
	const info = await lstat(directory);
	if (!info.isDirectory() || info.isSymbolicLink())
		throw new Error("Forge handoff runtime path is not a directory");
	if (typeof process.getuid === "function" && info.uid !== process.getuid())
		throw new Error("Forge handoff runtime directory has a different owner");
	if ((info.mode & 0o077) !== 0)
		throw new Error(
			"Forge handoff runtime directory permissions are too broad",
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
				const busy = new Error("Forge handoff state lock is busy");
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
		const parsed = JSON.parse(await readFile(file, "utf8"));
		const value = upgradeState(parsed);
		return value
			? {
					state: value,
					corrupt: false,
					migrated: parsed.version !== value.version,
				}
			: { state: null, corrupt: true };
	} catch (error) {
		if (error?.code === "ENOENT")
			return { state: null, corrupt: false, migrated: false };
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
		if (result?.write !== false || loaded.migrated) {
			const next = result?.state ?? current;
			if (next && !validState(next)) {
				const error = new Error("invalid Forge handoff state transition");
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

export async function readSession(sessionId) {
	const result = await transitionSession(sessionId, (current) => ({
		state: current,
		write: false,
	}));
	return result.ok ? result.state : null;
}

export async function recordSpawnAdmission(sessionId, { toolUseId, role }) {
	if (!toolUseId || !role?.startsWith("forge-"))
		return { ok: false, allowed: false, reason: "invalid spawn admission" };
	const result = await transitionSession(sessionId, (current) => {
		const state = current ?? emptyState();
		const existing = state.spawn_admissions.find(
			(admission) => admission.tool_use_id === toolUseId,
		);
		if (existing)
			return {
				state,
				write: false,
				value: { allowed: true, duplicate: true },
			};
		if (state.spawn_admissions.length >= MAX_SPAWN_ADMISSIONS)
			return {
				state,
				write: false,
				value: {
					allowed: false,
					reason: `Forge child admission budget reached (${MAX_SPAWN_ADMISSIONS} per thread). Complete the milestone in the root or start the next milestone in a fresh thread.`,
				},
			};
		const routineReviews = state.spawn_admissions.filter(
			(admission) => admission.role === "forge-reviewer",
		).length;
		if (role === "forge-reviewer" && routineReviews >= MAX_ROUTINE_REVIEWS)
			return {
				state,
				write: false,
				value: {
					allowed: false,
					reason:
						"Forge permits one routine reviewer per thread. Integrate the existing findings and validate in the root.",
				},
			};
		const tailReviews = state.spawn_admissions.filter(
			(admission) => admission.role === "forge-tail-reviewer",
		).length;
		if (role === "forge-tail-reviewer" && tailReviews >= MAX_TAIL_REVIEWS)
			return {
				state,
				write: false,
				value: {
					allowed: false,
					reason:
						"Forge permits one hard-tail reviewer per thread. Decide the remaining question in the root.",
				},
			};
		state.spawn_admissions.push({
			tool_use_id: toolUseId,
			role,
			admitted_at: Date.now(),
		});
		return { state, value: { allowed: true, duplicate: false } };
	});
	return result.ok
		? { ok: true, ...result.value }
		: {
				ok: false,
				allowed: false,
				reason: "spawn admission state unavailable",
			};
}

export async function recordAgentStart(sessionId, { id, role }) {
	if (!id || !role?.startsWith("forge-")) return false;
	const result = await transitionSession(sessionId, (current) => {
		const state = current ?? emptyState();
		const now = Date.now();
		const existing = state.agents.find((agent) => agent.id === id);
		if (existing) {
			existing.role = role;
			existing.status = "running";
			delete existing.handoff;
			existing.updated_at = now;
		} else {
			state.agents.push({
				id,
				role,
				status: "running",
				started_at: now,
				updated_at: now,
			});
			if (state.agents.length > MAX_AGENTS)
				state.agents.splice(0, state.agents.length - MAX_AGENTS);
		}
		return { state };
	});
	return result.ok;
}

export async function recordAgentStop(sessionId, { id, role, handoff }) {
	if (!id || !role?.startsWith("forge-")) return false;
	const result = await transitionSession(sessionId, (current) => {
		const state = current ?? emptyState();
		const now = Date.now();
		let agent = state.agents.find((candidate) => candidate.id === id);
		if (!agent) {
			agent = { id, role, status: "stopped", started_at: now, updated_at: now };
			state.agents.push(agent);
		}
		agent.role = role;
		agent.status = "stopped";
		agent.updated_at = now;
		const bounded = boundedHandoff(handoff);
		if (bounded) agent.handoff = bounded;
		else delete agent.handoff;
		if (state.agents.length > MAX_AGENTS)
			state.agents.splice(0, state.agents.length - MAX_AGENTS);
		return { state };
	});
	return result.ok;
}

export async function removeSession(sessionId) {
	if (typeof sessionId !== "string" || !sessionId.trim()) return false;
	const paths = sessionPaths(sessionId);
	let release;
	try {
		await ensureDirectory();
		release = await acquireLock(paths.lock);
		await rm(paths.file, { force: true });
		await rm(`${paths.file}.raw.txt`, { force: true });
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
				await rm(`${file}.raw.txt`, { force: true });
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
	for (const entry of entries) {
		if (!entry.isFile() || !/^[a-f0-9]{64}\.json\.raw\.txt$/.test(entry.name))
			continue;
		const legacy = join(directory, entry.name);
		try {
			const info = await stat(legacy);
			if (now - info.mtimeMs > ttl) {
				await rm(legacy, { force: true });
				removed += 1;
			}
		} catch {}
	}
	return { removed, directory };
}

export function newState() {
	return emptyState();
}
