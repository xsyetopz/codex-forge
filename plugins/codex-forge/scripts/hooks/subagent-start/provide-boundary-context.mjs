#!/usr/bin/env node
import { recordAgentStart } from "../../lib/continuity-state.mjs";
import { emitHook, readHookPayload } from "../../lib/hook-runtime.mjs";

const event = "SubagentStart";
const payload = await readHookPayload(event);
if (payload) {
	const role = String(payload.agent_type ?? "")
		.trim()
		.toLowerCase();
	const id = String(payload.agent_id ?? "").trim();
	if (payload.session_id && role.startsWith("forge-") && id)
		await recordAgentStart(payload.session_id, { id, role });
	let context =
		"Complete the assigned contract, return a bounded evidence handoff, and leave further delegation to the root agent. Let long-running work reach a natural result; user direction, a concrete blocker, or demonstrated irrelevance justifies interruption.";
	if (role === "forge-reviewer" || role === "forge-tail-reviewer")
		context =
			"Review only the assigned frozen candidate and acceptance boundary. Return findings, checked criteria, evidence, residual uncertainty, and a pass/fail verdict; leave repair and delegation to the root agent.";
	else if (role === "forge-repo-intelligence")
		context =
			"Return a bounded repository-intelligence handoff: question, relevant symbols and paths, relationships, impact, current-source evidence, uncertainty, and smallest next reads. Leave implementation and further delegation to the root agent.";
	emitHook(event, { context });
}
