#!/usr/bin/env node
import { emitBlock, readHookPayload } from "../hooklib.mjs";
import { agentIdentityStatus, isRoot } from "./classify.mjs";
import { phaseRecovery } from "./guidance.mjs";
import { removeSession, transitionSession } from "./state.mjs";

const event = "Stop";
const payload = await readHookPayload(event);
if (payload && agentIdentityStatus(payload) === "incomplete")
	emitBlock(
		"Forge root identity is incomplete. Continue completion through the recorded root session.",
	);
if (payload && isRoot(payload)) {
	const outcome = await transitionSession(payload.session_id, (current) => {
		if (!current || (current.paused && current.integrity === "ok"))
			return { state: current, write: false };
		if (["reviewed", "passed"].includes(current.phase))
			return { state: current, write: false, value: { complete: true } };
		if (current.phase === "blocked" && current.stop_notice_emitted === true)
			return {
				state: current,
				write: false,
				value: { already_notified: true },
			};
		const next = structuredClone(current);
		if (next.phase === "blocked") next.stop_notice_emitted = true;
		return {
			state: next,
			value: { block: phaseRecovery(next) },
		};
	});
	if (outcome.value?.complete) {
		const removed = await removeSession(payload.session_id);
		if (!removed)
			emitBlock(
				"Forge orchestration state cleanup failed. Continue in a fresh session before completion.",
			);
	} else if (outcome.value?.block) emitBlock(outcome.value.block);
	else if (!outcome.ok)
		emitBlock(
			"Forge orchestration state needs a fresh session. Continue the registered worker and reviewer sequence before completion.",
		);
}
