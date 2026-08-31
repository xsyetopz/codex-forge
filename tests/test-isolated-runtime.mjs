#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
// Opt-in disposable Codex runtime checks. No live call runs unless
// FORGE_LIVE_EVAL=1 is explicitly set.
import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { TOML } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const MAX_OUTPUT = 800_000;
const DEFAULT_TIMEOUT = 180_000;

function run(
	command,
	{ env = process.env, cwd, timeout = 30_000, input } = {},
) {
	const result = spawnSync(command[0], command.slice(1), {
		env,
		cwd,
		timeout,
		input,
		encoding: "utf8",
		maxBuffer: MAX_OUTPUT,
	});
	return {
		status: result.status ?? 127,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		timedOut: result.error?.code === "ETIMEDOUT",
	};
}

function which(command) {
	return (
		run([
			process.platform === "win32" ? "where" : "sh",
			...(process.platform === "win32"
				? [command]
				: ["-c", `command -v ${command}`]),
		]).status === 0
	);
}

function parseJsonl(raw) {
	const events = [];
	for (const [index, line] of raw.split("\n").entries()) {
		if (!line.trim()) continue;
		try {
			const event = JSON.parse(line);
			if (!event || typeof event !== "object" || Array.isArray(event))
				return [[], `stdout line ${index + 1} was not a JSON object`];
			events.push(event);
		} catch {
			return [[], `stdout line ${index + 1} was not JSON`];
		}
	}
	return events.length
		? [events, null]
		: [[], "runtime emitted no JSONL events"];
}

function* walk(value) {
	if (value && typeof value === "object") {
		if (!Array.isArray(value)) yield value;
		for (const child of Object.values(value)) yield* walk(child);
	}
}

function* strings(value) {
	if (typeof value === "string") yield value;
	else if (value && typeof value === "object")
		for (const child of Object.values(value)) yield* strings(child);
}

function messages(events) {
	const output = [];
	for (const event of events)
		for (const item of walk(event)) {
			const type = String(item.type ?? "").toLowerCase();
			const role = String(item.role ?? "").toLowerCase();
			if (
				["agent_message", "assistant_message", "assistant"].includes(type) ||
				role === "assistant"
			) {
				for (const key of ["text", "message", "content"])
					if (key in item) output.push(...strings(item[key]));
			}
		}
	return output;
}

const isCollab = (item) =>
	["collabtoolcall", "collabagenttoolcall"].includes(
		String(item.type ?? "")
			.toLowerCase()
			.replaceAll("_", ""),
	);
const collabCalls = (events) =>
	events.flatMap((event) => [...walk(event)].filter(isCollab));
const structuredSpawn = (events) =>
	collabCalls(events).some(
		(item) =>
			Object.keys(item.agents_states ?? {}).length ||
			item.receiver_thread_ids?.length ||
			["spawn_agent", "spawn-agent", "spawnagent"].includes(
				String(item.tool ?? "").toLowerCase(),
			),
	);

function structuredIdentity(events, wanted) {
	const identityKeys = new Set([
		"agent",
		"agent_id",
		"agent_name",
		"agent_role",
		"agent_type",
		"name",
		"recipient",
		"role",
		"target",
		"target_agent",
		"worker",
		"receiver",
		"receiver_agent",
		"receiver_agents",
		"agents_states",
	]);
	wanted = wanted.toLowerCase();
	return events.some((event) =>
		[...walk(event)].some((item) =>
			Object.entries(item).some(
				([key, value]) =>
					identityKeys.has(key.toLowerCase()) &&
					[...strings(value)].some((text) =>
						text.toLowerCase().includes(wanted),
					),
			),
		),
	);
}

const structuredChildSession = (events) =>
	events.some(
		(event) =>
			String(event.type ?? "").toLowerCase() === "session_meta" &&
			(Boolean(event.payload?.parent_thread_id) ||
				Boolean(event.payload?.source?.subagent)),
	);

function rolloutEvents(home) {
	const sessions = join(home, "sessions");
	if (!existsSync(sessions)) return [];
	const events = [];
	const stack = [sessions];
	while (stack.length)
		for (const entry of readdirSync(stack.pop(), { withFileTypes: true })) {
			const path = join(entry.parentPath, entry.name);
			if (entry.isDirectory()) stack.push(path);
			else if (/^rollout-.*\.jsonl$/.test(entry.name)) {
				const [parsed] = parseJsonl(readFileSync(path, "utf8"));
				events.push(...parsed);
			}
		}
	return events;
}

