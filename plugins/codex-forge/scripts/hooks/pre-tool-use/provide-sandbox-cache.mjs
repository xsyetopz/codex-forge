#!/usr/bin/env node
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emitHook, readHookPayload } from "../hooklib.mjs";
import {
	commandText,
	executable,
	segments,
	shellTokens,
} from "./shell-command.mjs";

function directExecutable(segment) {
	let index = 0;
	while (
		index < segment.length &&
		segment[index].value.includes("=") &&
		!segment[index].value.startsWith("=")
	)
		index += 1;
	if (executable(segment[index] ?? "") === "env") {
		index += 1;
		while (
			index < segment.length &&
			(segment[index].value.startsWith("-") ||
				(segment[index].value.includes("=") &&
					!segment[index].value.startsWith("=")))
		)
			index += 1;
	}
	if (["command", "exec", "nohup"].includes(executable(segment[index] ?? "")))
		index += 1;
	return executable(segment[index] ?? "");
}

function invokesGitHubCli(command) {
	const tokens = shellTokens(command);
	return Boolean(
		tokens &&
			segments(tokens).some((segment) => directExecutable(segment) === "gh"),
	);
}

function quote(value) {
	return `'${value.replaceAll("'", `'\\''`)}'`;
}

const event = "PreToolUse";
const payload = await readHookPayload(event);
if (payload) {
	const command = commandText(payload);
	if (
		command &&
		invokesGitHubCli(command) &&
		!/(?:^|\s)XDG_CACHE_HOME\s*=/.test(command)
	) {
		const input =
			payload.tool_input &&
			typeof payload.tool_input === "object" &&
			!Array.isArray(payload.tool_input)
				? payload.tool_input
				: {};
		const cache = join(tmpdir(), "codex-forge-cache");
		emitHook(event, {
			updatedInput: {
				...input,
				command: `export XDG_CACHE_HOME=${quote(cache)}; ${command}`,
			},
		});
	}
}
