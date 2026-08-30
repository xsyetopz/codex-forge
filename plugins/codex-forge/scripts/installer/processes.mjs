import { spawnSync } from "node:child_process";
import { userInfo } from "node:os";
import { REQUIRED_CODEX_CLI_VERSION } from "./owners/cache.mjs";

export function compareVersions(left, right) {
	const parse = (value) => String(value).split(".").map(Number);
	const a = parse(left);
	const b = parse(right);
	for (let index = 0; index < 3; index += 1) {
		if ((a[index] ?? 0) !== (b[index] ?? 0))
			return (a[index] ?? 0) - (b[index] ?? 0);
	}
	return 0;
}

function commandBasename(command) {
	return command
		.trim()
		.replace(/^['"]|['"]$/g, "")
		.split(/[\\/]/)
		.pop()
		.toLowerCase()
		.replace(/\.exe$/, "");
}

function tokenizePosixCommandLine(commandLine) {
	const tokens = [];
	let token = "";
	let quote = null;
	let escaped = false;
	for (const character of String(commandLine)) {
		if (escaped) {
			token += character;
			escaped = false;
		} else if (character === "\\" && quote !== '"') escaped = true;
		else if (quote) {
			if (character === quote) quote = null;
			else token += character;
		} else if (character === "'" || character === '"') quote = character;
		else if (/\s/.test(character)) {
			if (token) {
				tokens.push(token);
				token = "";
			}
		} else token += character;
	}
	if (escaped) token += "\\";
	if (quote || token === "") {
		if (quote) return null;
	} else tokens.push(token);
	return tokens;
}

function tokenizeWindowsCommandLine(commandLine) {
	const tokens = [];
	let token = "";
	let quoted = false;
	let index = 0;
	const flush = () => {
		if (token !== "") {
			tokens.push(token);
			token = "";
		}
	};
	while (index < String(commandLine).length) {
		const input = String(commandLine);
		if (/\s/.test(input[index]) && !quoted) {
			flush();
			index += 1;
			continue;
		}
		if (input[index] !== "\\") {
			if (input[index] === '"') quoted = !quoted;
			else token += input[index];
			index += 1;
			continue;
		}
		let slashes = 0;
		while (input[index + slashes] === "\\") slashes += 1;
		if (input[index + slashes] === '"') {
			token += "\\".repeat(Math.floor(slashes / 2));
			if (slashes % 2 === 1) token += '"';
			else quoted = !quoted;
			index += slashes + 1;
		} else {
			token += "\\".repeat(slashes);
			index += slashes;
		}
	}
	if (quoted) return null;
	flush();
	return tokens;
}

function tokenizeCommandLine(commandLine, platform = process.platform) {
	return platform === "win32"
		? tokenizeWindowsCommandLine(commandLine)
		: tokenizePosixCommandLine(commandLine);
}

function rowTokens(row) {
	if (Array.isArray(row.argv)) return row.argv;
	const platform = row.platform ?? process.platform;
	if (row.args !== undefined) {
		const args = tokenizeCommandLine(row.args, platform);
		return args;
	}
	return tokenizeCommandLine(row.commandLine ?? "", platform);
}

function nodeEntrypoint(row) {
	const tokens = rowTokens(row);
	if (
		!tokens ||
		!["node", "nodejs", "bun", "deno"].includes(commandBasename(tokens[0]))
	)
		return null;
	let index = 1;
	while (index < tokens.length && tokens[index].startsWith("-")) {
		const option = tokens[index];
		if (
			option === "-e" ||
			option === "--eval" ||
			option.startsWith("-e=") ||
			option.startsWith("--eval=")
		)
			return null;
		if (["-r", "--require", "--loader", "--import"].includes(option)) {
			index += 2;
		} else if (
			["--require=", "--loader=", "--import="].some((prefix) =>
				option.startsWith(prefix),
			)
		)
			index += 1;
		else index += 1;
	}
	const script = tokens[index] ?? "";
	const normalized = script.replaceAll("\\", "/");
	if (!/^(?:\/[\s\S]+|[a-z]:\/[\s\S]+|\/\/[\s\S]+)$/i.test(normalized))
		return null;
	if (
		!/(?:^|\/)@openai\/codex\/bin\/codex\.js$/i.test(normalized) &&
		!/(?:^|\/)codex\.app\/(?:[^/]+\/)*codex$/i.test(normalized)
	)
		return null;
	return { tokens, script };
}

function codexSignature(row) {
	const imageName = commandBasename(row.image);
	if (
		new Set([
			"codex",
			"codex-code-mode-host",
			"codex proxy",
			"codex proxy helper",
		]).has(imageName)
	)
		return { class: imageName, entrypoint: row.image };
	const node = nodeEntrypoint(row);
	return node ? { class: "codex", entrypoint: node.script } : null;
}

export function isCodexProcessRow({
	image = "",
	commandLine = "",
	platform = process.platform,
	args,
}) {
	return Boolean(codexSignature({ image, commandLine, platform, args }));
}

export function parseUnixProcessTable(snapshot) {
	return snapshot
		.split("\n")
		.map((line) => {
			const fields = line.trim().split(/\s+/);
			if (fields.length < 3) return null;
			let owner_uid = null;
			let pid;
			let ppid;
			let args;
			let start_identity = null;
			if (
				/^\d+$/.test(fields[0]) &&
				/^\d+$/.test(fields[1]) &&
				/^\d+$/.test(fields[2]) &&
				fields.length >= 9 &&
				!/^\d+$/.test(fields[3])
			) {
				owner_uid = Number(fields[0]);
				pid = Number(fields[1]);
				ppid = Number(fields[2]);
				start_identity = fields.slice(3, 8).join(" ");
				const image = fields[8];
				args = fields.slice(9).join(" ");
				return {
					owner_uid,
					pid,
					ppid,
					start_identity,
					image,
					args,
					platform: process.platform,
					commandLine: args,
				};
			} else if (/^\d+$/.test(fields[0]) && /^\d+$/.test(fields[1])) {
				pid = Number(fields[0]);
				ppid = Number(fields[1]);
				args = fields.slice(2).join(" ");
			} else return null;
			if (!args) return null;
			const image = args.split(/\s+/, 1)[0] ?? "";
			return {
				owner_uid,
				pid,
				ppid,
				start_identity,
				image,
				args,
				platform: process.platform,
				commandLine: args,
			};
		})
		.filter(Boolean);
}

function processRows() {
	if (
		process.env.NODE_ENV === "test" &&
		process.env.CODEX_FORGE_PROCESS_TABLE !== undefined
	)
		return process.platform === "win32"
			? parseWindowsProcessTable(process.env.CODEX_FORGE_PROCESS_TABLE)
			: parseUnixProcessTable(process.env.CODEX_FORGE_PROCESS_TABLE);
	if (process.platform === "win32") {
		const result = spawnSync(
			"powershell.exe",
			[
				"-NoProfile",
				"-Command",
				"Get-CimInstance Win32_Process | ForEach-Object { $owner = Invoke-CimMethod -InputObject $_ -MethodName GetOwner; [pscustomobject]@{ ProcessId=$_.ProcessId; ParentProcessId=$_.ParentProcessId; Name=$_.Name; CommandLine=$_.CommandLine; CreationDate=$_.CreationDate; Owner=if ($owner.User) { if ($owner.Domain) { $owner.Domain + '\\\\' + $owner.User } else { $owner.User } } else { $null } } } | ConvertTo-Json -Compress",
			],
			{ encoding: "utf8" },
		);
		if (result.status !== 0 || typeof result.stdout !== "string")
			throw new Error("unable to inspect Windows Codex processes");
		return parseWindowsProcessTable(result.stdout);
	}
	const result = spawnSync(
		"ps",
		["-axo", "uid=,pid=,ppid=,lstart=,comm=,args="],
		{ encoding: "utf8" },
	);
	if (result.status !== 0 || typeof result.stdout !== "string")
		throw new Error("unable to inspect Codex processes");
	return parseUnixProcessTable(result.stdout);
}

function classifyCodexProcess(row) {
	return codexSignature(row)?.class ?? null;
}

function ownerKey(row) {
	if (process.platform === "win32")
		return typeof row.owner === "string" && row.owner.trim()
			? row.owner.trim().toLowerCase()
			: null;
	return Number.isInteger(row.owner_uid) ? row.owner_uid : null;
}

function currentOwnerKey() {
	if (process.platform === "win32") {
		const owner =
			process.env.USERDOMAIN && process.env.USERNAME
				? `${process.env.USERDOMAIN}\\${process.env.USERNAME}`
				: userInfo().username;
		return owner?.trim().toLowerCase() || null;
	}
	return typeof process.getuid === "function" ? process.getuid() : null;
}

export function enumerateCodexProcesses() {
	const rows = processRows();
	const currentOwner = currentOwnerKey();
	if (currentOwner === null)
		throw new Error(
			"unable to verify current process owner; refusing Codex process inspection",
		);
	const byPid = new Map(rows.map((row) => [row.pid, row]));
	const ancestors = new Set();
	let cursor = process.pid;
	if (!byPid.has(cursor)) cursor = process.ppid;
	while (byPid.has(cursor)) {
		ancestors.add(cursor);
		cursor = byPid.get(cursor).ppid;
	}
	return rows
		.filter((row) => row.pid !== process.pid && !ancestors.has(row.pid))
		.map((row) => {
			const signature = codexSignature(row);
			const argv = rowTokens(row);
			const parent = byPid.get(row.ppid);
			const parentSignature = parent ? codexSignature(parent) : null;
			return {
				...row,
				class: signature?.class ?? null,
				entrypoint: signature?.entrypoint ?? null,
				argv,
				owner: ownerKey(row),
				parent_identity: parent
					? {
							pid: parent.pid,
							owner: ownerKey(parent),
							start_identity: parent.start_identity,
							executable: parent.image,
							class: parentSignature?.class ?? null,
						}
					: { pid: row.ppid },
			};
		})
		.filter((row) => {
			if (!row.class) return false;
			if (row.owner === null)
				throw new Error(
					`unable to verify owner for Codex process pid ${row.pid}`,
				);
			if (!row.start_identity)
				throw new Error(
					`unable to verify start identity for Codex process pid ${row.pid}`,
				);
			if (!row.argv)
				throw new Error(
					`unable to parse argv for Codex process pid ${row.pid}`,
				);
			return row.owner === currentOwner;
		})
		.map((row) => ({
			...row,
			identity: {
				pid: row.pid,
				owner: row.owner,
				start_identity: row.start_identity,
				executable: row.image,
				argv: row.argv,
				entrypoint: row.entrypoint,
				class: row.class,
				parent: row.parent_identity ?? { pid: row.ppid },
			},
		}));
}

const pause = (ms) => {
	const until = Date.now() + ms;
	while (Date.now() < until)
		Atomics.wait(
			new Int32Array(new SharedArrayBuffer(4)),
			0,
			0,
			Math.min(25, until - Date.now()),
		);
};

export function terminateCodexProcesses({
	waitMs = 250,
	finalWaitMs = 250,
	enumerate = enumerateCodexProcesses,
	inspect = (pid) => enumerate().find((row) => row.pid === pid) ?? null,
	signal = (pid, value) => process.kill(pid, value),
	sleep = pause,
	now = () => Date.now(),
	emptyRescans = 2,
	emptyWaitMs = 25,
} = {}) {
	const boundedWait = (duration) => {
		const deadline = now() + duration;
		sleep(Math.max(0, deadline - now()));
	};
	let initial = enumerate();
	for (
		let attempt = 0;
		initial.length === 0 && attempt < emptyRescans;
		attempt += 1
	) {
		boundedWait(emptyWaitMs);
		initial = enumerate();
	}
	if (!initial.length) return;
	const termed = new Map();
	const identityOf = (row) =>
		row?.identity ?? {
			pid: row?.pid ?? null,
			owner: row?.owner ?? row?.owner_uid ?? null,
			start_identity: row?.start_identity ?? null,
			executable: row?.image ?? null,
			argv: row?.argv ?? rowTokens(row ?? {}),
			entrypoint: row?.entrypoint ?? codexSignature(row)?.entrypoint ?? null,
			class: row?.class ?? classifyCodexProcess(row),
			parent: row?.parent_identity ?? { pid: row?.ppid ?? null },
		};
	const sameIdentity = (expected, current) =>
		current &&
		identityOf(current).pid === identityOf(expected).pid &&
		identityOf(current).owner === identityOf(expected).owner &&
		identityOf(current).start_identity ===
			identityOf(expected).start_identity &&
		identityOf(current).executable === identityOf(expected).executable &&
		JSON.stringify(identityOf(current).argv) ===
			JSON.stringify(identityOf(expected).argv) &&
		identityOf(current).entrypoint === identityOf(expected).entrypoint &&
		JSON.stringify(identityOf(current).parent) ===
			JSON.stringify(identityOf(expected).parent) &&
		identityOf(current).class === identityOf(expected).class;
	const signalVerified = (row, value) => {
		let current;
		try {
			current = inspect(row.pid);
		} catch (error) {
			throw new Error(
				`unable to inspect Codex process pid ${row.pid} before ${value}: ${error.message}`,
			);
		}
		if (!current) return false;
		if (!sameIdentity(row, current))
			throw new Error(
				`Codex process identity changed before ${value}: pid ${row.pid}`,
			);
		try {
			signal(row.pid, value);
			return true;
		} catch (error) {
			if (error?.code === "ESRCH") return false;
			throw new Error(
				`unable to signal Codex process pid ${row.pid}: ${error.message}`,
			);
		}
	};
	for (const row of initial)
		if (signalVerified(row, "SIGTERM")) termed.set(row.pid, row);
	boundedWait(waitMs);
	const afterTerm = enumerate();
	for (const row of afterTerm) {
		if (!termed.has(row.pid) && signalVerified(row, "SIGTERM"))
			termed.set(row.pid, row);
	}
	boundedWait(waitMs);
	for (const row of enumerate()) {
		const original = termed.get(row.pid);
		if (!original)
			throw new Error(
				`Codex process arrived too late for termination: pid ${row.pid}`,
			);
		if (!signalVerified(original, "SIGKILL")) termed.delete(row.pid);
	}
	boundedWait(finalWaitMs);
	const final = enumerate();
	if (final.length)
		throw new Error(
			`Codex processes survived termination: ${final.map((row) => `${row.class} (pid ${row.pid})`).join(", ")}`,
		);
}

export function parseWindowsProcessTable(snapshot) {
	let rows;
	try {
		rows = JSON.parse(snapshot);
	} catch {
		throw new Error("malformed Windows process-table JSON");
	}
	if (!Array.isArray(rows))
		throw new Error("malformed Windows process-table JSON");
	return rows.map((row) => {
		if (!row || typeof row !== "object")
			throw new Error("malformed Windows process-table JSON");
		const pid = Number(row.ProcessId),
			ppid = Number(row.ParentProcessId);
		if (
			!Number.isInteger(pid) ||
			pid <= 0 ||
			!Number.isInteger(ppid) ||
			typeof row.Name !== "string"
		)
			throw new Error("malformed Windows process-table JSON");
		return {
			pid,
			ppid,
			image: row.Name,
			commandLine: typeof row.CommandLine === "string" ? row.CommandLine : "",
			platform: "win32",
			owner:
				typeof row.Owner === "string" && row.Owner.trim()
					? row.Owner.trim()
					: null,
			start_identity:
				row.CreationDate === undefined && row.StartTime === undefined
					? null
					: String(row.CreationDate ?? row.StartTime),
		};
	});
}

export function activeCodexProcesses(options = {}) {
	return (options.enumerate ?? enumerateCodexProcesses)().map(
		({ pid, image, commandLine, class: processClass }) => ({
			pid,
			command: processClass ?? image,
			args: commandLine.trim(),
		}),
	);
}

export function requireCodexClosed(options = {}) {
	const processes = activeCodexProcesses(options);
	if (!processes.length) return;
	const summary = processes
		.map(({ pid, command }) => `${command} (pid ${pid})`)
		.join(", ");
	throw new Error(
		`Codex process(es) still active: ${summary}; close all Codex CLI/app/server ` +
			"processes, run isolated reinstall from an external shell, then start a " +
			"fresh isolated session and review /hooks",
	);
}

export function inspectCodexCli(executable, requiredVersion, compareVersions) {
	if (!executable)
		return {
			available: false,
			version: null,
			compatible: false,
			reason: "codex executable not found",
		};
	const result = spawnSync(executable, ["--version"], {
		encoding: "utf8",
		timeout: 10_000,
	});
	const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
	const match = output.match(
		/(?:^|\s)v?(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?(?:\s|$)/,
	);
	const version = match ? `${match[1]}.${match[2]}.${match[3]}` : null;
	const compatible = Boolean(
		result.status === 0 &&
			version &&
			compareVersions(version, requiredVersion) >= 0,
	);
	return {
		available: true,
		version,
		compatible,
		reason: compatible
			? null
			: result.error?.message ||
				(version
					? `Codex CLI ${version} is older than required ${requiredVersion}`
					: "Codex CLI --version output is malformed"),
		output,
	};
}

export { commandBasename, REQUIRED_CODEX_CLI_VERSION };
