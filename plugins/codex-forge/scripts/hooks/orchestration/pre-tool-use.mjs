#!/usr/bin/env node
import { emitHook, readHookPayload } from "../hooklib.mjs";
import {
	agentIdentityStatus,
	agentTargets,
	forgeRole,
	isCloseTool,
	isFollowupTool,
	isGuardedRootWork,
	isMutationWork,
	isRoot,
	isSpawnTool,
	isWaitOrControlTool,
	normalizedTool,
	roleIs,
	toolInput,
} from "./classify.mjs";
import { integrityRecovery, phaseRecovery } from "./guidance.mjs";
import { appendSessionAudit, newState, transitionSession } from "./state.mjs";

function isPauseTool(tool, input) {
	if (tool === "request_user_input" || tool.endsWith(".request_user_input"))
		return true;
	if (tool === "update_goal" || tool.endsWith(".update_goal"))
		return ["blocked", "paused", "stalled"].includes(
			String(input.status ?? "")
				.trim()
				.toLowerCase(),
		);
	return false;
}

function isGoalCompletion(tool, input) {
	return (
		(tool === "update_goal" || tool.endsWith(".update_goal")) &&
		String(input.status ?? "")
			.trim()
			.toLowerCase() === "complete"
	);
}

function isRequestUserInputTool(tool) {
	return tool === "request_user_input" || tool.endsWith(".request_user_input");
}

const event = "PreToolUse";
const payload = await readHookPayload(event);
const identityStatus = agentIdentityStatus(payload);
const payloadTool = normalizedTool(payload);
const payloadInput = toolInput(payload);
if (payload && identityStatus === "incomplete")
	emitHook(event, {
		deny: "Forge child identity is incomplete. Continue through the registered child target returned by Codex; root orchestration remains on its recorded phase.",
	});
