#!/usr/bin/env node
import { basename } from "node:path";
import { emitHook, readStdinJson } from "../hooklib.mjs";
import { commandText, shellTokens } from "./shell-command.mjs";

function advisory(command) {
	const tokens = shellTokens(command);
	if (!tokens.length) return null;
	const values = tokens.map((item) => item.value);
	const base = basename(values[0]);
	if (base === "grep" && values.includes("-R"))
		return "Use bounded `rg`; use `codegraph_explore` for structural queries.";
	if (base === "ls" && values.includes("-R"))
		return "Use `rg --files`/`fd`; use `codegraph_explore` for structural queries.";
	if (base === "find" && values[1] === ".")
		return "Bound the search or use `fd`; use `codegraph_explore` for structural queries.";
	if (
		["cat", "sed", "head", "tail"].includes(base) &&
		values.slice(1).some((value) => value.endsWith("SKILL.md"))
	)
		return "Use native skill loading; don't shell-read `SKILL.md` to activate a skill.";
	return null;
}

const event = process.argv[2] ?? "";
if (event === "PreToolUse") {
	const payload = await readStdinJson();
	const command = commandText(payload);
	const context = command === null ? null : advisory(command);
	if (context) emitHook(event, { context });
}
