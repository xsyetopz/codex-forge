#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { acquireJobLease } from "./job-lease.mjs";
import { runPierWithCleanup } from "./pier-lifecycle.mjs";
import {
	buildStartupManifest,
	captureStartupManifest,
	startupManifestFingerprint,
	startupManifestsMatch,
} from "./startup-manifest.mjs";

const root = resolve(import.meta.dir, "../..");
const bench = resolve(import.meta.dir);
const sha256 = (value) =>
	createHash("sha256")
		.update(typeof value === "string" ? value : JSON.stringify(value))
		.digest("hex");
const readJson = (path) => {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return null;
	}
};
const writeJson = (path, value) => {
	mkdirSync(resolve(path, ".."), { recursive: true });
	const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
	try {
		writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
			flag: "wx",
		});
		renameSync(temporary, path);
	} finally {
		rmSync(temporary, { force: true });
	}
};

export function parseArguments(arguments_) {
	const options = {};
	for (let index = 0; index < arguments_.length; index += 1) {
		const argument = arguments_[index];
		if (!argument.startsWith("--"))
			throw new Error(`unexpected positional argument: ${argument}`);
		const separator = argument.indexOf("=");
		if (separator >= 0) {
			options[argument.slice(2, separator)] = argument.slice(separator + 1);
			continue;
		}
		const next = arguments_[index + 1];
		if (next && !next.startsWith("--")) {
			options[argument.slice(2)] = next;
			index += 1;
		} else {
			options[argument.slice(2)] = true;
		}
	}
	return options;
}

const defaultRunCommand = (command, args, { cwd = root } = {}) => {
	const result = spawnSync(command, args, {
		cwd,
		encoding: "utf8",
		stdio: ["inherit", "pipe", "inherit"],
	});
	if (result.status !== 0) {
		const error = new Error(
			`${command} failed with ${result.status ?? "unknown status"}`,
		);
		error.status = result.status;
		throw error;
	}
	return result.stdout.trim();
};

