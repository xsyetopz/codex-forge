#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const adapter = resolve(
	process.argv[2] ||
		resolve(import.meta.dir, "../../../..", "benchmarks/harbor/forge_codex.py"),
);
const script = `
import importlib.util, sys, types
class Codex: _REMOTE_CODEX_HOME = "/tmp/codex-home"
for name in ["harbor", "harbor.agents", "harbor.agents.installed", "harbor.environments", "harbor.models", "harbor.models.agent"]: sys.modules[name] = types.ModuleType(name)
codex = types.ModuleType("harbor.agents.installed.codex"); codex.Codex = Codex; sys.modules[codex.__name__] = codex
base = types.ModuleType("harbor.environments.base"); base.BaseEnvironment = object; sys.modules[base.__name__] = base
context = types.ModuleType("harbor.models.agent.context"); context.AgentContext = object; sys.modules[context.__name__] = context
spec = importlib.util.spec_from_file_location("forge_codex", ${JSON.stringify(adapter)})
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
assert module.ForgeCodex
print("ForgeCodex import/setup OK")
`;
const result = spawnSync("python3", ["-B", "-c", script], {
	env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
	encoding: "utf8",
});
if (result.status !== 0) {
	process.stderr.write(result.stderr);
	process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
