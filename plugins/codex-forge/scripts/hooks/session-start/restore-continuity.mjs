#!/usr/bin/env node
import { createHash } from "node:crypto";
import { hasCodeGraph } from "../../lib/codegraph-repository.mjs";
import {
	cleanupExpiredStates,
	readRawTask,
	readSession,
} from "../../lib/continuity-state.mjs";
import { emitHook, readHookPayload } from "../../lib/hook-runtime.mjs";

const RAW_INLINE_CHARS = 12_000;
const HANDOFF_COUNT = 4;

function rawContext(raw) {
	if (!raw) return null;
	if (raw.text.length <= RAW_INLINE_CHARS)
		return `Preserved !RAW task (execute this wording without normalization):\n${raw.text}`;
	const sha = createHash("sha256").update(raw.text).digest("hex");
	return `Preserved !RAW task is ${raw.text.length} characters and stored verbatim at ${raw.path} (sha256 ${sha}). Read that file before continuing the task; its wording is authoritative.`;
}

function handoffContext(state) {
	if (!state) return [];
	const sections = [];
	const agents = [...state.agents]
		.filter((agent) => agent.status === "stopped" && agent.handoff)
		.sort((left, right) => right.updated_at - left.updated_at)
		.slice(0, HANDOFF_COUNT);
	for (const agent of agents)
		sections.push(`${agent.role} handoff (${agent.id}):\n${agent.handoff}`);
	return sections;
}

const event = "SessionStart";
const payload = await readHookPayload(event);
if (payload) {
	await cleanupExpiredStates(Date.now(), payload.session_id);
	const indexed = await hasCodeGraph(payload.cwd ?? process.cwd());
	const discovery = ["startup", "resume", "clear"].includes(payload.source)
		? indexed
			? "Indexed repository: use CodeGraph first for structural discovery and verify consequential findings in current source."
			: "Repository has no `.codegraph/` index; use bounded manual source discovery."
		: null;
	if (["resume", "compact"].includes(payload.source)) {
		const [state, raw] = await Promise.all([
			readSession(payload.session_id),
			readRawTask(payload.session_id),
		]);
		const sections = [
			discovery,
			rawContext(raw),
			...handoffContext(state),
		].filter(Boolean);
		if (sections.length)
			emitHook(event, {
				context: `Forge continuity (${payload.source}):\n\n${sections.join("\n\n")}`,
			});
	} else if (discovery) emitHook(event, { context: discovery });
}
