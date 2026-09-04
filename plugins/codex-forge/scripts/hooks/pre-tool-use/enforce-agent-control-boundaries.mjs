#!/usr/bin/env node
import { recordSpawnAdmission } from "../../lib/continuity-state.mjs";
import { emitHook, readHookPayload } from "../../lib/hook-runtime.mjs";

const FORGE_ROLES = new Set([
	"forge-architect",
	"forge-debugger",
	"forge-direct",
	"forge-hard-worker",
	"forge-retriever",
	"forge-repo-intelligence",
	"forge-reviewer",
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
	const callerValues = [
		payload.agent_type,
		payload.agent_id,
		payload.parent_agent_type,
		payload.parent_agent_id,
		input?.parent_agent_type,
		input?.parent_agent_id,
	];
	const forgeChild = callerValues.some(knownForgeIdentity);
	if (/(?:^|[.:])(?:create_goal|update_goal)$/.test(tool) && forgeChild)
		emitHook(event, {
			deny: "Return Goal-state evidence and recommendations to the root, which owns Goal creation and status updates.",
		});
	else if (
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
		let deny = null;
		if (
			forkContext === true ||
			(forkTurns !== undefined && !["none", 0, "0"].includes(forkTurns))
		)
			deny =
				"Create the Forge child with `fork_context=false` so it starts with only its bounded assignment.";
		else {
			if (forgeChild)
				deny =
					"Return the need for further delegation to the root agent, which owns Forge agent orchestration.";
			else if (!FORGE_ROLES.has(role))
				deny =
					"Select a registered Forge `agent_type` for this bounded child assignment.";
			else if (payload.session_id && payload.tool_use_id) {
				const admission = await recordSpawnAdmission(payload.session_id, {
					toolUseId: String(payload.tool_use_id),
					role,
				});
				if (!admission.allowed) deny = admission.reason;
			}
		}
		if (deny) emitHook(event, { deny });
	}
}
