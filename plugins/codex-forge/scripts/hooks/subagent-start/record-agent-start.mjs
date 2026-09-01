#!/usr/bin/env node
import { recordAgentStart } from "../../lib/continuity-state.mjs";
import { readHookPayload } from "../../lib/hook-runtime.mjs";

const event = "SubagentStart";
const payload = await readHookPayload(event);
if (payload) {
	const role = String(payload.agent_type ?? "")
		.trim()
		.toLowerCase();
	const id = String(payload.agent_id ?? "").trim();
	if (payload.session_id && role.startsWith("forge-") && id)
		await recordAgentStart(payload.session_id, { id, role });
}