const selected = (value) =>
	String(value || "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
const summaryOutputTokens = (summary) =>
	Number.isFinite(summary?.totals?.output_tokens)
		? summary.totals.output_tokens
		: 0;

function outputTokensByTask(summary, tasks) {
	const trials = Array.isArray(summary?.trials) ? summary.trials : [];
	if (trials.length) {
		const tokens = new Map();
		for (const task of tasks) {
			const matches = trials.filter((trial) => trial.task === task);
			if (
				!matches.length ||
				matches.some((trial) => !Number.isFinite(trial.output_tokens))
			)
				return null;
			tokens.set(
				task,
				matches.reduce((total, trial) => total + trial.output_tokens, 0),
			);
		}
		return tokens;
	}
	if (tasks.length === 1 && Number.isFinite(summary?.totals?.output_tokens))
		return new Map([[tasks[0], summary.totals.output_tokens]]);
	return null;
}

function remainingRetryBudget(summary, tasks, trialTokenBudget) {
	if (summary?.within_100k_output_budget !== true) return null;
	const prior = outputTokensByTask(summary, tasks);
	if (!prior) return null;
	return Math.min(
		trialTokenBudget,
		...tasks.map((task) => trialTokenBudget - prior.get(task)),
	);
}

function cumulativeOutputWithinBudget(
	priorSummary,
	currentSummary,
	tasks,
	trialTokenBudget,
) {
	const current = outputTokensByTask(currentSummary, tasks);
	if (!current || currentSummary?.within_100k_output_budget !== true)
		return false;
	if (!priorSummary)
		return tasks.every((task) => current.get(task) <= trialTokenBudget);
	const prior = outputTokensByTask(priorSummary, tasks);
	if (!prior) return false;
	return tasks.every(
		(task) => prior.get(task) + current.get(task) <= trialTokenBudget,
	);
}

function loadSelection({ options, matrix, taskSet, screeningTaskSet }) {
	const arms = selected(options.arms || process.env.ARMS);
	if (!arms.length) arms.push(...matrix.arms);
	const unknownArms = arms.filter((arm) => !matrix.arms.includes(arm));
	if (unknownArms.length)
		throw new Error(`unsupported benchmark arms: ${unknownArms.join(", ")}`);

	const models = selected(options.models || process.env.MODELS);
	const unknownModels = models.filter((model) => !(model in matrix.families));
	if (unknownModels.length)
		throw new Error(
			`unsupported benchmark models: ${unknownModels.join(", ")}`,
		);
	const efforts = selected(options.efforts || process.env.EFFORTS);
	const supportedEfforts = new Set(Object.values(matrix.families).flat());
	const unknownEfforts = efforts.filter(
		(effort) => !supportedEfforts.has(effort),
	);
	if (unknownEfforts.length)
		throw new Error(
			`unsupported reasoning efforts: ${unknownEfforts.join(", ")}`,
		);

	const task = options.task || process.env.TASK;
	const taskSetName =
		options["task-set"] || process.env.TASK_SET || "screening";
	if (!task && !["screening", "full"].includes(taskSetName))
		throw new Error(`unsupported task set: ${taskSetName}`);
	const tasks = task
		? [String(task)]
		: taskSetName === "full"
			? taskSet.tasks
			: screeningTaskSet.tasks;
	if (tasks.some((name) => !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)))
		throw new Error("selected tasks contain an invalid task name");
	const families = Object.entries(matrix.families)
		.filter(([model]) => !models.length || models.includes(model))
		.map(([model, available]) => [
			model,
			available.filter((effort) => !efforts.length || efforts.includes(effort)),
		])
		.filter(([, available]) => available.length);
	if (!families.length)
		throw new Error("MODELS/EFFORTS selected zero supported matrix cells");
	const schedule = Array.from(
		{ length: Math.max(...families.map(([, available]) => available.length)) },
		(_, index) =>
			families.flatMap(([model, available]) =>
				available[index] ? [[model, available[index]]] : [],
			),
	).flat();
	return {
		arms,
		models: models.length ? models : Object.keys(matrix.families),
		efforts: efforts.length
			? efforts
			: [...new Set(Object.values(matrix.families).flat())],
		task,
		tasks,
		schedule,
	};
}

const emptyCleanup = () => ({
	attempted: false,
	completed: false,
	error: null,
});
const emptyArm = (arm, taskCount) => ({
	arm,
	status: "pending",
	task_count: taskCount,
	valid: null,
	pass_at_1: null,
	verifier_pass_at_1: null,
	tool_calls: null,
	model_turns: null,
	input_tokens: null,
	cached_input_tokens: null,
	output_tokens: null,
	reasoning_tokens: null,
	cost_usd: null,
	invalid_reasons: [],
	cleanup: emptyCleanup(),
});

function buildCampaign({
	runId,
	selection,
	tokenBudget,
	trialTokenBudget,
	concurrency,
	manifestPath,
	manifest,
	startedAt,
}) {
	const cells = selection.schedule.map(([model, effort]) => ({
		model,
		effort,
		status: "pending",
		task_count: selection.tasks.length,
		arms: selection.arms.map((arm) => emptyArm(arm, selection.tasks.length)),
	}));
	return {
		schema: "codex-forge-deepswe-campaign.v1",
		run_id: runId,
		started_at_utc: startedAt,
		status: "running",
		manifest_path: manifestPath,
		manifest_sha256: startupManifestFingerprint(manifest),
		selection: {
			arms: selection.arms,
			models: selection.models,
			efforts: selection.efforts,
			tasks: selection.tasks,
			concurrency,
			token_budget: tokenBudget,
			trial_token_budget: trialTokenBudget,
		},
		requested_cell_count: cells.length,
		requested_job_count: cells.length * selection.arms.length,
		cells,
		attempts: [],
		totals: { output_tokens: 0 },
		cleanup: {
			jobs_attempted: 0,
			jobs_completed: 0,
			jobs_with_errors: 0,
			errors: [],
			containers_verified: null,
		},
	};
}

const cellFor = (campaign, model, effort) =>
	campaign.cells.find((cell) => cell.model === model && cell.effort === effort);
