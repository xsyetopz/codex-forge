import { doctor } from "./doctor.mjs";
import { install, revert, uninstall } from "./lifecycle.mjs";
import { reinstall } from "./reinstall.mjs";

function parseArguments(arguments_) {
	const [command, ...flags] = arguments_;
	if (
		!["install", "uninstall", "revert", "doctor", "reinstall"].includes(command)
	)
		return null;
	const allowed = {
		install: new Set(["--no-tools", "--replace", "--purge-cache"]),
		uninstall: new Set(["--purge"]),
		revert: new Set(),
		doctor: new Set(["--json", "--purge-cache"]),
		reinstall: new Set(["--yes"]),
	}[command];
	if (flags.some((flag) => !allowed.has(flag))) return null;
	return {
		command,
		noTools: flags.includes("--no-tools"),
		replace: flags.includes("--replace"),
		purgeCache: flags.includes("--purge-cache"),
		purge: flags.includes("--purge"),
		json: flags.includes("--json"),
		yes: flags.includes("--yes"),
	};
}
export async function main(arguments_ = process.argv.slice(2)) {
	const options = parseArguments(arguments_);
	if (!options) {
		process.stderr.write(
			"Usage: bun install.mjs <install|uninstall|revert|doctor|reinstall> [options]\n",
		);
		return 2;
	}
	try {
		return await { install, uninstall, revert, doctor, reinstall }[
			options.command
		](options);
	} catch (error) {
		process.stderr.write(`[cf] ${error.message}\n`);
		return 2;
	}
}

if (import.meta.main) process.exit(await main());

export { parseArguments };
