#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { which } from "./lib/process.mjs";

export const PACKAGE = "@colbymchenry/codegraph";

export async function commandCandidates(resolve = which) {
	const candidates = [];
	if (await resolve("codegraph")) candidates.push(["codegraph"]);
	if (await resolve("bun")) candidates.push(["bun", "x", PACKAGE]);
	else if (await resolve("bunx")) candidates.push(["bunx", PACKAGE]);
	if (await resolve("pnpm")) candidates.push(["pnpm", "dlx", PACKAGE]);
	else if (await resolve("pnpx")) candidates.push(["pnpx", PACKAGE]);
	if (await resolve("yarn")) candidates.push(["yarn", "dlx", PACKAGE]);
	if (await resolve("npx")) candidates.push(["npx", "--yes", PACKAGE]);
	return candidates;
}

export async function resolveCommand(resolve = which) {
	return (await commandCandidates(resolve))[0] ?? null;
}

async function main() {
	const command = await resolveCommand();
	if (!command) {
		process.stderr.write(
			"CodeGraph CLI unavailable: install Bun, pnpm, Yarn, or npm/Node.js\n",
		);
		return 127;
	}
	const result = spawnSync(
		command[0],
		[...command.slice(1), ...process.argv.slice(2)],
		{ stdio: "inherit" },
	);
	return result.status ?? 127;
}

if (import.meta.main) process.exit(await main());