function recordArm(cell, arm, record) {
	Object.assign(
		cell.arms.find((item) => item.arm === arm),
		record,
	);
}

function statusFor(summary, { pierError, setupError, cleanupError } = {}) {
	if (setupError) return "invalid_setup";
	if (cleanupError) return "cleanup_failed";
	if (summary?.within_100k_output_budget !== true)
		return "over_budget_or_unknown";
	if (pierError)
		return summary?.retryable_infrastructure ? "retryable" : "pier_failed";
	if (summary?.valid === true) return "complete";
	if (summary?.terminal === true && summary?.retryable_infrastructure !== true)
		return "invalid_terminal";
	return "retryable";
}

function armRecord(summary, status, reason, cleanup = emptyCleanup()) {
	return {
		status,
		task_count: summary?.n_trials ?? 0,
		valid:
			status === "complete"
				? true
				: status === "invalid_snapshot"
					? false
					: (summary?.valid ?? false),
		pass_at_1: summary?.pass_at_1 ?? null,
		verifier_pass_at_1: summary?.verifier_pass_at_1 ?? null,
		tool_calls: summary?.totals?.tool_calls ?? null,
		model_turns: summary?.totals?.model_turns ?? null,
		input_tokens: summary?.totals?.input_tokens ?? null,
		cached_input_tokens: summary?.totals?.cached_input_tokens ?? null,
		output_tokens: summary?.totals?.output_tokens ?? null,
		reasoning_tokens: summary?.totals?.reasoning_output_tokens ?? null,
		cost_usd: summary?.cost_usd ?? null,
		invalid_reasons: [
			reason,
			...(summary?.invalid_trials || []).map(
				(trial) => `${trial.task || trial.trial}: ${trial.reason || "invalid"}`,
			),
		].filter(Boolean),
		cleanup,
		job_summary: summary?.job || null,
	};
}

function expectedJobMetadata({
	runId,
	model,
	effort,
	arm,
	selection,
	manifest,
	configPath,
	preparedInputs,
}) {
	const metadata = {
		schema: "codex-forge-deepswe-job.v1",
		run_id: runId,
		model,
		effort,
		arm,
		tasks: selection.tasks,
		manifest_sha256: startupManifestFingerprint(manifest),
		config_sha256: sha256(readFileSync(configPath)),
		config_path: configPath,
		config_snapshot: "forge-config.yaml",
	};
	if (preparedInputs) {
		metadata.prepared_inputs = preparedInputs;
		metadata.prepared_inputs_sha256 = preparedInputs.sha256;
	}
	return metadata;
}

function verifyExistingJobMetadata(job, expected) {
	const metadata = readJson(resolve(job, "forge-job.json"));
	if (!metadata)
		throw new Error(
			`${job} is missing forge-job.json; snapshot cannot be verified`,
		);
	for (const key of [
		"run_id",
		"model",
		"effort",
		"arm",
		"manifest_sha256",
		"config_sha256",
	])
		if (metadata[key] !== expected[key])
			throw new Error(`${job} mixed snapshot: forge-job.${key} does not match`);
	if (
		expected.prepared_inputs_sha256 !== undefined &&
		metadata.prepared_inputs_sha256 !== expected.prepared_inputs_sha256
	)
		throw new Error(`${job} mixed snapshot: prepared inputs do not match`);
	if (JSON.stringify(metadata.tasks) !== JSON.stringify(expected.tasks))
		throw new Error(`${job} mixed snapshot: selected tasks do not match`);
	if (metadata.config_snapshot !== undefined) {
		if (metadata.config_snapshot !== "forge-config.yaml")
			throw new Error(`${job} mixed snapshot: invalid config snapshot path`);
		const snapshot = resolve(job, metadata.config_snapshot);
		if (
			!existsSync(snapshot) ||
			sha256(readFileSync(snapshot)) !== expected.config_sha256
		)
			throw new Error(`${job} mixed snapshot: config snapshot does not match`);
	}
	return metadata;
}

