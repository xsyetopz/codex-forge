import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const RULES = resolve(
	import.meta.dir,
	"../../plugins/codex-forge/assets/forge.rules",
);
const codexAvailable =
	spawnSync("codex", ["--version"], {
		encoding: "utf8",
	}).status === 0;
const policyTest = codexAvailable ? test : test.skip;

function decision(command) {
	const result = spawnSync(
		"codex",
		["execpolicy", "check", "--rules", RULES, "--pretty", "--", ...command],
		{ encoding: "utf8" },
	);
	expect(result.status, result.stderr || result.stdout).toBe(0);
	return JSON.parse(result.stdout).decision;
}

describe("Forge execpolicy integration", () => {
	policyTest("allows local read and test commands", () => {
		for (const command of [
			["pwd"],
			["git", "status"],
			["npm", "test"],
			["cargo", "test"],
		])
			expect(decision(command)).toBe("allow");
	});

	policyTest("routes publication and external writes to approval", () => {
		for (const command of [
			["npm", "exec", "--", "npm", "publish"],
			["pnpm", "exec", "npm", "publish"],
			["yarn", "exec", "npm", "publish"],
			["yarn", "npm", "publish"],
			["npm", "--prefix", "workspace", "publish"],
			["pnpm", "--dir", "workspace", "publish"],
			["yarn", "--cwd", "workspace", "publish"],
			["cargo", "--manifest-path", "Cargo.toml", "publish"],
			["rm", "focused.txt"],
			["git", "push"],
		])
			expect(decision(command)).toBe("prompt");
	});

	policyTest("does not allow unsupported global-option write forms", () => {
		for (const command of [
			["git", "-C", ".", "push"],
			["git", "-c", "foo=bar", "reset", "--hard"],
			["npm", "--workspace=workspace", "publish"],
			["pnpm", "--filter=workspace", "publish"],
			["yarn", "--cwd=workspace", "publish"],
			["cargo", "--manifest-path=Cargo.toml", "publish"],
		])
			expect(decision(command)).not.toBe("allow");
	});

	policyTest("distinguishes destructive commands from dry runs", () => {
		expect(decision(["git", "clean", "-n"])).toBe("allow");
		for (const command of [
			["git", "clean", "-f"],
			["git", "clean", "-fd"],
			["git", "clean", "-fn"],
			["git", "clean", "-f", "-n"],
			["git", "clean", "-nfd"],
		])
			expect(decision(command)).not.toBe("forbidden");
		for (const command of [
			["sudo", "id"],
			["git", "reset", "--hard"],
			["git", "branch", "-d", "-f", "old"],
			["git", "branch", "-df", "old"],
			["git", "branch", "-fd", "old"],
			["git", "stash", "-q", "drop"],
		])
			expect(decision(command)).toBe("forbidden");
	});
});
