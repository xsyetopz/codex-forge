#!/usr/bin/env bun
import { platform } from "node:os";
import { resolveCommand } from "./codegraph.mjs";
import { output, run, which } from "./lib/process.mjs";

const CORE = {
	rg: "ripgrep",
	fd: "fd",
	jq: "jq",
	uv: "uv",
	"ast-grep": "ast-grep",
};
const OPTIONAL = {
	bat: "bat",
	gh: "gh",
	shellcheck: "shellcheck",
	shfmt: "shfmt",
	hyperfine: "hyperfine",
	just: "just",
	watchexec: "watchexec",
	tokei: "tokei",
};

async function verifyBrewFormula(pkg) {
	if (!(await which("brew"))) return false;
	return (
		run("brew", ["info", "--formula", pkg], { timeout: 30_000 }).status === 0
	);
}

async function installNative(command, pkg) {
	if (await which(command)) return [true, "present"];
	if ((await which("brew")) && (await verifyBrewFormula(pkg))) {
		const result = run("brew", ["install", pkg]);
		return [Boolean(await which(command)), output(result).slice(-2_000)];
	}
	if (platform() === "win32" && (await which("scoop"))) {
		const search = run("scoop", ["search", pkg], { timeout: 30_000 });
		if (
			search.status === 0 &&
			output(search).toLowerCase().includes(pkg.toLowerCase())
		) {
			const result = run("scoop", ["install", pkg]);
			return [Boolean(await which(command)), output(result).slice(-2_000)];
		}
	}
	if (
		platform() === "linux" &&
		process.geteuid?.() === 0 &&
		(await which("apt-get")) &&
		(await which("apt-cache"))
	) {
		const aptPkg = command === "fd" ? "fd-find" : pkg;
		if (run("apt-cache", ["show", aptPkg], { timeout: 30_000 }).status === 0) {
			const result = run("apt-get", ["install", "-y", aptPkg]);
			if (command === "fd" && !(await which("fd")) && (await which("fdfind")))
				return [true, "installed fd-find; binary is fdfind"];
			return [Boolean(await which(command)), output(result).slice(-2_000)];
		}
	}
	return [false, "no verified non-interactive provider available"];
}

async function installCodegraph() {
	if (await which("codegraph")) return [true, "present"];
	const attempts = [];
	const installers = [
		["bun", ["bun", "add", "--global", "@colbymchenry/codegraph"]],
		["pnpm", ["pnpm", "add", "--global", "@colbymchenry/codegraph"]],
		["yarn", ["yarn", "global", "add", "@colbymchenry/codegraph"]],
		["npm", ["npm", "install", "--global", "@colbymchenry/codegraph"]],
	];
	for (const [executable, command] of installers) {
		if (!(await which(executable))) continue;
		const result = run(command[0], command.slice(1), { timeout: 240_000 });
		attempts.push(output(result).slice(-2_000));
		if (result.status === 0 && (await which("codegraph")))
			return [true, output(result).slice(-2_000)];
	}
	const runner = await resolveCommand();
	if (runner) return [true, `runner available: ${runner.join(" ")}`];
	return [
		false,
		attempts.join("\n") || "no Bun, pnpm, Yarn, or npm provider available",
	];
}

function usage() {
	process.stderr.write(
		"Usage: bun scripts/tools.mjs <install [tools...] [--full] | doctor>\n",
	);
	return 2;
}

async function main() {
	const [command, ...arguments_] = process.argv.slice(2);
	if (command === "doctor") {
		for (const name of [
			...Object.keys(CORE),
			"codegraph",
			...Object.keys(OPTIONAL),
		])
			console.log(`${name}: ${(await which(name)) ?? "missing"}`);
		return 0;
	}
	if (command !== "install") return usage();
	const full = arguments_.includes("--full");
	const selected = arguments_.filter((item) => item !== "--full");
	const names = full
		? [...Object.keys(CORE), "codegraph", ...Object.keys(OPTIONAL)]
		: selected.length
			? selected
			: [...Object.keys(CORE), "codegraph"];
	const failures = [];
	for (const name of names) {
		let result;
		if (name === "codegraph") result = await installCodegraph();
		else {
			const pkg = { ...CORE, ...OPTIONAL }[name];
			if (!pkg) {
				process.stderr.write(`unknown tool: ${name}\n`);
				failures.push(name);
				continue;
			}
			result = await installNative(name, pkg);
		}
		const [ok, message] = result;
		console.log(`${name}: ${ok ? "ok" : "not installed"}`);
		if (!ok) {
			console.log(message.trim());
			failures.push(name);
		}
	}
	return failures.length ? 1 : 0;
}

process.exit(await main());
