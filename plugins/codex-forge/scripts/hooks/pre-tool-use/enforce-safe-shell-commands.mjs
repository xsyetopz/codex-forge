#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";
import { dangerousShellCommandReason } from "./classify-dangerous-shell-command.mjs";
import { commandText } from "./shell-command.mjs";

const event = "PreToolUse";
const payload = await readHookPayload(event);
if (payload) {
	const command = commandText(payload);
	const reason = command === null ? null : dangerousShellCommandReason(command);
	if (reason)
		emitHook(event, {
			deny: "Shell safety: use a scoped, reversible command that preserves repository and host state.",
		});
}
