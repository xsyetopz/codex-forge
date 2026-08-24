import { readFile } from "node:fs/promises";

export async function readStdinJson() {
	try {
		const input = await readFile(0, "utf8");
		return input.trim() ? JSON.parse(input) : {};
	} catch {
		return {};
	}
}

export async function readHookPayload(expectedEvent) {
	const payload = await readStdinJson();
	return payload.hook_event_name === expectedEvent ? payload : null;
}

export function emitHook(event, { deny, context } = {}) {
	const hookSpecificOutput = { hookEventName: event };
	if (deny) {
		hookSpecificOutput.permissionDecision = "deny";
		hookSpecificOutput.permissionDecisionReason = deny;
	}
	if (context) hookSpecificOutput.additionalContext = context;
	process.stdout.write(`${JSON.stringify({ hookSpecificOutput })}\n`);
}
