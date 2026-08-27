function literal(value) {
	return JSON.stringify(String(value));
}

function registeredTarget(state) {
	if (
		["reviewer_running", "awaiting_recheck", "reviewed", "passed"].includes(
			state.phase,
		)
	)
		return state.reviewer?.id ?? state.worker?.id ?? null;
	return state.worker?.id ?? state.reviewer?.id ?? null;
}

function waitFor(state, role, id) {
	return `Forge phase \`${state.phase}\`; registered ${role} target ${literal(id)} is active. Collect that target with one \`multi_agent_v1wait_agent\` call using \`targets: [${literal(id)}]\` and \`timeout_ms: 300000\`.`;
}

export function phaseRecovery(state) {
	const workerId = state.worker?.id ?? null;
	const reviewerId = state.reviewer?.id ?? null;
	switch (state.phase) {
		case "awaiting_worker":
			if (workerId) return waitFor(state, "`forge-worker`", workerId);
			return 'Forge phase `awaiting_worker`; the registered `forge-worker` target is pending. Call `multi_agent_v1spawn_agent` exactly once with `agent_type: "forge-worker"`.';
		case "worker_running":
			return workerId
				? waitFor(state, "`forge-worker`", workerId)
				: "Forge phase `worker_running`; the registered `forge-worker` target identity is pending. Collect the SubagentStart result, then wait on its recorded target.";
		case "awaiting_reviewer":
			if (reviewerId) return waitFor(state, "`forge-reviewer`", reviewerId);
			return `Forge phase \`awaiting_reviewer\`; registered \`forge-worker\` target ${literal(workerId)} completed. Call \`multi_agent_v1spawn_agent\` exactly once with \`agent_type: "forge-reviewer"\`.`;
		case "reviewer_running":
			return reviewerId
				? waitFor(state, "`forge-reviewer`", reviewerId)
				: "Forge phase `reviewer_running`; the registered `forge-reviewer` target identity is pending. Collect the SubagentStart result, then wait on its recorded target.";
		case "repair_worker":
			if (workerId && state.worker?.status === "repair_running")
				return waitFor(state, "`forge-worker`", workerId);
			return `Forge phase \`repair_worker\`; registered \`forge-worker\` target ${literal(workerId)} is ready for repair. Call \`multi_agent_v1send_input\` with \`target: ${literal(workerId)}\` and the reviewer findings.`;
		case "repair_required":
			return `Forge phase \`repair_required\`; registered \`forge-worker\` target ${literal(workerId)} is ready for repair. Call \`multi_agent_v1send_input\` with \`target: ${literal(workerId)}\` and the required repair.`;
		case "awaiting_recheck":
			return `Forge phase \`awaiting_recheck\`; registered \`forge-reviewer\` target ${literal(reviewerId)} is ready. Call \`multi_agent_v1send_input\` with \`target: ${literal(reviewerId)}\` and the repaired evidence.`;
		case "reviewed":
		case "passed":
			return `Forge phase \`${state.phase}\`; registered \`forge-reviewer\` target ${literal(reviewerId)} returned pass. The reviewed candidate is frozen; continue with exact read-only evidence inspection or Stop.`;
		case "blocked":
			return `Forge phase \`blocked\`; registered target ${literal(registeredTarget(state) ?? "unresolved")} has integrity state \`${state.integrity}\`. Start a fresh session for a clean registered sequence.`;
		default:
			return `Forge phase \`${state.phase}\`; registered target ${literal(registeredTarget(state) ?? "pending")} is recorded. Continue that phase through its registered target.`;
	}
}

export function integrityRecovery(state) {
	return `Forge phase \`${state.phase}\`; registered target ${literal(registeredTarget(state) ?? "unresolved")} has integrity state \`${state.integrity}\`. Start a fresh session for a clean registered sequence.`;
}
