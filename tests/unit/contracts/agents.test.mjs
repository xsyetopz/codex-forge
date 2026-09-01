import { expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { TOML } from "bun";

import { PLUGIN, read } from "./support.mjs";

test("tool and policy sources retain bounded ownership", () => {
	const tools = read(join(PLUGIN, "scripts", "tools.mjs"));
	expect(tools).toContain("@colbymchenry/codegraph");
	expect(tools.indexOf('["bun"')).toBeLessThan(tools.indexOf('["pnpm"'));
	expect(tools.indexOf('["pnpm"')).toBeLessThan(tools.indexOf('["yarn"'));
	expect(tools.indexOf('["yarn"')).toBeLessThan(tools.indexOf('["npm"'));
	const rules = read(join(PLUGIN, "assets", "forge.rules"));
	expect(rules).toContain(
		'prefix_rule(pattern=["codegraph","init"], decision="forbidden"',
	);
	expect(rules).not.toContain('prefix_rule(pattern=["git"], decision="allow"');
	expect(rules).toContain(
		'prefix_rule(pattern=["npm","publish"], decision="prompt"',
	);
	expect(rules).toContain(
		'prefix_rule(pattern=["git","push"], decision="prompt"',
	);
});

test("registered agent role contracts remain bounded", () => {
	const roles = readdirSync(join(PLUGIN, "agents"))
		.filter((name) => /^forge-.*\.toml$/.test(name))
		.sort();
	expect(roles).toEqual([
		"forge-architect.toml",
		"forge-debugger.toml",
		"forge-direct.toml",
		"forge-hard-worker.toml",
		"forge-repo-intelligence.toml",
		"forge-retriever.toml",
		"forge-reviewer.toml",
		"forge-tail-reviewer.toml",
		"forge-worker.toml",
	]);
	expect(existsSync(join(PLUGIN, "assets", "agent-descriptions.json"))).toBe(
		false,
	);
	for (const name of roles) {
		const raw = read(join(PLUGIN, "agents", name));
		const role = TOML.parse(raw);
		expect(role.name).toBe(name.slice(0, -5));
		expect(role.description).toBeTruthy();
		expect(role.developer_instructions).toBeTruthy();
		expect(raw).toContain('developer_instructions = """\n');
		expect(role.service_tier).toBeUndefined();
		expect(role.features?.multi_agent_v2).toBeUndefined();
		for (const unsupported of [
			"sandbox_mode",
			"model_instructions_file",
			"compact_prompt",
			"experimental_compact_prompt_file",
		])
			expect(role[unsupported]).toBeUndefined();
	}
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-architect.toml"))).model,
	).toBe("gpt-5.6-sol");
	const reviewer = TOML.parse(
		read(join(PLUGIN, "agents", "forge-reviewer.toml")),
	);
	expect(reviewer.developer_instructions).toContain("frozen candidate");
	expect(reviewer.developer_instructions).toContain("pass/fail verdict");
	const worker = TOML.parse(read(join(PLUGIN, "agents", "forge-worker.toml")));
	expect(worker.model).toBe("gpt-5.6-luna");
	expect(worker.model_reasoning_effort).toBe("medium");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-retriever.toml")))
			.model_reasoning_effort,
	).toBe("medium");
	for (const name of ["forge-architect", "forge-debugger", "forge-reviewer"])
		expect(
			TOML.parse(read(join(PLUGIN, "agents", `${name}.toml`)))
				.model_reasoning_effort,
		).toBe("medium");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-hard-worker.toml")))
			.model_reasoning_effort,
	).toBe("high");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-tail-reviewer.toml")))
			.model_reasoning_effort,
	).toBe("xhigh");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-retriever.toml"))).model,
	).toBe("gpt-5.6-terra");
	const repoIntelligence = TOML.parse(
		read(join(PLUGIN, "agents", "forge-repo-intelligence.toml")),
	);
	expect(repoIntelligence.model).toBe("gpt-5.6-terra");
	expect(repoIntelligence.developer_instructions).toContain("codegraph sync");
	expect(repoIntelligence.developer_instructions).toContain(
		"CodeGraph CLI first",
	);
	expect(roles).not.toContain("forge-scout.toml");
});

test("prompt layers keep one runtime owner per generic behavior", () => {
	const developer = read(join(PLUGIN, "assets", "developer-instructions.txt"));
	const globalAgents = read(join(PLUGIN, "assets", "AGENTS.md.patch"));
	for (const duplicate of [
		"!RAW",
		"Establish relevance before reading",
		"Compatibility belongs",
		"Validate for information value",
	])
		expect(developer).not.toContain(duplicate);
	for (const duplicate of [
		"requested scope",
		"external or hosted writes",
		"Report changed paths",
	])
		expect(globalAgents).not.toContain(duplicate);
	for (const name of ["forge-direct.toml", "forge-worker.toml"])
		expect(read(join(PLUGIN, "agents", name))).not.toContain(
			"Establish relevance before reading",
		);
});
