#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";
import { roleIs } from "../orchestration/classify.mjs";

const event = "SubagentStart";
const payload = await readHookPayload(event);
if (payload) {
	const role = String(payload.agent_type ?? "")
		.trim()
		.toLowerCase();
	emitHook(event, {
		context: roleIs(role, "forge-reviewer")
			? "Review the assigned candidate against the acceptance criteria and return concise evidence, findings, and uncertainty. Record each unresolved question as a finding. Finish with exactly one terminal line: `FORGE_REVIEW_RESULT: pass` when every criterion passes, or `FORGE_REVIEW_RESULT: fail` when findings remain."
			: "Complete the assigned scope, return evidence to the root agent, and leave further delegation to the root agent.",
	});
}
