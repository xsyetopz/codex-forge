#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const job = resolve(process.argv[2] || "");
if (!existsSync(job)) throw new Error(`Job directory not found: ${job}`);
const readJson = (path) => {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return null;
	}
};
const findAll = (dir, predicate) => {
	if (!existsSync(dir)) return null;
	const stack = [dir];
	const matches = [];
	while (stack.length) {
		const current = stack.pop();
		for (const item of readdirSync(current, { withFileTypes: true }).sort(
			(a, b) => a.name.localeCompare(b.name),
		)) {
			const path = resolve(current, item.name);
			if (item.isDirectory()) stack.push(path);
			else if (predicate(item.name, path)) matches.push(path);
		}
	}
	return matches.sort();
};
const find = (dir, name) =>
	findAll(dir, (entry) => entry === name)?.[0] || null;

const readJsonLines = (path) => {
	if (!path) return [];
	return readFileSync(path, "utf8")
		.split("\n")
		.map((line) => {
			try {
				return JSON.parse(line);
			} catch {
				return null;
			}
		})
		.filter(Boolean);
};

const sessionIdentity = (meta) => {
	if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
	if (typeof meta.id !== "string" || !meta.id.trim()) return null;
	if (meta.source === "exec") return { id: meta.id, role: "root" };
	const spawn = meta.source?.subagent?.thread_spawn;
	if (
		!spawn ||
		typeof spawn !== "object" ||
		Array.isArray(spawn) ||
		typeof spawn.agent_role !== "string" ||
		!spawn.agent_role.trim() ||
		typeof meta.parent_thread_id !== "string" ||
		!meta.parent_thread_id.trim()
	)
		return null;
	return { id: meta.id, role: spawn.agent_role };
};

