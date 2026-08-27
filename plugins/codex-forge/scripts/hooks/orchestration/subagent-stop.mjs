#!/usr/bin/env node
import { emitBlock, readHookPayload } from "../hooklib.mjs";
import { reviewSentinel, roleIs } from "./classify.mjs";
import { newState, transitionSession } from "./state.mjs";

const event = "SubagentStop";
const payload = await readHookPayload(event);
const role = String(payload?.agent_type ?? "")
	.trim()
	.toLowerCase();
if (
	payload &&
	(roleIs(role, "forge-worker") || roleIs(role, "forge-reviewer"))
) {
	const outcome = await transitionSession(payload.session_id, (current) => {
		const state = current ?? newState();
		const next = structuredClone(state);
		const id = String(payload.agent_id ?? "").trim();
		if (roleIs(role, "forge-worker")) {
			if (!next.worker?.id || next.worker.id !== id) {
				next.integrity = "worker_identity_mismatch";
				next.phase = "blocked";
				return {
					state: next,
					value: {
						block:
							"Forge worker identity is unresolved. Continue with the registered worker id and return its bounded result to the root.",
					},
				};
			}
			if (!["worker_running", "repair_worker"].includes(next.phase)) {
				next.integrity = "worker_out_of_order";
				next.phase = "blocked";
				return {
					state: next,
					value: {
						block:
							"Forge worker lifecycle order is unresolved. Continue from a fresh registered worker and reviewer sequence.",
					},
				};
			}
			next.worker.status =
				next.phase === "repair_worker" ? "repair_stopped" : "stopped";
			next.phase =
				next.worker.status === "repair_stopped"
					? "awaiting_recheck"
					: "awaiting_reviewer";
			return { state: next };
		}
		if (!["reviewer_running", "awaiting_recheck"].includes(next.phase)) {
			next.integrity = "reviewer_out_of_order";
			next.phase = "blocked";
			return {
				state: next,
				value: {
					block:
						"Forge reviewer lifecycle order is unresolved. Continue from the repaired worker result and registered reviewer id.",
				},
			};
		}
		const marker = reviewSentinel(payload.last_assistant_message);
		if (!marker)
			return {
				state: next,
				value: {
					block:
						"Forge review requires a terminal result. Return `FORGE_REVIEW_RESULT: pass` or `FORGE_REVIEW_RESULT: fail` with concise acceptance evidence.",
				},
			};
		if (!next.reviewer?.id || next.reviewer.id !== id) {
			next.integrity = "reviewer_identity_mismatch";
			next.phase = "blocked";
			return {
				state: next,
				value: {
					block:
						"Forge reviewer identity is unresolved. Return the terminal result through the registered reviewer id.",
				},
			};
		}
		next.reviewer.status = "stopped";
		next.review_result = marker;
		next.reviewed = marker === "pass";
		next.phase = marker === "pass" ? "reviewed" : "repair_worker";
		return { state: next };
	});
	if (outcome.value?.block) emitBlock(outcome.value.block);
	else if (!outcome.ok)
		emitBlock(
			"Forge review state is unavailable. Return the terminal result through the registered reviewer sequence.",
		);
}
