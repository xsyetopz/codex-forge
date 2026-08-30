import { expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PLUGIN, ROOT, read } from "./support.mjs";

test("runtime Python compatibility surfaces are absent", () => {
	const walk = (directory) =>
		readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? walk(join(directory, entry.name))
				: [join(directory, entry.name)],
		);
	expect(
		walk(join(PLUGIN, "scripts")).filter((path) => path.endsWith(".py")),
	).toEqual([]);
	expect(read(join(ROOT, "README.md"))).not.toMatch(
		/python3|install\.py|validate_schemas/,
	);
	expect(existsSync(join(ROOT, "cf"))).toBe(false);
	expect(existsSync(join(ROOT, "bin"))).toBe(false);
});
