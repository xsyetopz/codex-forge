export async function readStdinJson() {
	try {
		let input = "";
		process.stdin.setEncoding("utf8");
		for await (const chunk of process.stdin) input += chunk;
		return input.trim() ? JSON.parse(input) : {};
	} catch {
		return {};
	}
}

export async function readHookPayload(expectedEvent) {
	const payload = await readStdinJson();
	return payload.hook_event_name === expectedEvent ? payload : null;
}

export function emitHook(event, { deny, context, updatedInput } = {}) {
	const hookSpecificOutput = { hookEventName: event };
	if (deny) {
		hookSpecificOutput.permissionDecision = "deny";
		hookSpecificOutput.permissionDecisionReason = deny;
	}
	if (context) hookSpecificOutput.additionalContext = context;
	if (updatedInput) {
		hookSpecificOutput.permissionDecision = "allow";
		hookSpecificOutput.updatedInput = updatedInput;
	}
	process.stdout.write(`${JSON.stringify({ hookSpecificOutput })}\n`);
}

export function emitBlock(reason) {
	process.stdout.write(`${JSON.stringify({ decision: "block", reason })}\n`);
}