function preparedInputSnapshot({ arm, dataset, tasks, manifest }) {
	if (arm !== "forge-core" || !dataset) return null;
	const taskFiles = [];
	const imageRefs = [];
	for (const task of tasks) {
		const taskToml = resolve(dataset, task, "task.toml");
		if (!existsSync(taskToml)) continue;
		const contents = readFileSync(taskToml, "utf8");
		const match = contents.match(/^docker_image\s*=\s*"([^"]+)"/m);
		taskFiles.push({
			task,
			sha256: sha256(contents),
		});
		if (match) imageRefs.push({ task, image: match[1] });
	}
	const pluginTreeSha256 =
		manifest?.source_trees?.["plugins/codex-forge"]?.sha256 ?? null;
	const material = {
		image_refs: imageRefs,
		task_files: taskFiles,
		plugin_tree_sha256: pluginTreeSha256,
	};
	return {
		...material,
		sha256: sha256(material),
	};
}

function nextRetryPath(job) {
	for (let attempt = 1; ; attempt += 1) {
		const path = `${job}.retry-${attempt}`;
		if (!existsSync(path)) return path;
	}
}

async function defaultSummarize(job, { runCommand }) {
	return readJson(runCommand("bun", [resolve(bench, "summarize.mjs"), job]));
}
async function defaultCleanup(job, { runCommand }) {
	const output = runCommand("bun", [resolve(bench, "cleanup-job.mjs"), job]);
	return JSON.parse(output);
}

function aggregateCellStatus(cell) {
	if (cell.arms.every((arm) => arm.status === "complete")) return "complete";
	if (cell.arms.every((arm) => arm.status === "pending")) return "pending";
	if (cell.arms.some((arm) => arm.status === "not_run_budget"))
		return "not_run_budget";
	return "invalid";
}

