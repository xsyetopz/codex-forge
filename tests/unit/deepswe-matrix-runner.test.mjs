import { describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import {
	parseArguments,
	runCampaign,
} from "../../benchmarks/deepswe/run-matrix.mjs";

const FULL_FAMILIES = {
	"gpt-5.6-luna": ["none", "low", "medium", "high", "xhigh", "max"],
	"gpt-5.6-terra": ["none", "low", "medium", "high", "xhigh", "max"],
	"gpt-5.6-sol": ["none", "low", "medium", "high", "xhigh"],
};

const completeSummary = (outputTokens = 10) => ({
	n_trials: 1,
	valid: true,
	terminal: true,
	retryable_infrastructure: false,
	within_100k_output_budget: true,
	pass_at_1: 1,
	verifier_pass_at_1: 1,
	cost_usd: 0.01,
	totals: {
		tool_calls: 2,
		model_turns: 3,
		input_tokens: 4,
		cached_input_tokens: 1,
		output_tokens: outputTokens,
		reasoning_output_tokens: 5,
	},
});

const retryableSummary = (outputTokens = 7) => ({
	...completeSummary(outputTokens),
	valid: false,
	terminal: false,
	retryable_infrastructure: true,
	pass_at_1: null,
	verifier_pass_at_1: null,
});

function createFakeBench({ families = { "gpt-5.6-luna": ["none"] } } = {}) {
	const directory = mkdtempSync(resolve(tmpdir(), "forge-matrix-runner-"));
	const bench = resolve(directory, "benchmarks/deepswe");
	mkdirSync(resolve(bench, "results/configs"), { recursive: true });
	mkdirSync(resolve(bench, "results/jobs"), { recursive: true });
	mkdirSync(resolve(bench, "results/manifests"), { recursive: true });
	writeFileSync(
		resolve(bench, "matrix.json"),
		JSON.stringify({
			schema: "test-matrix",
			codex_version: "0.150.1",
			families,
			excluded: { "gpt-5.6-sol": ["max", "ultra"] },
			arms: ["baseline", "forge-core"],
		}),
	);
	for (const name of ["tasks.json", "screening-tasks.json"])
		writeFileSync(resolve(bench, name), JSON.stringify({ tasks: ["task"] }));
	return { directory, bench };
}

function manifestFor(args, snapshot = "snapshot-a") {
	return {
		schema: "fake-startup-manifest.v1",
		run_id: args.runId,
		snapshot,
		selection: {
			arms: args.arms,
			models: args.models,
			efforts: args.efforts,
			tasks: args.tasks,
			token_budget: args.tokenBudget,
			trial_token_budget: args.trialTokenBudget,
			concurrency: args.concurrency,
		},
	};
}

function fakeCampaign({
	bench,
	runId,
	models = "gpt-5.6-luna",
	efforts = "none",
	arms = "baseline",
	tokenBudget = 25_000_000,
	snapshot = "snapshot-a",
	runPier = async () => {},
	prepareTask: customPrepareTask,
	summaryFor = () => completeSummary(),
	cleanupJob = async () => {},
	onGenerate = () => {},
	manifestBuilder: customManifestBuilder,
} = {}) {
	const manifestBuilder =
		customManifestBuilder || ((args) => manifestFor(args, snapshot));
	return runCampaign({
		root: resolve(bench, "../.."),
		bench,
		options: {
			"run-id": runId,
			models,
			efforts,
			arms,
			task: "task",
			"token-budget": String(tokenBudget),
			"trial-token-budget": "100000",
			concurrency: "1",
		},
		manifestBuilder,
		manifestCapturer(args) {
			const path = resolve(bench, "results/manifests", `${args.runId}.json`);
			writeFileSync(
				path,
				`${JSON.stringify(manifestBuilder(args), null, 2)}\n`,
			);
			return path;
		},
		prepareTask:
			customPrepareTask || (async () => resolve(bench, "fake-dataset")),
		generateConfig: async (_args, { jobName }) => {
			onGenerate(_args, jobName);
			const path = resolve(bench, "results/configs", `${jobName}.yaml`);
			writeFileSync(path, `job: ${jobName}\n`);
			return path;
		},
		runPier,
		cleanupJob,
		summarizeJob: async (job) => {
			const summary = await summaryFor(job);
			writeFileSync(
				resolve(job, "forge-summary.json"),
				`${JSON.stringify(summary, null, 2)}\n`,
			);
			return summary;
		},
		now: () => "2026-08-27T00:00:00.000Z",
	});
}

const campaignSummary = (bench, runId) =>
	JSON.parse(
		readFileSync(
			resolve(bench, "results/manifests", `${runId}.campaign-summary.json`),
			"utf8",
		),
	);

describe("DeepSWE full-matrix runner resilience", () => {
	test("accepts equals and spaced CLI values", () => {
		expect(
			parseArguments([
				"--run-id=campaign-r1",
				"--models",
				"gpt-5.6-luna,gpt-5.6-sol",
				"--task-set",
				"full",
			]),
		).toEqual({
			"run-id": "campaign-r1",
			models: "gpt-5.6-luna,gpt-5.6-sol",
			"task-set": "full",
		});
		expect(() => parseArguments(["campaign-r1"])).toThrow(
			"unexpected positional argument",
		);
	});

	test("records a middle Pier failure and continues later cells", async () => {
		const fixture = createFakeBench({
			families: { "gpt-5.6-luna": ["none", "low", "medium"] },
		});
		const calls = [];
		try {
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "middle-failure-r1",
				efforts: "none,low,medium",
				runPier: async ({ job }) => {
					calls.push(basename(job));
					if (basename(job).includes("-low-"))
						throw new Error("fake Pier failure");
				},
			});
			expect(exit).toBe(1);
			expect(calls).toHaveLength(3);
			const summary = campaignSummary(fixture.bench, "middle-failure-r1");
			expect(summary.cells.map((cell) => cell.arms[0].status)).toEqual([
				"complete",
				"pier_failed",
				"complete",
			]);
			expect(summary.cells.map((cell) => cell.status)).toEqual([
				"complete",
				"invalid",
				"complete",
			]);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("archives a retryable job with its config and resumes it", async () => {
		const fixture = createFakeBench();
		let phase = "retryable";
		const generatedArguments = [];
		try {
			expect(
				await fakeCampaign({
					bench: fixture.bench,
					runId: "retry-r1",
					summaryFor: () =>
						phase === "retryable" ? retryableSummary() : completeSummary(),
					onGenerate: (args) => generatedArguments.push(args),
				}),
			).toBe(1);
			phase = "complete";
			expect(
				await fakeCampaign({
					bench: fixture.bench,
					runId: "retry-r1",
					summaryFor: () => completeSummary(),
					onGenerate: (args) => generatedArguments.push(args),
				}),
			).toBe(0);
			const job = resolve(
				fixture.bench,
				"results/jobs/baseline-gpt-5.6-luna-none-retry-r1",
			);
			expect(existsSync(`${job}.retry-1/forge-summary.json`)).toBe(true);
			expect(existsSync(`${job}.retry-1/forge-config.yaml`)).toBe(true);
			const summary = campaignSummary(fixture.bench, "retry-r1");
			expect(summary.attempts.map((attempt) => attempt.status)).toEqual([
				"archived_retry",
				"complete",
			]);
			expect(summary.totals.output_tokens).toBe(17);
			expect(generatedArguments).toHaveLength(2);
			expect(generatedArguments[0]).toContain("--trial-token-budget=100000");
			expect(generatedArguments[1]).toContain("--trial-token-budget=99993");
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("skips a valid matching job without Pier or cleanup", async () => {
		const fixture = createFakeBench();
		try {
			expect(
				await fakeCampaign({ bench: fixture.bench, runId: "skip-r1" }),
			).toBe(0);
			expect(
				await fakeCampaign({
					bench: fixture.bench,
					runId: "skip-r1",
					runPier: async () => {
						throw new Error("Pier must stay idle");
					},
					cleanupJob: async () => {
						throw new Error("cleanup must stay idle");
					},
				}),
			).toBe(0);
			const summary = campaignSummary(fixture.bench, "skip-r1");
			expect(summary.attempts).toHaveLength(1);
			expect(summary.attempts[0].status).toBe("skipped_complete");
			expect(summary.cleanup.jobs_attempted).toBe(0);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("rejects a mixed startup snapshot before Pier", async () => {
		const fixture = createFakeBench();
		let pierCalls = 0;
		try {
			await fakeCampaign({ bench: fixture.bench, runId: "snapshot-r1" });
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "snapshot-r1",
				snapshot: "snapshot-b",
				runPier: async () => {
					pierCalls += 1;
				},
			});
			expect(exit).toBe(1);
			expect(pierCalls).toBe(0);
			const summary = campaignSummary(fixture.bench, "snapshot-r1");
			expect(summary.status).toBe("rejected_mixed_snapshot");
			expect(summary.cells[0].arms[0].status).toBe("invalid_snapshot");
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("rejects a changed generated config on resume", async () => {
		const fixture = createFakeBench();
		let pierCalls = 0;
		try {
			await fakeCampaign({ bench: fixture.bench, runId: "config-hash-r1" });
			writeFileSync(
				resolve(
					fixture.bench,
					"results/configs/baseline-gpt-5.6-luna-none-config-hash-r1.yaml",
				),
				"changed: true\n",
			);
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "config-hash-r1",
				runPier: async () => {
					pierCalls += 1;
				},
			});
			expect(exit).toBe(1);
			expect(pierCalls).toBe(0);
			const summary = campaignSummary(fixture.bench, "config-hash-r1");
			expect(summary.cells[0].arms[0].status).toBe("invalid_snapshot");
			expect(summary.cells[0].arms[0].invalid_reasons[0]).toContain(
				"config_sha256 does not match",
			);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("stops pending cells when the campaign output budget is reached", async () => {
		const fixture = createFakeBench({
			families: { "gpt-5.6-luna": ["none", "low", "medium"] },
		});
		let pierCalls = 0;
		try {
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "budget-r1",
				efforts: "none,low,medium",
				tokenBudget: 60,
				runPier: async () => {
					pierCalls += 1;
				},
				summaryFor: () => completeSummary(60),
			});
			expect(exit).toBe(1);
			expect(pierCalls).toBe(1);
			const summary = campaignSummary(fixture.bench, "budget-r1");
			expect(summary.status).toBe("budget_stopped");
			expect(summary.totals.output_tokens).toBe(60);
			expect(summary.cells.map((cell) => cell.arms[0].status)).toEqual([
				"complete",
				"not_run_budget",
				"not_run_budget",
			]);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("records one cleanup failure even when Pier requests cleanup", async () => {
		const fixture = createFakeBench();
		let cleanupCalls = 0;
		try {
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "cleanup-r1",
				runPier: async ({ cleanup }) => {
					await cleanup();
				},
				cleanupJob: async () => {
					cleanupCalls += 1;
					throw new Error("fake cleanup failure");
				},
			});
			expect(exit).toBe(1);
			expect(cleanupCalls).toBe(1);
			const summary = campaignSummary(fixture.bench, "cleanup-r1");
			expect(summary.cells[0].arms[0].status).toBe("cleanup_failed");
			expect(summary.cleanup).toMatchObject({
				jobs_attempted: 1,
				jobs_completed: 0,
				jobs_with_errors: 1,
			});
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("stops after source drift during a job and preserves cleanup artifacts", async () => {
		const fixture = createFakeBench({
			families: { "gpt-5.6-luna": ["none", "low", "medium"] },
		});
		const source = resolve(fixture.directory, "live-source.txt");
		writeFileSync(source, "snapshot-a\n");
		const liveManifest = (args) =>
			manifestFor(args, readFileSync(source, "utf8"));
		const pierCalls = [];
		const cleanedJobs = [];
		try {
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "drift-during-job-r1",
				efforts: "none,low,medium",
				manifestBuilder: liveManifest,
				runPier: async ({ job }) => {
					pierCalls.push(basename(job));
					writeFileSync(source, "snapshot-b\n");
				},
				cleanupJob: async (job) => {
					cleanedJobs.push(basename(job));
					writeFileSync(resolve(job, "cleanup-artifact.txt"), "cleaned\n");
					return { containers_verified: true };
				},
			});
			expect(exit).toBe(1);
			expect(pierCalls).toHaveLength(1);
			expect(cleanedJobs).toEqual(pierCalls);
			const summary = campaignSummary(fixture.bench, "drift-during-job-r1");
			expect(summary.status).toBe("rejected_mixed_snapshot");
			expect(summary.snapshot_drift.phase).toBe("after-execution");
			expect(summary.cells.map((cell) => cell.arms[0].status)).toEqual([
				"invalid_snapshot",
				"invalid_snapshot",
				"invalid_snapshot",
			]);
			const firstJob = resolve(
				fixture.bench,
				"results/jobs/",
				"baseline-gpt-5.6-luna-none-drift-during-job-r1",
			);
			expect(existsSync(resolve(firstJob, "forge-summary.json"))).toBe(true);
			expect(existsSync(resolve(firstJob, "cleanup-artifact.txt"))).toBe(true);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("stops before the next job when source drifts between jobs", async () => {
		const fixture = createFakeBench({
			families: { "gpt-5.6-luna": ["none", "low", "medium"] },
		});
		const source = resolve(fixture.directory, "live-source.txt");
		writeFileSync(source, "snapshot-a\n");
		const liveManifest = (args) =>
			manifestFor(args, readFileSync(source, "utf8"));
		let summaryCalls = 0;
		const pierCalls = [];
		try {
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "drift-between-jobs-r1",
				efforts: "none,low,medium",
				manifestBuilder: liveManifest,
				runPier: async ({ job }) => pierCalls.push(basename(job)),
				summaryFor: async (_job) => {
					summaryCalls += 1;
					const summary = completeSummary();
					if (summaryCalls === 1) writeFileSync(source, "snapshot-b\n");
					return summary;
				},
				cleanupJob: async (job) => {
					writeFileSync(resolve(job, "cleanup-artifact.txt"), "cleaned\n");
					return { containers_verified: true };
				},
			});
			expect(exit).toBe(1);
			expect(pierCalls).toHaveLength(1);
			const summary = campaignSummary(fixture.bench, "drift-between-jobs-r1");
			expect(summary.status).toBe("rejected_mixed_snapshot");
			expect(summary.snapshot_drift.phase).toBe("after-completion");
			expect(
				summary.cells
					.slice(1)
					.every((cell) =>
						cell.arms.every((arm) => arm.status === "invalid_snapshot"),
					),
			).toBe(true);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("records hashes for the prepared image and plugin inputs", async () => {
		const fixture = createFakeBench();
		const dataset = resolve(fixture.directory, "prepared-dataset");
		mkdirSync(resolve(dataset, "task"), { recursive: true });
		writeFileSync(
			resolve(dataset, "task", "task.toml"),
			'docker_image = "forge-image:abc123"\n',
		);
		try {
			expect(
				await fakeCampaign({
					bench: fixture.bench,
					runId: "prepared-inputs-r1",
					arms: "forge-core",
					prepareTask: async () => dataset,
				}),
			).toBe(0);
			const metadata = JSON.parse(
				readFileSync(
					resolve(
						fixture.bench,
						"results/jobs/forge-core-gpt-5.6-luna-none-prepared-inputs-r1/forge-job.json",
					),
					"utf8",
				),
			);
			expect(metadata.prepared_inputs.image_refs).toEqual([
				{ task: "task", image: "forge-image:abc123" },
			]);
			expect(metadata.prepared_inputs.plugin_tree_sha256).toBeNull();
			expect(metadata.prepared_inputs_sha256).toBe(
				metadata.prepared_inputs.sha256,
			);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});

	test("completes all 17 requested family cells and excludes Sol max", async () => {
		const fixture = createFakeBench({ families: FULL_FAMILIES });
		let pierCalls = 0;
		try {
			const exit = await fakeCampaign({
				bench: fixture.bench,
				runId: "full-17-r1",
				models: "gpt-5.6-luna,gpt-5.6-terra,gpt-5.6-sol",
				efforts: "none,low,medium,high,xhigh,max",
				runPier: async () => {
					pierCalls += 1;
				},
				summaryFor: () => completeSummary(1),
			});
			expect(exit).toBe(0);
			expect(pierCalls).toBe(17);
			const summary = campaignSummary(fixture.bench, "full-17-r1");
			expect(summary.requested_cell_count).toBe(17);
			expect(summary.cells).toHaveLength(17);
			expect(summary.cells.every((cell) => cell.status === "complete")).toBe(
				true,
			);
			const solEfforts = summary.cells
				.filter((cell) => cell.model === "gpt-5.6-sol")
				.map((cell) => cell.effort);
			expect(solEfforts).toEqual(["none", "low", "medium", "high", "xhigh"]);
			expect(solEfforts).not.toContain("max");
			expect(
				readdirSync(resolve(fixture.bench, "results/manifests")).some((name) =>
					name.endsWith(".tmp"),
				),
			).toBe(false);
		} finally {
			rmSync(fixture.directory, { recursive: true, force: true });
		}
	});
});