function authSource() {
	const configured =
		process.env.FORGE_AUTH_SOURCE ??
		join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "auth.json");
	return existsSync(configured) ? configured : null;
}

function setupFixture(path, files) {
	mkdirSync(path, { recursive: true });
	for (const [name, content] of Object.entries(files)) {
		const target = join(path, name);
		mkdirSync(resolve(target, ".."), { recursive: true });
		writeFileSync(target, content);
	}
	for (const command of [
		["git", "init", "-q"],
		["git", "config", "user.email", "forge-live-eval@example.invalid"],
		["git", "config", "user.name", "Forge live eval"],
	])
		if (run(command, { cwd: path }).status)
			throw new Error("could not initialize disposable fixture worktree");
}

function snapshot(path) {
	const result = {};
	const stack = [path];
	while (stack.length)
		for (const entry of readdirSync(stack.pop(), { withFileTypes: true })) {
			const item = join(entry.parentPath, entry.name);
			if (entry.name === ".git") continue;
			if (entry.isDirectory()) stack.push(item);
			else result[relative(path, item)] = readFileSync(item).toString("base64");
		}
	return result;
}

function runExec(home, fixture, prompt, timeout) {
	const result = run(
		[
			"codex",
			"exec",
			"--ephemeral",
			"--json",
			"--dangerously-bypass-hook-trust",
			"-C",
			fixture,
			prompt,
		],
		{ env: { ...process.env, CODEX_HOME: home }, cwd: fixture, timeout },
	);
	if (result.timedOut) return [[], "runtime timed out"];
	if (result.status) {
		const diagnostic = `${result.stdout}\n${result.stderr}`.toLowerCase();
		return [
			[],
			[
				"auth",
				"unauthorized",
				"login",
				"quota",
				"rate limit",
				"model",
				"network",
				"connection",
				"not found",
			].some((word) => diagnostic.includes(word))
				? "runtime unavailable (authentication, model, or service evidence)"
				: "codex exec returned a non-zero status",
		];
	}
	return parseJsonl(result.stdout);
}

function runCase(name, home, parent, files, prompt, check, timeout) {
	const selected = new Set(
		(process.env.FORGE_LIVE_EVAL_ONLY ?? "")
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean),
	);
	if (selected.size && !selected.has(name))
		return {
			name,
			status: "UNVERIFIED",
			reason: "case not selected by FORGE_LIVE_EVAL_ONLY",
		};
	const fixture = join(parent, name);
	try {
		setupFixture(fixture, files);
	} catch (error) {
		return { name, status: "FAIL", reason: error.message };
	}
	const [events, error] = runExec(home, fixture, prompt, timeout);
	if (error)
		return {
			name,
			status: /unavailable|timed out|event/.test(error) ? "UNVERIFIED" : "FAIL",
			reason: error,
		};
	try {
		const result = check(fixture, events);
		return result
			? { name, status: result[0], reason: result[1] }
			: { name, status: "PASS", reason: "observable criteria satisfied" };
	} catch (error_) {
		return { name, status: "FAIL", reason: error_.message };
	}
}

