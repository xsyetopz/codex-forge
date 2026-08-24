#!/usr/bin/env node
import { emitHook, readStdinJson } from "../hooklib.mjs";
import { dangerousShellCommandReason } from "./classify-dangerous-shell-command.mjs";
import { commandText } from "./shell-command.mjs";

const event = process.argv[2] ?? "";
if (event === "PreToolUse") {
	const payload = await readStdinJson();
	const command = commandText(payload);
	const reason = command === null ? null : dangerousShellCommandReason(command);
	if (reason)
		emitHook(event, {
			deny: `block-dangerous-shell-commands: ${reason}`,
		});
}
