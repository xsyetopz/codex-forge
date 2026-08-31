#!/usr/bin/env node
import { clearRawTask, recordRawTask } from "../../lib/continuity-state.mjs";
import { isRawPrompt } from "../../lib/prompt-contract.mjs";
import { emitHook, readHookPayload } from "../../lib/hook-runtime.mjs";

const event = "UserPromptSubmit";
const payload = await readHookPayload(event);
if (payload?.session_id) {
	if (isRawPrompt(payload.prompt)) {
		await recordRawTask(payload.session_id, payload.prompt);
		emitHook(event, {
			context:
				"Forge !RAW is active for this request. Preserve the user task wording after the marker when forming the execution contract or delegating it; append only role, evidence, authority, oracle, and stop boundaries.",
		});
	} else {
		await clearRawTask(payload.session_id);
	}
}