function main() {
	if (process.env.FORGE_LIVE_EVAL !== "1") {
		console.log(
			"UNVERIFIED live-runtime eval skipped (set FORGE_LIVE_EVAL=1 explicitly)",
		);
		return 0;
	}
	if (!which("codex")) {
		console.log(
			"UNVERIFIED live-runtime eval skipped (codex executable unavailable)",
		);
		return 0;
	}
	const auth = authSource();
	if (!auth) {
		console.log(
			"UNVERIFIED live-runtime eval skipped (no auth.json; set FORGE_AUTH_SOURCE or authenticate Codex)",
		);
		return 0;
	}
	process.stderr.write(
		"UNVERIFIED hook-trust limitation: this opt-in disposable harness uses --dangerously-bypass-hook-trust; it doesn't establish normal user trust.\n",
	);
	const requestedTimeout = Number.parseInt(
		process.env.FORGE_LIVE_EVAL_TIMEOUT ?? "",
		10,
	);
	const timeout = Number.isFinite(requestedTimeout)
		? Math.max(30, Math.min(requestedTimeout, 600)) * 1_000
		: DEFAULT_TIMEOUT;
	const root = mkdtempSync(join(tmpdir(), "codex-forge-live-eval-"));
	try {
		const home = join(root, "codex-home");
		mkdirSync(home);
		copyFileSync(auth, join(home, "auth.json"));
		chmodSync(join(home, "auth.json"), 0o600);
		const env = { ...process.env, CODEX_HOME: home };
		const setup = [
			[
				["codex", "plugin", "marketplace", "add", ROOT, "--json"],
				"marketplace registration",
			],
			[
				["codex", "plugin", "add", "codex-forge@codex-forge", "--json"],
				"plugin installation",
			],
			[
				["bun", join(ROOT, "install.mjs"), "install", "--no-tools"],
				"isolated Forge config installation",
			],
		];
		for (const [command, description] of setup)
			if (run(command, { env, cwd: ROOT, timeout: 60_000 }).status) {
				console.log(`FAIL setup: ${description} failed`);
				return 1;
			}
		const fixtures = join(root, "fixtures");
		const results = [];
		results.push(
			runCase(
				"messages",
				home,
				fixtures,
				{ "README.txt": "fixture\n" },
				"Reply once with exactly READY.",
				(_fixture, events) => {
					const emitted = messages(events);
					if (!emitted.length)
						return ["UNVERIFIED", "agent-message event is unavailable"];
					return emitted.some((message) => message.trim() === "READY")
						? null
						: ["FAIL", "the exact READY response was not observed"];
				},
				timeout,
			),
		);
		results.push(
			runCase(
				"delegation",
				home,
				fixtures,
				{ "README.txt": "fixture\n" },
				"Delegate to the registered forge-worker and have it create delegated.txt containing exactly FORGE_WORKER_OK followed by a newline. Verify it.",
				(fixture, events) => {
					if (
						!existsSync(join(fixture, "delegated.txt")) ||
						readFileSync(join(fixture, "delegated.txt"), "utf8") !==
							"FORGE_WORKER_OK\n"
					)
						return ["FAIL", "worker did not produce the exact fixture"];
					const rollouts = rolloutEvents(home);
					const evidence = [...events, ...rollouts];
					return (structuredSpawn(events) ||
						structuredChildSession(rollouts)) &&
						structuredIdentity(evidence, "forge-worker")
						? null
						: [
								"UNVERIFIED",
								"runtime omitted structured forge-worker spawn evidence",
							];
				},
				timeout,
			),
		);
		results.push(
			runCase(
				"sol-diagnosis",
				home,
				fixtures,
				{
					"baseline.txt": "STATUS=healthy\n",
					"contrary.txt": "CONTRARY_RUNTIME_EVIDENCE=outage\n",
				},
				"Read both files, revise the diagnosis from contrary evidence, and don't modify files.",
				(fixture, events) => {
					if (
						JSON.stringify(snapshot(fixture)) !==
						JSON.stringify({
							"baseline.txt":
								Buffer.from("STATUS=healthy\n").toString("base64"),
							"contrary.txt": Buffer.from(
								"CONTRARY_RUNTIME_EVIDENCE=outage\n",
							).toString("base64"),
						})
					)
						return ["FAIL", "diagnosis modified the fixture"];
					const text = messages(events).join("\n").toLowerCase();
					if (
						!["baseline", "contrary", "outage"].every((word) =>
							text.includes(word),
						)
					)
						return ["UNVERIFIED", "runtime output omitted evidence revision"];
					return TOML.parse(readFileSync(join(home, "config.toml"), "utf8"))
						.model === "gpt-5.6-sol"
						? null
						: ["UNVERIFIED", "installed root model was not Sol"];
				},
				timeout,
			),
		);
		const counts = { PASS: 0, UNVERIFIED: 0, FAIL: 0 };
		for (const result of results) {
			counts[result.status] += 1;
			console.log(
				`${result.status.padEnd(10)} ${result.name}: ${result.reason}`,
			);
		}
		console.log(
			`Summary: PASS=${counts.PASS} UNVERIFIED=${counts.UNVERIFIED} FAIL=${counts.FAIL}`,
		);
		return counts.FAIL ? 1 : 0;
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

process.exit(main());
