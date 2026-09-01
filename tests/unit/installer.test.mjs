import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { parseArguments } from "../../plugins/codex-forge/scripts/installer/cli.mjs";

const ROOT = resolve(import.meta.dir, "../..");

describe("installer public entrypoint", () => {
	test("executes the documented CLI contract", () => {
		const result = spawnSync(
			"bun",
			[resolve(ROOT, "install.mjs"), "--invalid"],
			{
				encoding: "utf8",
			},
		);
		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Usage: bun install.mjs");
	});

	test("accepts explicit non-interactive reinstall confirmation", () => {
		expect(parseArguments(["reinstall", "--yes"])).toMatchObject({
			command: "reinstall",
			yes: true,
		});
		expect(parseArguments(["install", "--yes"])).toBeNull();
	});
});