const sessionInfo = (paths) => {
	const pathEvents = paths.map((path) =>
		readJsonLines(path).map((event) => ({ ...event, __path: path })),
	);
	const events = pathEvents.flat();
	const identities = pathEvents.map((entries) => {
		const metas = entries
			.filter((event) => event.type === "session_meta")
			.map((event) => sessionIdentity(event.payload));
		if (!metas.length || metas.some((identity) => identity === null))
			return null;
		const first = metas[0];
		return metas.every(
			(identity) => identity.id === first.id && identity.role === first.role,
		)
			? first
			: null;
	});
	const identity = identities[0] || null;
	const metadataValid = Boolean(
		identity &&
			identities.every(
				(candidate) =>
					candidate?.id === identity.id && candidate.role === identity.role,
			),
	);
	// Role identity comes only from Codex's session_meta source. A missing
	// or inconsistent identity is intentionally left unknown instead of being
	// inferred from messages, filenames, or other session artifacts.
	const role = metadataValid ? identity.role : null;
	const tokenEvents = events
		.filter(
			(event) =>
				event.type === "event_msg" && event.payload?.type === "token_count",
		)
		.sort((a, b) =>
			String(a.timestamp || "").localeCompare(String(b.timestamp || "")),
		);
	const terminalEvents = events
		.filter(
			(event) =>
				event.type === "event_msg" && event.payload?.type === "task_complete",
		)
		.sort((a, b) =>
			String(a.timestamp || "").localeCompare(String(b.timestamp || "")),
		);
	const terminalEvent = terminalEvents.at(-1) || null;
	const usage = terminalEvent
		? tokenEvents
				.filter((event) =>
					terminalEvent.timestamp
						? event.timestamp
							? String(event.timestamp).localeCompare(
									String(terminalEvent.timestamp),
								) <= 0
							: event.__path === terminalEvent.__path
						: event.__path === terminalEvent.__path,
				)
				.at(-1)?.payload?.info?.total_token_usage
		: null;
	const callIds = new Set();
	let anonymousCallCount = 0;
	const nativeWebSearchCallIds = new Set();
	let anonymousNativeWebSearchCallCount = 0;
	const modelTurnIds = new Set();
	let anonymousModelTurnCount = 0;
	for (const event of events) {
		if (
			event.type === "response_item" &&
			["function_call", "custom_tool_call"].includes(event.payload?.type)
		) {
			const callId = event.payload.call_id || event.payload.id;
			if (callId) callIds.add(callId);
			else anonymousCallCount++;
		}
		if (
			event.type === "response_item" &&
			event.payload?.type === "web_search_call"
		) {
			const callId = event.payload.call_id || event.payload.id;
			if (callId) nativeWebSearchCallIds.add(callId);
			else anonymousNativeWebSearchCallCount++;
		}
		if (event.type === "event_msg" && event.payload?.type === "token_count") {
			// Codex emits one token_count boundary after each model response,
			// including tool-only responses and the terminal assistant response.
			// A resumed rollout may replay earlier boundaries, so prefer the event
			// timestamp and fall back to its cumulative usage snapshot for identity.
			const usageIdentity = event.payload?.info?.total_token_usage;
			const turnId = event.timestamp
				? `timestamp:${event.timestamp}`
				: usageIdentity
					? `usage:${JSON.stringify(usageIdentity)}`
					: null;
			if (turnId) modelTurnIds.add(turnId);
			else anonymousModelTurnCount++;
		}
	}
	const toolCalls = callIds.size + anonymousCallCount;
	const nativeWebSearchCalls =
		nativeWebSearchCallIds.size + anonymousNativeWebSearchCallCount;
	return {
		paths,
		id: metadataValid ? identity.id : null,
		parent_thread_id:
			metadataValid && role !== "root"
				? (pathEvents[0].find((event) => event.type === "session_meta")?.payload
						?.parent_thread_id ?? null)
				: null,
		role,
		timestamp:
			pathEvents[0].find((event) => event.type === "session_meta")?.payload
				?.timestamp || null,
		metadata_valid: metadataValid,
		usage_complete: Boolean(terminalEvent && usage),
		tool_calls: toolCalls,
		native_web_search_calls: nativeWebSearchCalls,
		model_turns: modelTurnIds.size + anonymousModelTurnCount,
		input_tokens: usage?.input_tokens ?? null,
		cached_input_tokens: usage?.cached_input_tokens ?? null,
		uncached_input_tokens:
			usage?.input_tokens != null && usage?.cached_input_tokens != null
				? usage.input_tokens - usage.cached_input_tokens
				: null,
		output_tokens: usage?.output_tokens ?? null,
		uncached_plus_output_tokens:
			usage?.input_tokens != null &&
			usage?.cached_input_tokens != null &&
			usage?.output_tokens != null
				? usage.input_tokens - usage.cached_input_tokens + usage.output_tokens
				: null,
		reasoning_output_tokens: usage?.reasoning_output_tokens ?? null,
	};
};

const isForgeCoreRepositoryTask = (config) => {
	const kwargs = config?.agent?.kwargs || {};
	const configToml = String(kwargs.config_toml || "");
	const forgeCore =
		config?.arm === "forge-core" ||
		String(kwargs.skills_dir || "").includes("codex-forge") ||
		configToml.includes("Codex Forge is active");
	const task = config?.task || {};
	const repositoryTask =
		task.source === "forge-tasks" ||
		(typeof task.git_url === "string" && task.git_url.length > 0) ||
		(typeof task.path === "string" && task.path.length > 0);
	return forgeCore && repositoryTask;
};

