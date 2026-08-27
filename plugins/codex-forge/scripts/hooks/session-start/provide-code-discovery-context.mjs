#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";

const event = "SessionStart";
const payload = await readHookPayload(event);
if (payload) {
	const sessionContext =
		payload.source === "compact"
			? "Resume from the compact checkpoint and durable goal/plan. Preserve exact pending process ids and continue the recorded next action."
			: ["startup", "resume", "clear"].includes(payload.source)
				? "Code discovery: prefer `codegraph_explore` over `grep`/file-read for structural queries; use `rg`/read for literals."
				: null;
	if (sessionContext) emitHook(event, { context: sessionContext });
}
