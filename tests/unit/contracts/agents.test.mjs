import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
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
	expect(rules).not.toContain('prefix_rule(pattern=["git"], decision="allow"');
	expect(rules).toContain(
		'prefix_rule(pattern=["npm","publish"], decision="prompt"',
	);
	expect(rules).toContain(
		'prefix_rule(pattern=["git","push"], decision="prompt"',
	);
});

test("registered agent role contracts remain bounded", () => {
	const descriptions = JSON.parse(
		read(join(PLUGIN, "assets", "agent-descriptions.json")),
	);
	const roles = readdirSync(join(PLUGIN, "agents")).filter((name) =>
		/^forge-.*\.toml$/.test(name),
	);
	expect(roles.length).toBeGreaterThanOrEqual(9);
	for (const name of roles) {
		const role = TOML.parse(read(join(PLUGIN, "agents", name)));
		expect(role.name).toBe(name.slice(0, -5));
		expect(role.description).toBe(descriptions[role.name]);
		expect(role.developer_instructions).toBeTruthy();
		expect(role.service_tier).toBe("flex");
		expect(role.features?.multi_agent_v2).toBeUndefined();
	}
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-architect.toml"))).model,
	).toBe("gpt-5.6-sol");
	const reviewer = TOML.parse(
		read(join(PLUGIN, "agents", "forge-reviewer.toml")),
	);
	const pollGuidance =
		"For empty process-continuation polls, use `yield_time_ms=30000`; interactive writes proceed immediately.";
	expect(reviewer.developer_instructions).toContain(pollGuidance);
	expect(reviewer.developer_instructions).toContain(
		"Finish with exactly one terminal result line",
	);
	expect(reviewer.developer_instructions).toContain(
		"`FORGE_REVIEW_RESULT: pass`",
	);
	expect(reviewer.developer_instructions).toContain(
		"`FORGE_REVIEW_RESULT: fail`",
	);
	const worker = TOML.parse(read(join(PLUGIN, "agents", "forge-worker.toml")));
	expect(worker.developer_instructions).toContain(pollGuidance);
	expect(worker.model).toBe("gpt-5.6-luna");
	expect(worker.model_reasoning_effort).toBe("medium");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-scout.toml")))
			.model_reasoning_effort,
	).toBe("low");
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
	).toBe("xhigh");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-tail-reviewer.toml")))
			.model_reasoning_effort,
	).toBe("xhigh");
	expect(
		TOML.parse(read(join(PLUGIN, "agents", "forge-retriever.toml"))).model,
	).toBe("gpt-5.6-terra");
});