const roleAccounting = (sessions, required, roleEvidenceUnknown = false) => {
	const roleSessionIds = Object.create(null);
	for (const session of sessions) {
		const role = session.role || "unknown";
		if (!roleSessionIds[role]) roleSessionIds[role] = [];
		if (!roleSessionIds[role].includes(session.id))
			roleSessionIds[role].push(session.id);
	}
	const workers = roleSessionIds["forge-worker"] || [];
	const reviewers = roleSessionIds["forge-reviewer"] || [];
	const hardWorkers = roleSessionIds["forge-hard-worker"] || [];
	const reasons = [];
	if (required && !roleEvidenceUnknown) {
		const malformed = sessions.filter(
			(session) => session.metadata_valid !== true,
		).length;
		if (malformed)
			reasons.push(
				`observed ${malformed} logical session${malformed === 1 ? "" : "s"} with malformed or inconsistent session_meta`,
			);
		if (workers.length !== 1)
			reasons.push(
				`expected exactly one forge-worker logical session, observed ${workers.length}`,
			);
		if (reviewers.length !== 1)
			reasons.push(
				`expected exactly one forge-reviewer logical session, observed ${reviewers.length}`,
			);
		if (!workers.length && hardWorkers.length)
			reasons.push(
				"forge-hard-worker is not a valid substitute for forge-worker",
			);
	}
	return {
		required,
		valid: required
			? roleEvidenceUnknown
				? null
				: reasons.length === 0
			: true,
		invalid_reason: reasons.length ? reasons.join("; ") : null,
		evidence_status: required
			? roleEvidenceUnknown
				? "unknown"
				: reasons.length
					? "invalid"
					: "complete"
			: "not_required",
		role_session_ids: roleSessionIds,
		logical_session_count: sessions.length,
		reviewer_reuse:
			reviewers.length === 1
				? {
						session_id: reviewers[0],
						rollout_files:
							sessions.find((session) => session.id === reviewers[0])?.paths
								.length ?? 0,
						resumed_rollout_files: Math.max(
							0,
							(sessions.find((session) => session.id === reviewers[0])?.paths
								.length ?? 0) - 1,
						),
					}
				: null,
	};
};

const sum = (records, key) => {
	if (
		!records.length ||
		records.some((record) => !Number.isFinite(record[key]))
	)
		return null;
	return records.reduce((total, record) => total + record[key], 0);
};

const jobResult = readJson(resolve(job, "result.json"));
const jobStats =
	jobResult?.stats && typeof jobResult.stats === "object"
		? jobResult.stats
		: null;
const externallyIncomplete =
	jobResult && Object.hasOwn(jobResult, "finished_at")
		? jobResult.finished_at === null
		: false;
const jobLifecycleReason = externallyIncomplete
	? [
			"retryable infrastructure/manual interruption: Pier job finished_at is null",
			Number.isInteger(jobStats?.n_running_trials) &&
			jobStats.n_running_trials > 0
				? `${jobStats.n_running_trials} trial${jobStats.n_running_trials === 1 ? "" : "s"} still running`
				: null,
			Number.isInteger(jobStats?.n_pending_trials) &&
			jobStats.n_pending_trials > 0
				? `${jobStats.n_pending_trials} trial${jobStats.n_pending_trials === 1 ? "" : "s"} pending`
				: null,
			Number.isInteger(jobStats?.n_cancelled_trials) &&
			jobStats.n_cancelled_trials > 0
				? `${jobStats.n_cancelled_trials} trial${jobStats.n_cancelled_trials === 1 ? "" : "s"} cancelled`
				: null,
		]
			.filter(Boolean)
			.join("; ")
	: null;
