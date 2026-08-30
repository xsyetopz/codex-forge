import { spawnSync } from "node:child_process";
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

export function isCodexProcessRow({ image = "", commandLine = "" }) {
	const imageName = commandBasename(image);
	const text = `${image} ${commandLine}`.toLowerCase();
	return (
		new Set([
			"codex",
			"codex-code-mode-host",
			"codex proxy",
			"codex proxy helper",
		]).has(imageName) ||
		/(^|[\s\\/])codex(?:[\s"']|$)/i.test(text) ||
		/\bcodex-cli(?:\.js)?\b/i.test(text) ||
		/@openai[\\/]codex[\\/]bin[\\/]codex\.js\b/i.test(text) ||
		/\bcodex-code-mode-host\b/i.test(text) ||
		/\bcodex proxy(?: helper)?\b/i.test(text)
	);
}

export function parseUnixProcessTable(snapshot) {
	return snapshot
		.split("\n")
		.map((line) => {
			const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
			if (!match) return null;
			const [, pid, ppid, commandLine] = match;
			return {
				pid: Number(pid),
				ppid: Number(ppid),
				image: commandLine.trim().split(/\s+/, 1)[0] ?? "",
				commandLine,
			};
		})
		.filter(Boolean);
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
		};
	});
}

export function activeCodexProcesses() {
	let rows;
	if (
		process.env.NODE_ENV === "test" &&
		process.env.CODEX_FORGE_PROCESS_TABLE !== undefined
	) {
		rows =
			process.platform === "win32"
				? parseWindowsProcessTable(process.env.CODEX_FORGE_PROCESS_TABLE)
				: parseUnixProcessTable(process.env.CODEX_FORGE_PROCESS_TABLE);
	} else if (process.platform === "win32") {
		const result = spawnSync(
			"powershell.exe",
			[
				"-NoProfile",
				"-Command",
				"Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Compress",
			],
			{ encoding: "utf8" },
		);
		if (result.status !== 0 || typeof result.stdout !== "string")
			throw new Error(
				"unable to inspect Windows Codex processes; close every Codex session and the app server, then retry",
			);
		rows = parseWindowsProcessTable(result.stdout);
	} else {
		const result = spawnSync("ps", ["-axo", "pid=,ppid=,args="], {
			encoding: "utf8",
		});
		if (result.status !== 0 || typeof result.stdout !== "string")
			throw new Error(
				"unable to inspect Codex processes; close every Codex session and the app server, then retry",
			);
		rows = parseUnixProcessTable(result.stdout);
	}
	return rows
		.filter((row) => row.pid !== process.pid && isCodexProcessRow(row))
		.map(({ pid, image, commandLine }) => ({
			pid,
			command: image,
			args: commandLine.trim(),
		}));
}

export function requireCodexClosed() {
	const processes = activeCodexProcesses();
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
