#!/usr/bin/env node
import { hasCodeGraph } from "../../lib/codegraph-repository.mjs";
import {
	cleanupExpiredStates,
	readSession,
} from "../../lib/continuity-state.mjs";
import { emitHook, readHookPayload } from "../../lib/hook-runtime.mjs";

const HANDOFF_COUNT = 4;

function handoffContext(state) {
	if (!state) return [];
	const sections = [];
	const agents = [...state.agents]
		.filter((agent) => agent.status === "stopped" && agent.handoff)
		.sort((left, right) => right.updated_at - left.updated_at)
		.slice(0, HANDOFF_COUNT);
	for (const agent of agents)
		sections.push(`${agent.role} handoff (${agent.id}):\n${agent.handoff}`);
	if (sections.length)
		sections.unshift(
			"Child handoffs are bounded evidence and recommendations. Root coordination retains the active Goal and resolves uncertainty against the current engineering contract.",
		);
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
		const state = await readSession(payload.session_id);
		const sections = [discovery, ...handoffContext(state)].filter(Boolean);
		if (sections.length)
			emitHook(event, {
				context: `Forge continuity (${payload.source}):\n\n${sections.join("\n\n")}`,
			});
	} else if (discovery) emitHook(event, { context: discovery });
}