const trials = [];
for (const item of readdirSync(job, { withFileTypes: true }).filter((entry) =>
	entry.isDirectory(),
)) {
	const dir = resolve(job, item.name);
	const config = readJson(resolve(dir, "config.json"));
	const rewardPath = find(dir, "reward.json");
	const agentDir = resolve(dir, "agent");
	const trajectoryPaths =
		findAll(agentDir, (name) => name === "trajectory.json") || [];
	const sessionPaths =
		findAll(agentDir, (name) => /^rollout-.*\.jsonl$/.test(name)) || [];
	const sessionGroups = new Map();
	for (const path of sessionPaths) {
		const meta =
			readJsonLines(path).find((event) => event.type === "session_meta")
				?.payload || {};
		// `id` is Codex's logical thread id. V1 children inherit the root's
		// `session_id`, so that field identifies the enclosing exec session rather
		// than the child thread. Repeated rollout files with one `id` are resumes.
		const id = meta.id || path;
		if (!sessionGroups.has(id)) sessionGroups.set(id, []);
		sessionGroups.get(id).push(path);
	}
	const sessions = [...sessionGroups.values()]
		.map(sessionInfo)
		.sort((a, b) =>
			String(a.timestamp || a.paths[0]).localeCompare(
				String(b.timestamp || b.paths[0]),
			),
		);
	const rootSession =
		sessions.find((session) => session.role === "root") || null;
	const rootSessionId = rootSession?.id || null;
	const trajectoryEntries = trajectoryPaths.map((path) => ({
		path,
		data: readJson(path),
	}));
	// Harbor normally writes the root trajectory at agent/trajectory.json. When
	// legacy V1 children race that writer, the file can instead contain a child
	// trajectory. Prefer an explicit session-id match, then the canonical path,
	// then lexical order so selection remains reproducible.
	const trajectoryEntry =
		trajectoryEntries.find(
			(entry) => entry.data?.session_id === rootSessionId,
		) ||
		trajectoryEntries.find(
			(entry) => entry.path === resolve(agentDir, "trajectory.json"),
		) ||
		trajectoryEntries[0] ||
		null;
	const trajectoryPath = trajectoryEntry?.path || null;
	const exceptionPath = find(dir, "exception.txt");
	const reward = rewardPath ? readJson(rewardPath) : null;
	const trajectory = trajectoryEntry?.data || null;
	const exceptionLines = exceptionPath
		? readFileSync(exceptionPath, "utf8")
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean)
		: [];
	const invalidReason =
		(
			exceptionLines.find((line) =>
				/(?:AgentTimeoutError\s*:|Agent execution timed out)/i.test(line),
			) ||
			exceptionLines.find((line) => /AgentTimeoutError/i.test(line)) ||
			exceptionLines.find((line) =>
				/(?:operation not permitted|permission denied|failed to update builder)/i.test(
					line,
				),
			) ||
			exceptionLines.find((line) =>
				/(?:error:|failed|permission|denied)/i.test(line),
			) ||
			exceptionLines[0] ||
			null
		)?.slice(0, 500) ?? null;
	const steps = trajectory?.steps || [];
	const trajectoryToolCalls = steps.reduce(
		(sum, step) => sum + (step.tool_calls?.length || 0),
		0,
	);
	const trajectoryNativeWebSearchCalls = steps.reduce(
		(sum, step) =>
			sum +
			(step.tool_calls || []).filter((call) => call?.type === "web_search_call")
				.length,
		0,
	);
	const metrics = trajectory?.final_metrics || {};
	const aggregateSessions = sessions.length > 1;
	const sessionTotals = aggregateSessions
		? {
				tool_calls: sum(sessions, "tool_calls"),
				native_web_search_calls: sum(sessions, "native_web_search_calls"),
				model_turns: sum(sessions, "model_turns"),
				input_tokens: sum(sessions, "input_tokens"),
				cached_input_tokens: sum(sessions, "cached_input_tokens"),
				uncached_input_tokens: sum(sessions, "uncached_input_tokens"),
				output_tokens: sum(sessions, "output_tokens"),
				uncached_plus_output_tokens: sum(
					sessions,
					"uncached_plus_output_tokens",
				),
			}
		: null;
	const trialToolCalls = aggregateSessions
		? sessionTotals.tool_calls
		: trajectoryToolCalls;
	const trialNativeWebSearchCalls = sessions.length
		? sessions.reduce(
				(total, session) => total + session.native_web_search_calls,
				0,
			)
		: trajectoryNativeWebSearchCalls;
	const trialModelTurns = aggregateSessions
		? sessionTotals.model_turns
		: steps.filter(
				(step) => step.source === "agent" || step.role === "assistant",
			).length;
	const trialInputTokens = aggregateSessions
		? sessionTotals.input_tokens
		: (metrics.total_prompt_tokens ?? null);
	const trialCachedInputTokens = aggregateSessions
		? sessionTotals.cached_input_tokens
		: (metrics.total_cached_tokens ?? null);
	const trialUncachedInputTokens = aggregateSessions
		? sessionTotals.uncached_input_tokens
		: metrics.total_prompt_tokens != null && metrics.total_cached_tokens != null
			? metrics.total_prompt_tokens - metrics.total_cached_tokens
			: null;
	const trialOutputTokens = aggregateSessions
		? sessionTotals.output_tokens
		: (metrics.total_completion_tokens ?? null);
	const trialUncachedPlusOutputTokens = aggregateSessions
		? sessionTotals.uncached_plus_output_tokens
		: trialUncachedInputTokens != null && trialOutputTokens != null
			? trialUncachedInputTokens + trialOutputTokens
			: null;
	const sessionTrajectories = new Map(
		trajectoryEntries
			.filter((entry) => entry.data?.session_id)
			.map((entry) => [entry.data.session_id, entry.data]),
	);
	const sessionMetrics = sessions.map((session) => ({
		session_id: session.id,
		parent_thread_id: session.parent_thread_id,
		role: session.role,
		metadata_valid: session.metadata_valid,
		usage_complete: session.usage_complete,
		rollout_files: session.paths.length,
		tool_calls: session.tool_calls,
		native_web_search_calls: session.native_web_search_calls,
		model_turns: session.model_turns,
		input_tokens: session.input_tokens,
		cached_input_tokens: session.cached_input_tokens,
		uncached_input_tokens: session.uncached_input_tokens,
		output_tokens: session.output_tokens,
		uncached_plus_output_tokens: session.uncached_plus_output_tokens,
		cost_usd:
			sessionTrajectories.get(session.id)?.final_metrics?.total_cost_usd ??
			null,
	}));
	const repositoryForgeCore = isForgeCoreRepositoryTask(config);
	// Harbor copies Codex sessions after a trial exits. An externally incomplete
	// Pier job can leave a verifier directory while that copy is still absent;
	// the missing role evidence is unknown, rather than a Forge violation.
	const roleEvidenceUnknown =
		externallyIncomplete && repositoryForgeCore && sessionPaths.length === 0;
	const orchestration = roleAccounting(
		sessions,
		repositoryForgeCore,
		roleEvidenceUnknown,
	);
	const pinnedDeepSwe = ["0.149.1", "0.150.1"].includes(
		config?.agent?.kwargs?.version,
	);
	const contaminationReason =
		pinnedDeepSwe && trialNativeWebSearchCalls > 0
			? `pinned DeepSWE config emitted ${trialNativeWebSearchCalls} native web_search_call item${trialNativeWebSearchCalls === 1 ? "" : "s"}; benchmark contamination`
			: null;
	const configurationInvalidReasons = [];
	if (orchestration.valid === false)
		configurationInvalidReasons.push(
			`forge-core repository-task orchestration invalid: ${orchestration.invalid_reason}`,
		);
	if (contaminationReason)
		configurationInvalidReasons.push(contaminationReason);
	const configurationInvalidReason = configurationInvalidReasons.length
		? configurationInvalidReasons.join("; ")
		: null;
	const copiedArtifactReasons = [];
	if (externallyIncomplete && !rewardPath)
		copiedArtifactReasons.push("verifier result was not copied");
	if (roleEvidenceUnknown)
		copiedArtifactReasons.push(
			"role compliance is unknown because Codex session copy was not completed",
		);
	const partialTrialReason = externallyIncomplete
		? [jobLifecycleReason, ...copiedArtifactReasons, invalidReason]
				.filter(Boolean)
				.join("; ")
		: null;
	const roleUnknownReason = roleEvidenceUnknown
		? "role compliance is unknown because Codex session copy was not completed"
		: null;
	const configurationValid =
		orchestration.valid === null
			? null
			: orchestration.valid && !contaminationReason;
	const peakContextTokens = metrics.extra?.peak_context_tokens ?? null;
	const outputBudgetReason =
		reward?.reward != null && trialOutputTokens == null
			? "cumulative output-token usage unavailable; 100K output budget unverified"
			: reward?.reward != null && trialOutputTokens > 100_000
				? `cumulative output-token usage ${trialOutputTokens} exceeds the 100K output budget`
				: null;
	const trialInvalidReasons = [
		configurationInvalidReason,
		partialTrialReason,
		roleUnknownReason,
		reward?.reward != null ? invalidReason : null,
		outputBudgetReason,
		reward?.reward == null ? invalidReason || "missing verifier reward" : null,
	].filter(Boolean);
	trials.push({
		trial: item.name,
		task: config?.task?.name || item.name.split("__")[0],
		reward: reward?.reward ?? null,
		verifier: reward,
		partial: reward?.partial ?? null,
		tool_calls: trialToolCalls,
		native_web_search_calls: trialNativeWebSearchCalls,
		model_turns: trialModelTurns,
		input_tokens: trialInputTokens,
		cached_input_tokens: trialCachedInputTokens,
		uncached_input_tokens: trialUncachedInputTokens,
		output_tokens: trialOutputTokens,
		uncached_plus_output_tokens: trialUncachedPlusOutputTokens,
		peak_context_tokens: peakContextTokens,
		within_100k_output_budget:
			trialOutputTokens == null ? null : trialOutputTokens <= 100_000,
		cost_usd: aggregateSessions
			? sessionMetrics.every((session) => Number.isFinite(session.cost_usd))
				? sum(sessionMetrics, "cost_usd")
				: null
			: (metrics.total_cost_usd ?? null),
		metrics_scope: aggregateSessions ? "all Codex V1 sessions" : "trajectory",
		trajectory_path: trajectoryPath,
		trajectory_session_id: trajectory?.session_id ?? null,
		sessions: aggregateSessions ? sessionMetrics : null,
		logical_sessions: sessionMetrics.map((session) => ({
			session_id: session.session_id,
			role: session.role,
			metadata_valid: session.metadata_valid,
			parent_thread_id: session.parent_thread_id,
			rollout_files: session.rollout_files,
		})),
		orchestration,
		pinned_deepswe: pinnedDeepSwe,
		web_search_contaminated: Boolean(contaminationReason),
		configuration_valid: configurationValid,
		invalid_reason: trialInvalidReasons.length
			? trialInvalidReasons.join("; ")
			: null,
	});
}
const completed = trials.filter((trial) => trial.reward !== null);
const evaluable = completed.filter(
	(trial) =>
		trial.configuration_valid === true &&
		trial.within_100k_output_budget === true,
);
const configurationInvalidTrials = trials.filter(
	(trial) => trial.configuration_valid === false,
);
const invalidTrials = trials.filter(
	(trial) =>
		trial.reward === null ||
		trial.configuration_valid !== true ||
		trial.within_100k_output_budget !== true,
);
const completedSum = (key) => sum(completed, key);
const evaluableSum = (key) => sum(evaluable, key);
const attemptedSum = (key) => sum(trials, key);
const verifierPassed = completed.filter((trial) => trial.reward === 1).length;
const passed = evaluable.filter((trial) => trial.reward === 1).length;
const costs = trials
	.map((trial) => trial.cost_usd)
	.filter((cost) => Number.isFinite(cost));
