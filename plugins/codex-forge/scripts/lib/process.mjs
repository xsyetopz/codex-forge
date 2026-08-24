import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { delimiter, join } from "node:path";

export async function which(command, environment = process.env) {
	const extensions =
		process.platform === "win32"
			? (environment.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
			: [""];
	for (const directory of (environment.PATH ?? "").split(delimiter)) {
		for (const extension of extensions) {
			const candidate = join(directory, `${command}${extension}`);
			try {
				await access(candidate, constants.X_OK);
				return candidate;
			} catch {}
		}
	}
	return null;
}

export function run(
	command,
	args = [],
	{ timeout = 180_000, env = process.env } = {},
) {
	return spawnSync(command, args, {
		encoding: "utf8",
		timeout,
		env,
		stdio: ["ignore", "pipe", "pipe"],
	});
}

export function output(result) {
	return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}
