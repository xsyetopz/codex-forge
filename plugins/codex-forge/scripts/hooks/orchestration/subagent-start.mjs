#!/usr/bin/env node
import { readHookPayload } from "../hooklib.mjs";
import { roleIs } from "./classify.mjs";
import { newState, transitionSession } from "./state.mjs";

const event = "SubagentStart";
const payload = await readHookPayload(event);
const role = String(payload?.agent_type ?? "")
	.trim()
	.toLowerCase();
if (
	payload &&
	(roleIs(role, "forge-worker") || roleIs(role, "forge-reviewer"))
) {
	await transitionSession(payload.session_id, (current) => {
		const state = current ?? newState();
		const next = structuredClone(state);
		const id = String(payload.agent_id ?? "").trim();
		if (!id) return { state: next, write: false };
		if (roleIs(role, "forge-worker")) {
			if (next.worker?.id && next.worker.id !== id) {
				next.integrity = "duplicate_worker";
				next.phase = "blocked";
				return { state: next };
			}
			if (
				(next.worker &&
					!["worker_running", "repair_worker", "repair_required"].includes(
						next.phase,
					)) ||
				(!next.worker && next.phase !== "awaiting_worker")
			) {
				next.integrity = "worker_out_of_order";
				next.phase = "blocked";
				return { state: next };
			}
			next.worker = {
				...(next.worker ?? {}),
				id,
				role: "forge-worker",
				status: ["repair_worker", "repair_required"].includes(next.phase)
					? "repair_running"
					: "running",
			};
			if (next.phase === "awaiting_worker") next.phase = "worker_running";
		} else {
			if (next.reviewer?.id && next.reviewer.id !== id) {
				next.integrity = "duplicate_reviewer";
				next.phase = "blocked";
				return { state: next };
			}
			if (!next.worker) {
				next.integrity = "reviewer_before_worker";
				next.phase = "blocked";
				return { state: next };
			}
			const validPhase = next.reviewer
				? ["reviewer_running", "awaiting_recheck"].includes(next.phase)
				: next.phase === "awaiting_reviewer";
			if (
				!validPhase ||
				!["stopped", "repair_stopped"].includes(next.worker.status)
			) {
				next.integrity = "reviewer_out_of_order";
				next.phase = "blocked";
				return { state: next };
			}
			next.reviewer = {
				...(next.reviewer ?? {}),
				id,
				role: "forge-reviewer",
				status:
					next.phase === "awaiting_recheck" ? "recheck_running" : "running",
			};
			next.phase = "reviewer_running";
		}
		return { state: next };
	});
}
