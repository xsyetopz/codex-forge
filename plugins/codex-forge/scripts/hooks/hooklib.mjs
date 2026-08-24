import { readFile } from "node:fs/promises";

export async function readStdinJson() {
	try {
		const input = await readFile(0, "utf8");
		return input.trim() ? JSON.parse(input) : {};
	} catch {
		return {};
	}
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