const totalCost =
	costs.length === trials.length && trials.length
		? costs.reduce((total, cost) => total + cost, 0)
		: null;
const totalToolCalls = attemptedSum("tool_calls");
const totalNativeWebSearchCalls = attemptedSum("native_web_search_calls");
const totalInputTokens = attemptedSum("input_tokens");
const totalOutputTokens = attemptedSum("output_tokens");
const totalTokens =
	Number.isFinite(totalInputTokens) && Number.isFinite(totalOutputTokens)
		? totalInputTokens + totalOutputTokens
		: null;
const terminal =
	!externallyIncomplete &&
	trials.length > 0 &&
	trials.every(
		(trial) =>
			trial.reward !== null ||
			(trial.invalid_reason && trial.output_tokens !== null),
	);
const retryableInfrastructure =
	invalidTrials.some((trial) =>
		/(?:operation not permitted|permission denied|failed to update builder|docker build failed|AgentTimeoutError|Agent execution timed out)/i.test(
			trial.invalid_reason || "",
		),
	) || externallyIncomplete;
const report = {
	schema: "codex-forge.deepswe-results.v1",
	job: basename(job),
	n_trials: trials.length,
	n_completed: completed.length,
	terminal,
	retryable_infrastructure: retryableInfrastructure,
	job_lifecycle: {
		observed: Boolean(jobResult),
		finished_at: jobResult?.finished_at ?? null,
		externally_incomplete: externallyIncomplete,
		stats: jobStats,
		reason: jobLifecycleReason,
	},
	invalid_reason: jobLifecycleReason,
	valid:
		!externallyIncomplete &&
		trials.length > 0 &&
		completed.length === trials.length &&
		completed.every(
			(trial) =>
				trial.within_100k_output_budget === true &&
				trial.configuration_valid !== false,
		),
	n_configuration_invalid: configurationInvalidTrials.length,
	n_web_search_contaminated: trials.filter(
		(trial) => trial.web_search_contaminated === true,
	).length,
	native_web_search_calls: totalNativeWebSearchCalls,
	n_evaluable: evaluable.length,
	invalid_trials: invalidTrials.map((trial) => ({
		trial: trial.trial,
		task: trial.task,
		reason: trial.invalid_reason,
	})),
	pass_at_1: evaluable.length ? passed / evaluable.length : null,
	passed,
	verifier_passed: verifierPassed,
	verifier_pass_at_1: completed.length
		? verifierPassed / completed.length
		: null,
	passes_per_100_tool_calls: totalToolCalls
		? (passed / totalToolCalls) * 100
		: null,
	totals: {
		tool_calls: totalToolCalls,
		native_web_search_calls: totalNativeWebSearchCalls,
		model_turns: attemptedSum("model_turns"),
		input_tokens: totalInputTokens,
		cached_input_tokens: attemptedSum("cached_input_tokens"),
		uncached_input_tokens: attemptedSum("uncached_input_tokens"),
		output_tokens: totalOutputTokens,
		uncached_plus_output_tokens: attemptedSum("uncached_plus_output_tokens"),
	},
	completed_totals: {
		tool_calls: completedSum("tool_calls"),
		native_web_search_calls: completedSum("native_web_search_calls"),
		model_turns: completedSum("model_turns"),
		input_tokens: completedSum("input_tokens"),
		cached_input_tokens: completedSum("cached_input_tokens"),
		uncached_input_tokens: completedSum("uncached_input_tokens"),
		output_tokens: completedSum("output_tokens"),
		uncached_plus_output_tokens: completedSum("uncached_plus_output_tokens"),
	},
	evaluable_totals: {
		tool_calls: evaluableSum("tool_calls"),
		native_web_search_calls: evaluableSum("native_web_search_calls"),
		model_turns: evaluableSum("model_turns"),
		input_tokens: evaluableSum("input_tokens"),
		cached_input_tokens: evaluableSum("cached_input_tokens"),
		uncached_input_tokens: evaluableSum("uncached_input_tokens"),
		output_tokens: evaluableSum("output_tokens"),
		uncached_plus_output_tokens: evaluableSum("uncached_plus_output_tokens"),
	},
	max_peak_context_tokens: trials.length
		? Math.max(...trials.map((trial) => trial.peak_context_tokens || 0))
		: null,
	within_100k_output_budget:
		trials.length > 0 &&
		trials.every((trial) => trial.within_100k_output_budget === true),
	per_pass: passed
		? {
				tool_calls: Number.isFinite(totalToolCalls)
					? totalToolCalls / passed
					: null,
				input_tokens: Number.isFinite(totalInputTokens)
					? totalInputTokens / passed
					: null,
				output_tokens: Number.isFinite(totalOutputTokens)
					? totalOutputTokens / passed
					: null,
			}
		: null,
	cost_usd: totalCost,
	cost_per_pass_usd: totalCost !== null && passed ? totalCost / passed : null,
	cost_per_million_tokens_usd:
		totalCost !== null && Number.isFinite(totalTokens) && totalTokens > 0
			? (totalCost / totalTokens) * 1_000_000
			: null,
	cost_per_million_output_tokens_usd:
		totalCost !== null &&
		Number.isFinite(totalOutputTokens) &&
		totalOutputTokens > 0
			? (totalCost / totalOutputTokens) * 1_000_000
			: null,
	cost_per_million_uncached_plus_output_tokens_usd:
		totalCost !== null && attemptedSum("uncached_plus_output_tokens")
			? (totalCost / attemptedSum("uncached_plus_output_tokens")) * 1_000_000
			: null,
	cost_note:
		totalCost === null
			? "Subscription-auth trajectories did not expose an authoritative per-run USD charge; no API-equivalent price was invented."
			: "Reported directly by Pier's normalized Codex trajectory metrics.",
	trials,
};
const output = resolve(job, "forge-summary.json");
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(output);