if (payload && identityStatus === "child") {
	const childId = String(payload.agent_id ?? "").trim();
	const childRole = String(payload.agent_type ?? "")
		.trim()
		.toLowerCase();
	const outcome = await transitionSession(payload.session_id, (current) => {
		if (!current)
			return {
				state: null,
				write: false,
				value: {
					deny: `Forge child target ${JSON.stringify(childId)} has no registered repository phase. Return to root orchestration for a registered worker and reviewer sequence.`,
				},
			};
		if (current.integrity !== "ok")
			return {
				state: current,
				write: false,
				value: { deny: integrityRecovery(current) },
			};
		const registeredWorker =
			roleIs(childRole, "forge-worker") && current.worker?.id === childId;
		const registeredReviewer =
			roleIs(childRole, "forge-reviewer") && current.reviewer?.id === childId;
		if (!registeredWorker && !registeredReviewer)
			return {
				state: current,
				write: false,
				value: {
					deny: `Forge child target ${JSON.stringify(childId)} is not the registered worker or reviewer for Forge phase \`${current.phase}\`. Return to root orchestration for the registered child sequence.`,
				},
			};
		if (registeredReviewer && isRequestUserInputTool(payloadTool))
			return {
				state: current,
				write: false,
				value: {
					context:
						"Record the unresolved question as a concise review finding and finish with exactly one terminal line: `FORGE_REVIEW_RESULT: fail`.",
				},
			};
		return {
			state: current,
			write: false,
			...(registeredReviewer && isMutationWork(payload)
				? {
						value: {
							audit: {
								kind: "reviewer_mutation_observation",
								policy: "orchestration_noncompliance",
								agent_id: childId,
								agent_type: childRole,
								phase: current.phase,
								tool: payloadTool,
								timestamp: Date.now(),
							},
						},
					}
				: {}),
		};
	});
	if (outcome.value?.deny) emitHook(event, { deny: outcome.value.deny });
	else if (outcome.value?.context)
		emitHook(event, { context: outcome.value.context });
	else if (outcome.value?.audit)
		await appendSessionAudit(payload.session_id, outcome.value.audit);
	else if (!outcome.ok)
		emitHook(event, {
			deny: "Forge orchestration state is unavailable. Continue child repository work through a fresh registered sequence.",
		});
}
if (payload && isRoot(payload)) {
	const sessionId = payload.session_id;
	const tool = payloadTool;
	const input = payloadInput;
	const spawn = isSpawnTool(tool, input);
	const role = forgeRole(input);
	const guarded = isGuardedRootWork(payload);
	const pause = isPauseTool(tool, input);
	const goalCompletion = isGoalCompletion(tool, input);
	const followup = isFollowupTool(tool);
	const close = isCloseTool(tool);
	const needsState =
		guarded || spawn || followup || close || pause || goalCompletion;
	const outcome = needsState
		? await transitionSession(sessionId, (current) => {
				if (!current) {
					if (spawn && roleIs(role, "forge-worker")) {
						const state = newState();
						return { state };
					}
					if (spawn && roleIs(role, "forge-reviewer"))
						return {
							state: null,
							write: false,
							value: { deny: phaseRecovery(newState()) },
						};
					if (!guarded) return { state: null, write: false };
					const state = newState();
					return {
						state,
						value: { deny: phaseRecovery(state) },
					};
				}

				if (current.integrity !== "ok")
					return {
						state: current,
						write: false,
						value: { deny: integrityRecovery(current) },
					};

				if (goalCompletion && !["reviewed", "passed"].includes(current.phase))
					return {
						state: current,
						write: false,
						value: { deny: phaseRecovery(current) },
					};

				if (pause) {
					if (current.paused) return { state: current, write: false };
					const next = structuredClone(current);
					next.paused = true;
					return { state: next };
				}

				if (spawn && roleIs(role, "forge-worker")) {
					if (!current.worker) {
						const next = structuredClone(current);
						next.paused = false;
						return { state: next };
					}
					return {
						state: current,
						write: false,
						value: { deny: phaseRecovery(current) },
					};
				}
				if (spawn && roleIs(role, "forge-reviewer")) {
					if (
						!current.worker ||
						!["stopped", "repair_stopped"].includes(current.worker.status)
					)
						return {
							state: current,
							write: false,
							value: { deny: phaseRecovery(current) },
						};
					if (current.reviewer)
						return {
							state: current,
							write: false,
							value: { deny: phaseRecovery(current) },
						};
					const next = structuredClone(current);
					next.paused = false;
					return { state: next };
				}

				if (followup) {
					const targets = agentTargets(input);
					const workerId = current.worker?.id;
					const reviewerId = current.reviewer?.id;
					const known = new Set([workerId, reviewerId].filter(Boolean));
					if (!targets.length || targets.some((id) => !known.has(id)))
						return {
							state: current,
							write: false,
							value: { deny: phaseRecovery(current) },
						};
					if (
						targets.includes(workerId) &&
						!["worker_running", "repair_worker", "repair_required"].includes(
							current.phase,
						)
					)
						return {
							state: current,
							write: false,
							value: { deny: phaseRecovery(current) },
						};
					if (
						targets.includes(reviewerId) &&
						!["reviewer_running", "awaiting_recheck"].includes(current.phase)
					)
						return {
							state: current,
							write: false,
							value: { deny: phaseRecovery(current) },
						};
					if (
						targets.includes(workerId) &&
						current.phase === "repair_required"
					) {
						const next = structuredClone(current);
						next.worker.status = "repair_running";
						next.phase = "repair_worker";
						next.paused = false;
						return { state: next };
					}
					if (!current.paused) return { state: current, write: false };
					const next = structuredClone(current);
					next.paused = false;
					return { state: next };
				}

				if (close && !["reviewed", "passed"].includes(current.phase)) {
					const targets = agentTargets(input);
					const registered = new Set(
						[current.worker?.id, current.reviewer?.id].filter(Boolean),
					);
					if (targets.some((id) => registered.has(id)))
						return {
							state: current,
							write: false,
							value: { deny: phaseRecovery(current) },
						};
				}

				if (!guarded || isWaitOrControlTool(tool))
					return { state: current, write: false };
				if (["reviewed", "passed"].includes(current.phase)) {
					return {
						state: current,
						write: false,
						value: { deny: phaseRecovery(current) },
					};
				}
				if (current.paused) {
					const next = structuredClone(current);
					next.paused = false;
					return {
						state: next,
						value: { deny: phaseRecovery(next) },
					};
				}
				return {
					state: current,
					write: false,
					value: { deny: phaseRecovery(current) },
				};
			})
		: { ok: true };
	if (outcome.value?.deny) emitHook(event, { deny: outcome.value.deny });
	else if (!outcome.ok && needsState)
		emitHook(event, {
			deny: "Forge orchestration state is unavailable. Establish the registered worker and reviewer sequence before repository work continues.",
		});
}
