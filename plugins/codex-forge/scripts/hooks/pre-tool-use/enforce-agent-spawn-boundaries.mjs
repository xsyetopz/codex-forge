#!/usr/bin/env node
import { emitHook, readStdinJson } from "../hooklib.mjs";

const FORGE_ROLES = new Set([
	"forge-architect",
	"forge-debugger",
	"forge-direct",
	"forge-hard-worker",
	"forge-retriever",
	"forge-reviewer",
	"forge-scout",
	"forge-tail-reviewer",
	"forge-worker",
]);

function knownForgeIdentity(value) {
	if (typeof value !== "string") return false;
	const identity = value.trim().toLowerCase();
	return [...FORGE_ROLES].some(
		(role) =>
			identity === role ||
			identity.startsWith(`${role}:`) ||
			identity.startsWith(`${role}/`),
	);
}

const event = process.argv[2] ?? "";
if (event === "PreToolUse") {
	const payload = await readStdinJson();
	const tool = String(payload.tool_name ?? payload.tool ?? "").toLowerCase();
	const input = payload.tool_input ?? payload.input ?? {};
	if (
		tool.includes("spawn_agent") &&
		input &&
		typeof input === "object" &&
		!Array.isArray(input)
	) {
		const {
			fork_turns: forkTurns,
			fork_context: forkContext,
			agent_type: role,
		} = input;
		if (forkContext === true || !["none", 0, "0"].includes(forkTurns))
			emitHook(event, {
				deny: "Set fork_turns=none for a no-parent-context subagent.",
			});
		else {
			const callerValues = [
				payload.agent_type,
				payload.agent_id,
				payload.parent_agent_type,
				payload.parent_agent_id,
				input.parent_agent_type,
				input.parent_agent_id,
			];
			if (callerValues.some(knownForgeIdentity))
				emitHook(event, {
					deny: "Forge child agents cannot spawn children (runtime caller identity is unverified; defense-in-depth).",
				});
			else if (!FORGE_ROLES.has(role))
				emitHook(event, {
					deny: "Select a registered Forge agent_type for the child.",
				});
		}
	}
}
