import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { ROOT } from "./support.mjs";

test("root installer entrypoint resolves the refactored plugin installer", () => {
	const result = spawnSync("bun", [join(ROOT, "install.mjs")], {
		cwd: ROOT,
		encoding: "utf8",
	});

	expect(result.status).toBe(2);
	expect(result.stderr).toContain("Usage: bun install.mjs");
	expect(result.stderr).not.toContain("Cannot find module");
});
