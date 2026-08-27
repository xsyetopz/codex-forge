#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";

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

const event = "PreToolUse";
const payload = await readHookPayload(event);
if (payload) {
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
		if (
			forkContext === true ||
			(forkTurns !== undefined && !["none", 0, "0"].includes(forkTurns))
		)
			emitHook(event, {
				deny: "Create the Forge child with `fork_context=false` so it starts with only its bounded assignment.",
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
					deny: "Return the need for further delegation to the root agent, which owns Forge agent orchestration.",
				});
			else if (!FORGE_ROLES.has(role))
				emitHook(event, {
					deny: "Select a registered Forge `agent_type` for this bounded child assignment.",
				});
		}
	}
}
