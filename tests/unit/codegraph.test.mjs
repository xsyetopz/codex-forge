import { describe, expect, test } from "bun:test";
import {
	commandCandidates,
	resolveCommand,
} from "../../plugins/codex-forge/scripts/codegraph.mjs";

const resolver = (available) => async (name) =>
	available.has(name) ? `/tools/${name}` : null;

describe("CodeGraph launcher", () => {
	const cases = [
		[new Set(["bun", "bunx", "pnpm", "pnpx", "yarn", "npx"]), ["bun", "x"]],
		[new Set(["bunx", "pnpm", "yarn", "npx"]), ["bunx"]],
		[new Set(["pnpm", "pnpx", "yarn", "npx"]), ["pnpm", "dlx"]],
		[new Set(["pnpx", "yarn", "npx"]), ["pnpx"]],
		[new Set(["yarn", "npx"]), ["yarn", "dlx"]],
		[new Set(["npx"]), ["npx", "--yes"]],
	];
	for (const [available, prefix] of cases)
		test(`prefers ${prefix[0]}`, async () =>
			expect(
				(await resolveCommand(resolver(available))).slice(0, prefix.length),
			).toEqual(prefix));
	test("prefers an installed binary", async () =>
		expect(
			await resolveCommand(resolver(new Set(["codegraph", "bun"]))),
		).toEqual(["codegraph"]));
	test("returns every supported fallback in order", async () =>
		expect(
			(
				await commandCandidates(
					resolver(new Set(["bun", "pnpm", "yarn", "npx"])),
				)
			).map((item) => item[0]),
		).toEqual(["bun", "pnpm", "yarn", "npx"]));
});