/** Run a matched DeepSWE campaign; injected operations provide fake-Pier tests. */
export async function runCampaign({
	root: campaignRoot = root,
	bench: campaignBench = bench,
	options = parseArguments(process.argv.slice(2)),
	runCommand = defaultRunCommand,
	runPier,
	prepareTask,
	generateConfig,
	summarizeJob,
	cleanupJob,
	manifestBuilder = buildStartupManifest,
	manifestCapturer = captureStartupManifest,
	now = () => new Date().toISOString(),
} = {}) {
	const supportedOptions = new Set([
		"run-id",
		"token-budget",
		"trial-token-budget",
		"concurrency",
		"arms",
		"models",
		"efforts",
		"task",
		"task-set",
	]);
	const unknownOptions = Object.keys(options).filter(
		(option) => !supportedOptions.has(option),
	);
	if (unknownOptions.length)
		throw new Error(`unsupported runner options: ${unknownOptions.join(", ")}`);
	const matrix = JSON.parse(
		readFileSync(resolve(campaignBench, "matrix.json"), "utf8"),
	);
	const taskSet = JSON.parse(
		readFileSync(resolve(campaignBench, "tasks.json"), "utf8"),
	);
	const screeningTaskSet = JSON.parse(
		readFileSync(resolve(campaignBench, "screening-tasks.json"), "utf8"),
	);
	const selection = loadSelection({
		options,
		matrix,
		taskSet,
		screeningTaskSet,
	});
	const runId = String(
		options["run-id"] || process.env.RUN_ID || now().replace(/[:.]/g, "-"),
	).replace(/[^a-zA-Z0-9._-]/g, "-");
	const tokenBudget = Number(
		options["token-budget"] || process.env.TOKEN_BUDGET || 25_000_000,
	);
	const trialTokenBudget = Number(
		options["trial-token-budget"] || process.env.TRIAL_TOKEN_BUDGET || 100_000,
	);
	const concurrency = Number(
		options.concurrency || process.env.TRIAL_CONCURRENCY || 1,
	);
	if (
		!Number.isInteger(trialTokenBudget) ||
		trialTokenBudget < 10_000 ||
		trialTokenBudget > 100_000
	)
		throw new Error(
			"trial-token-budget must be an integer from 10000 through 100000",
		);
	if (!Number.isInteger(tokenBudget) || tokenBudget <= 0)
		throw new Error("token-budget must be a positive integer");
	if (!Number.isInteger(concurrency) || concurrency <= 0)
		throw new Error("concurrency must be a positive integer");
	if (!selection.tasks.length) throw new Error("selected task set is empty");

	const manifestArgs = {
		root: campaignRoot,
		bench: campaignBench,
		runId,
		matrix,
		arms: selection.arms,
		models: selection.models,
		efforts: selection.efforts,
		tasks: selection.tasks,
		tokenBudget,
		trialTokenBudget,
		concurrency: String(concurrency),
	};
	const manifestPath = resolve(
		campaignBench,
		"results/manifests",
		`${runId}.json`,
	);
	const manifestExists = existsSync(manifestPath);
	const existingManifest = manifestExists ? readJson(manifestPath) : null;
	const currentManifest = manifestBuilder(manifestArgs);
	const campaign = buildCampaign({
		runId,
		selection,
		tokenBudget,
		trialTokenBudget,
		concurrency: String(concurrency),
		manifestPath,
		manifest: currentManifest,
		startedAt: now(),
	});
	const campaignPath = resolve(
		campaignBench,
		"results/manifests",
		`${runId}.campaign-summary.json`,
	);
	const writeCampaign = () => {
		for (const cell of campaign.cells) cell.status = aggregateCellStatus(cell);
		campaign.updated_at_utc = now();
		writeJson(campaignPath, campaign);
	};

	if (
		(manifestExists && !existingManifest) ||
		(existingManifest &&
			!startupManifestsMatch(existingManifest, currentManifest))
	) {
		campaign.status = "rejected_mixed_snapshot";
		campaign.error =
			manifestExists && !existingManifest
				? "existing RUN_ID startup manifest is unreadable"
				: "startup manifest/source/config selection differs from the existing RUN_ID";
		for (const cell of campaign.cells)
			for (const arm of cell.arms)
				recordArm(
					cell,
					arm.arm,
					armRecord(null, "invalid_snapshot", campaign.error),
				);
		writeCampaign();
		return 1;
	}
	if (!existingManifest) manifestCapturer(manifestArgs);

	let tokensUsed = 0;
	let stopReason = null;
	let snapshotDrift = null;
	const inspectLiveSnapshot = (phase) => {
		try {
			const observed = manifestBuilder(manifestArgs);
			if (startupManifestsMatch(currentManifest, observed)) return null;
			return {
				phase,
				expected_sha256: startupManifestFingerprint(currentManifest),
				observed_sha256: startupManifestFingerprint(observed),
				reason: `startup source snapshot drift during ${phase}`,
			};
		} catch (error) {
			return {
				phase,
				expected_sha256: startupManifestFingerprint(currentManifest),
				observed_sha256: null,
				reason: `startup source snapshot could not be read during ${phase}: ${error.message}`,
			};
		}
	};
	const markSnapshotDrift = ({ detail, cell, arm, summary = null }) => {
		if (!snapshotDrift) {
			snapshotDrift = detail;
			stopReason = `${detail.reason} (expected ${detail.expected_sha256}, observed ${detail.observed_sha256 ?? "unreadable"})`;
			campaign.error = stopReason;
			campaign.snapshot_drift = detail;
		}
		if (cell && arm) {
			recordArm(cell, arm, armRecord(summary, "invalid_snapshot", stopReason));
		}
		for (const pendingCell of campaign.cells)
			for (const pendingArm of pendingCell.arms)
				if (pendingArm.status === "pending")
					recordArm(
						pendingCell,
						pendingArm.arm,
						armRecord(null, "invalid_snapshot", `not run: ${stopReason}`),
					);
	};
	const assertLiveSnapshot = (phase, cell, arm) => {
		const detail = inspectLiveSnapshot(phase);
		if (!detail) return;
		markSnapshotDrift({ detail, cell, arm });
		const error = new Error(stopReason);
		error.snapshotDrift = detail;
		throw error;
	};
	const runPierOperation = runPier || ((args) => runPierWithCleanup(args));
	const summarizeOperation =
		summarizeJob || ((job, context) => defaultSummarize(job, context));
	const cleanupOperation =
		cleanupJob || ((job, context) => defaultCleanup(job, context));
	const prepareOperation =
		prepareTask ||
		((taskName) =>
			runCommand(
				"bun",
				[
					resolve(campaignBench, "prepare-forge-task.mjs"),
					`--task=${taskName}`,
				],
				{ cwd: campaignRoot },
			));
	const generateOperation =
		generateConfig ||
		((args) =>
			runCommand(
				"bun",
				[resolve(campaignBench, "generate-config.mjs"), ...args],
				{ cwd: campaignRoot },
			));

	const performCleanup = async (job, jobName) => {
		campaign.cleanup.jobs_attempted += 1;
		try {
			const cleanup = await cleanupOperation(job, { runCommand, campaignRoot });
			campaign.cleanup.jobs_completed += 1;
			if (cleanup?.containers_verified === true)
				campaign.cleanup.containers_verified =
					campaign.cleanup.containers_verified !== false;
			return { attempted: true, completed: true, error: null };
		} catch (error) {
			campaign.cleanup.jobs_with_errors += 1;
			campaign.cleanup.errors.push({ job: jobName, reason: error.message });
			campaign.cleanup.containers_verified = false;
			return { attempted: true, completed: false, error: error.message };
		}
	};

	outer: for (const [model, effort] of selection.schedule) {
		for (const arm of selection.arms) {
			if (tokensUsed >= tokenBudget) {
				stopReason = `campaign output-token budget reached (${tokensUsed}/${tokenBudget})`;
				break outer;
			}
			const cell = cellFor(campaign, model, effort);
			const beforeJobDrift = inspectLiveSnapshot("before-job");
			if (beforeJobDrift) {
				markSnapshotDrift({ detail: beforeJobDrift });
				break outer;
			}
			const jobName = `${arm}-${model}-${effort}-${runId}`;
			const job = resolve(campaignBench, "results/jobs", jobName);
			const jobExistedAtStart = existsSync(job);
			const summaryPath = resolve(job, "forge-summary.json");
			const summaryExistedAtStart = existsSync(summaryPath);
			let existingSummary = readJson(summaryPath);
			mkdirSync(resolve(campaignBench, "results/jobs"), { recursive: true });
			let lease;
			try {
				lease = acquireJobLease(job);
			} catch (error) {
				recordArm(
					cell,
					arm,
					armRecord(existingSummary, "active_lease_rejected", error.message),
				);
				campaign.attempts.push({
					job: jobName,
					status: "active_lease_rejected",
					error: error.message,
					summary: existingSummary,
				});
				writeCampaign();
				continue;
			}

			let archivedRetry = null;
			let priorRetrySummary = null;
			let effectiveTrialTokenBudget = trialTokenBudget;
			let preparedInputs = null;
			try {
				if (summaryExistedAtStart && !existingSummary)
					throw new Error(
						`${job} mixed snapshot: forge-summary.json is unreadable`,
					);
				if (jobExistedAtStart && !existingSummary) {
					existingSummary = await summarizeOperation(job, {
						runCommand,
						campaignRoot,
						campaignBench,
					});
					if (!existingSummary)
						throw new Error(`${job} existing job could not be summarized`);
				}
				if (existingSummary) {
					const existingConfig = resolve(
						campaignBench,
						"results/configs",
						`${jobName}.yaml`,
					);
					if (!existsSync(existingConfig))
						throw new Error(
							`${job} mixed snapshot: generated config is missing`,
						);
					verifyExistingJobMetadata(
						job,
						expectedJobMetadata({
							runId,
							model,
							effort,
							arm,
							selection,
							manifest: existingManifest || currentManifest,
							configPath: existingConfig,
						}),
					);
					if (
						existingSummary.n_trials === selection.tasks.length &&
						existingSummary.valid === true &&
						existingSummary.within_100k_output_budget === true
					) {
						tokensUsed += summaryOutputTokens(existingSummary);
						recordArm(cell, arm, armRecord(existingSummary, "complete", null));
						campaign.attempts.push({
							job: jobName,
							status: "skipped_complete",
							archive: null,
							summary: existingSummary,
						});
						continue;
					}
					tokensUsed += summaryOutputTokens(existingSummary);
					if (
						existingSummary.retryable_infrastructure !== true &&
						existingSummary.job_lifecycle?.externally_incomplete !== true
					) {
						const status = statusFor(existingSummary);
						recordArm(
							cell,
							arm,
							armRecord(
								existingSummary,
								status,
								"existing terminal outcome retained",
							),
						);
						campaign.attempts.push({
							job: jobName,
							status: "skipped_terminal",
							archive: null,
							summary: existingSummary,
						});
						continue;
					}
					if (tokensUsed >= tokenBudget) {
						stopReason = `campaign output-token budget reached (${tokensUsed}/${tokenBudget}) before retry`;
						recordArm(
							cell,
							arm,
							armRecord(existingSummary, "not_run_budget", stopReason),
						);
						campaign.attempts.push({
							job: jobName,
							status: "not_run_budget",
							error: stopReason,
							summary: existingSummary,
						});
						break outer;
					}
					effectiveTrialTokenBudget = remainingRetryBudget(
						existingSummary,
						selection.tasks,
						trialTokenBudget,
					);
					if (
						effectiveTrialTokenBudget === null ||
						effectiveTrialTokenBudget < 10_000
					) {
						const reason =
							effectiveTrialTokenBudget === null
								? "retry output-token history unavailable; cumulative task budget is unverified"
								: `retry task budget has only ${effectiveTrialTokenBudget} output tokens remaining`;
						recordArm(
							cell,
							arm,
							armRecord(existingSummary, "over_budget_or_unknown", reason),
						);
						campaign.attempts.push({
							job: jobName,
							status: "skipped_unverified_retry_budget",
							error: reason,
							summary: existingSummary,
						});
						continue;
					}
					priorRetrySummary = existingSummary;

					const retryCleanup = await performCleanup(job, jobName);
					if (!retryCleanup.completed) {
						recordArm(
							cell,
							arm,
							armRecord(
								existingSummary,
								"cleanup_failed",
								retryCleanup.error,
								retryCleanup,
							),
						);
						campaign.attempts.push({
							job: jobName,
							status: "cleanup_failed",
							error: retryCleanup.error,
							summary: existingSummary,
						});
						continue;
					}
					const configSnapshot = resolve(job, "forge-config.yaml");
					if (!existsSync(configSnapshot))
						copyFileSync(existingConfig, configSnapshot);
					archivedRetry = nextRetryPath(job);
					renameSync(job, archivedRetry);
					campaign.attempts.push({
						job: jobName,
						status: "archived_retry",
						archive: archivedRetry,
						summary: existingSummary,
					});
				}

				assertLiveSnapshot("before-preparation", cell, arm);
				let dataset;
				if (arm === "forge-core")
					for (const taskName of selection.tasks)
						dataset = await prepareOperation(taskName, {
							campaignRoot,
							campaignBench,
						});
				preparedInputs = preparedInputSnapshot({
					arm,
					dataset,
					tasks: selection.tasks,
					manifest: currentManifest,
				});
				assertLiveSnapshot("after-preparation", cell, arm);
				const configArgs = [
					`--arm=${arm}`,
					`--model=${model}`,
					`--effort=${effort}`,
					`--concurrency=${concurrency}`,
					`--run-id=${runId}`,
					`--trial-token-budget=${effectiveTrialTokenBudget}`,
				];
				if (dataset) configArgs.push(`--dataset=${dataset}`);
				if (selection.task) configArgs.push(`--task=${selection.task}`);
				else configArgs.push(`--tasks=${selection.tasks.join(",")}`);
				const configPath = await generateOperation(configArgs, {
					campaignRoot,
					campaignBench,
					jobName,
				});
				mkdirSync(job, { recursive: true });
				copyFileSync(configPath, resolve(job, "forge-config.yaml"));
				writeJson(
					resolve(job, "forge-job.json"),
					expectedJobMetadata({
						runId,
						model,
						effort,
						arm,
						selection,
						manifest: currentManifest,
						configPath,
						preparedInputs,
					}),
				);

				assertLiveSnapshot("before-execution", cell, arm);
				let cleanupPromise;
				const cleanupOnce = () => {
					cleanupPromise ||= performCleanup(job, jobName);
					return cleanupPromise;
				};
				let pierError = null;
				try {
					await runPierOperation({
						args: ["run", "-c", configPath],
						cwd: campaignRoot,
						env: process.env,
						cleanup: cleanupOnce,
						job,
					});
				} catch (error) {
					pierError = error;
				}
				const cleanupResult = await cleanupOnce();
				const afterExecutionDrift = inspectLiveSnapshot("after-execution");
				let summary = null;
				let summaryError = null;
				try {
					summary = await summarizeOperation(job, {
						runCommand,
						campaignRoot,
						campaignBench,
					});
				} catch (error) {
					summaryError = error;
				}
				const afterCompletionDrift = inspectLiveSnapshot("after-completion");
				const observedDrift = afterExecutionDrift || afterCompletionDrift;
				const setupError = summaryError
					? `summary failed: ${summaryError.message}`
					: null;
				let reason =
					[pierError?.message, setupError, cleanupResult.error]
						.filter(Boolean)
						.join("; ") || null;
				let status = statusFor(summary, {
					pierError,
					setupError,
					cleanupError: cleanupResult.error,
				});
				if (observedDrift) {
					markSnapshotDrift({
						detail: observedDrift,
						cell,
						arm,
						summary,
					});
					status = "invalid_snapshot";
					reason = [reason, stopReason].filter(Boolean).join("; ");
				}
				if (
					status === "complete" &&
					!cumulativeOutputWithinBudget(
						priorRetrySummary,
						summary,
						selection.tasks,
						trialTokenBudget,
					)
				) {
					status = "over_budget_or_unknown";
					reason = [
						reason,
						"cumulative per-task output-token budget exceeded or unverified",
					]
						.filter(Boolean)
						.join("; ");
				}
				tokensUsed += summaryOutputTokens(summary);
				recordArm(cell, arm, armRecord(summary, status, reason, cleanupResult));
				campaign.attempts.push({
					job: jobName,
					status,
					archive: archivedRetry,
					pier_error: pierError?.message || null,
					summary_error: summaryError?.message || null,
					summary,
				});
				if (observedDrift) break outer;
			} catch (error) {
				const status =
					error.snapshotDrift || /mixed snapshot/i.test(error.message)
						? "invalid_snapshot"
						: "invalid_setup";
				recordArm(cell, arm, armRecord(existingSummary, status, error.message));
				campaign.attempts.push({
					job: jobName,
					status,
					error: error.message,
					summary: existingSummary,
				});
				if (error.snapshotDrift) break outer;
			} finally {
				lease.release();
				campaign.totals.output_tokens = tokensUsed;
				writeCampaign();
			}
		}
	}

	if (snapshotDrift) {
		campaign.stop_reason = stopReason;
		campaign.status = "rejected_mixed_snapshot";
	} else if (stopReason) {
		campaign.stop_reason = stopReason;
		for (const cell of campaign.cells)
			for (const arm of cell.arms)
				if (arm.status === "pending") {
					arm.status = "not_run_budget";
					arm.valid = false;
					arm.invalid_reasons = [stopReason];
				}
	}
	campaign.totals.output_tokens = tokensUsed;
	for (const cell of campaign.cells) cell.status = aggregateCellStatus(cell);
	if (snapshotDrift) campaign.status = "rejected_mixed_snapshot";
	else if (stopReason || tokensUsed > tokenBudget)
		campaign.status = "budget_stopped";
	else if (campaign.cells.every((cell) => cell.status === "complete"))
		campaign.status = "complete";
	else campaign.status = "invalid";
	campaign.finished_at_utc = now();
	writeCampaign();
	return campaign.status === "complete" ? 0 : 1;
}

if (import.meta.main) {
	try {
		process.exitCode = await runCampaign();
	} catch (error) {
		process.stderr.write(`[deepswe] ${error.message}\n`);
		process.exitCode = 1;
	}
}
