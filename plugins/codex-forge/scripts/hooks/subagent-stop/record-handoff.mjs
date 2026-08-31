#!/usr/bin/env node
import { recordAgentStop } from "../../lib/continuity-state.mjs";
import { readHookPayload } from "../../lib/hook-runtime.mjs";

const payload = await readHookPayload("SubagentStop");
const role = String(payload?.agent_type ?? "")
	.trim()
	.toLowerCase();
const id = String(payload?.agent_id ?? "").trim();
if (payload?.session_id && role.startsWith("forge-") && id)
	await recordAgentStop(payload.session_id, {
		id,
		role,
		handoff: payload.last_assistant_message,
		payload,
	});
