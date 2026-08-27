import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { TOML } from "bun";
import { captureStartupManifest } from "../../benchmarks/deepswe/startup-manifest.mjs";

const root = resolve(import.meta.dir, "../..");
const bench = resolve(root, "benchmarks/deepswe");

describe("DeepSWE matrix", () => {
	test("rejects task traversal before touching the output dataset", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-task-path-"));
		try {
			const source = resolve(temp, "source");
			const output = resolve(temp, "output", "selected");
			const escapedSource = resolve(source, "..", "escaped-task");
			const escapedOutput = resolve(output, "..", "escaped-task");
			mkdirSync(escapedSource, { recursive: true });
			mkdirSync(escapedOutput, { recursive: true });
			writeFileSync(
				resolve(escapedSource, "task.toml"),
				'docker_image = "unused"\n',
			);
			const marker = resolve(escapedOutput, "user-owned.txt");
			writeFileSync(marker, "preserve\n");
			const result = spawnSync(
				"bun",
				[
					resolve(bench, "prepare-forge-task.mjs"),
					"--task=../escaped-task",
					`--dataset=${source}`,
					`--output=${output}`,
				],
				{ encoding: "utf8", timeout: 2_000 },
			);
			expect(result.status).not.toBe(0);
			expect(result.stderr).toContain("Invalid task name");
			expect(readFileSync(marker, "utf8")).toBe("preserve\n");
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("captures an atomic startup manifest before benchmark preflight", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-manifest-"));
		try {
			const matrix = JSON.parse(
				readFileSync(resolve(bench, "matrix.json"), "utf8"),
			);
			const output = captureStartupManifest({
				root,
				bench,
				runId: "bounded-startup-r1",
				matrix,
				arms: ["forge-core"],
				models: ["gpt-5.6-luna"],
				efforts: ["none"],
				tasks: ["actionlint-action-pinning-lint"],
				tokenBudget: 25_000_000,
				trialTokenBudget: 100_000,
				concurrency: "1",
				outputDirectory: temp,
			});
			const manifest = JSON.parse(readFileSync(output, "utf8"));
			expect(manifest.captured_before_preflight).toBe(true);
			expect(manifest.selection.trial_token_budget).toBe(100_000);
			expect(manifest.config_audit).toEqual({
				schema: "codex-forge.deepswe-config-audit.v1",
				matched_arms: {
					baseline: {
						web_search: "disabled",
						egress_hint_url: "https://chatgpt.com/backend-api/ps/mcp",
						egress_hint_enabled: false,
					},
					"forge-core": {
						web_search: "disabled",
						egress_hint_url: "https://chatgpt.com/backend-api/ps/mcp",
						egress_hint_enabled: false,
					},
				},
				legacy_flags_absent: [
					"multi_agent",
					"multi_agent_v2",
					"features.hooks",
				],
				forge_catalog_tool_type: {
					web_search_tool_type: "text_and_image",
					apply_patch_tool_type: "freeform",
				},
			});
			expect(manifest.catalog_contract).toEqual({
				"gpt-5.6-luna": {
					present: true,
					multi_agent_version: "v1",
					use_responses_lite: false,
					web_search_tool_type: "text_and_image",
					apply_patch_tool_type: "freeform",
				},
				"gpt-5.6-terra": {
					present: true,
					multi_agent_version: "v1",
					use_responses_lite: false,
					web_search_tool_type: "text_and_image",
					apply_patch_tool_type: "freeform",
				},
				"gpt-5.6-sol": {
					present: true,
					multi_agent_version: "v1",
					use_responses_lite: false,
					web_search_tool_type: "text_and_image",
					apply_patch_tool_type: "freeform",
				},
			});
			expect(
				manifest.sources["plugins/codex-forge/assets/model-catalog.json"]
					.sha256,
			).toHaveLength(64);
			expect(manifest.source_trees["plugins/codex-forge"]).toMatchObject({
				files: expect.any(Number),
				bytes: expect.any(Number),
			});
			expect(manifest.source_trees["plugins/codex-forge"].sha256).toHaveLength(
				64,
			);
			expect(readFileSync(resolve(bench, "run-matrix.mjs"), "utf8")).toContain(
				"captureStartupManifest",
			);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("keeps all families together and excludes Sol max/ultra", () => {
		const matrix = JSON.parse(
			readFileSync(resolve(bench, "matrix.json"), "utf8"),
		);
		expect(Object.keys(matrix.families).sort()).toEqual([
			"gpt-5.6-luna",
			"gpt-5.6-sol",
			"gpt-5.6-terra",
		]);
		expect(matrix.families["gpt-5.6-sol"]).toEqual([
			"none",
			"low",
			"medium",
			"high",
			"xhigh",
		]);
		expect(matrix.excluded["gpt-5.6-sol"]).toEqual(["max", "ultra"]);
		const screening = JSON.parse(
			readFileSync(resolve(bench, "screening-tasks.json"), "utf8"),
		);
		expect(screening.tasks).toHaveLength(4);
	});

	test("generates matched stock-Codex arms with subscription egress and cleanup", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-"));
		try {
			const dataset = resolve(temp, "tasks");
			const task = "actionlint-action-pinning-lint";
			mkdirSync(resolve(dataset, task), { recursive: true });
			const auth = resolve(temp, "auth.json");
			writeFileSync(auth, "{}\n");
			const baselineOutput = resolve(temp, "baseline.yaml");
			const baselineResult = spawnSync(
				"bun",
				[
					resolve(bench, "generate-config.mjs"),
					"--arm=baseline",
					"--model=gpt-5.6-luna",
					"--effort=xhigh",
					"--concurrency=2",
					`--dataset=${dataset}`,
					`--auth=${auth}`,
					`--task=${task}`,
					`--output=${baselineOutput}`,
				],
				{ encoding: "utf8" },
			);
			expect(baselineResult.status).toBe(0);
			const baselineYaml = readFileSync(baselineOutput, "utf8");
			expect(baselineYaml).not.toContain("model_instructions_file");
			expect(baselineYaml).not.toContain("model_catalog_json");
			const output = resolve(temp, "forge.yaml");
			const result = spawnSync(
				"bun",
				[
					resolve(bench, "generate-config.mjs"),
					"--arm=forge-core",
					"--model=gpt-5.6-luna",
					"--effort=xhigh",
					"--concurrency=2",
					`--dataset=${dataset}`,
					`--auth=${auth}`,
					`--task=${task}`,
					`--output=${output}`,
				],
				{ encoding: "utf8" },
			);
			expect(result.status).toBe(0);
			const yaml = readFileSync(output, "utf8");
			const configToml = (text) => {
				const marker = "    config_toml: |\n";
				const start = text.indexOf(marker);
				expect(start).toBeGreaterThanOrEqual(0);
				return text
					.slice(start + marker.length)
					.split("\n")
					.filter((line) => line.startsWith("        "))
					.map((line) => line.slice(8))
					.join("\n");
			};
			const baselineConfig = TOML.parse(configToml(baselineYaml));
			const forgeConfig = TOML.parse(configToml(yaml));
			expect(baselineConfig.web_search).toBe("disabled");
			expect(forgeConfig.web_search).toBe("disabled");
			expect(baselineConfig.web_search).toBe(forgeConfig.web_search);
			expect(baselineYaml).not.toContain("web_search_request");
			expect(yaml).not.toContain("web_search_request");
			expect(baselineYaml.indexOf('web_search = "disabled"')).toBeLessThan(
				baselineYaml.indexOf("[mcp_servers.pier_egress_hint]"),
			);
			expect(yaml.indexOf('web_search = "disabled"')).toBeLessThan(
				yaml.indexOf("[mcp_servers.pier_egress_hint]"),
			);
			expect(yaml).toContain("version: 0.150.1");
			expect(yaml).toContain("reasoning_effort: xhigh");
			expect(yaml).toContain("n_concurrent_trials: 2");
			expect(yaml).toContain(
				"output-token ceiling for this benchmark trial is 100000",
			);
			expect(yaml).not.toContain("model_context_window");
			expect(yaml).toContain(
				'model_instructions_file = "/opt/codex-forge-plugin/plugins/codex-forge/assets/model-instructions.md"',
			);
			expect(yaml).toContain(
				'model_catalog_json = "/opt/codex-forge-plugin/plugins/codex-forge/assets/model-catalog.json"',
			);
			expect(yaml).toContain("Codex Forge is active");
			expect(yaml).toContain("[agents]");
			expect(yaml).not.toContain("multi_agent =");
			expect(yaml).not.toContain("multi_agent_v2");
			expect(yaml).toContain("[agents.forge-worker]");
			expect(yaml).toContain("agents/forge-worker.toml");
			expect(yaml).toContain("experimental_compact_prompt_file");
			expect(yaml).toContain("skills_dir:");
			expect(yaml).not.toContain("  mounts:");
			expect(yaml).toContain("chatgpt.com/backend-api/ps/mcp");
			expect(yaml).toContain("delete: true");
			expect(yaml).not.toContain("[hooks]");
			expect(yaml).not.toContain("features.hooks");
			expect(baselineYaml).not.toMatch(/(?:^|\n)\s*multi_agent(?:\s|=)/);
			expect(baselineYaml).not.toContain("multi_agent_v2");
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("bakes Forge hooks into managed task requirements", () => {
		const prepare = readFileSync(
			resolve(bench, "prepare-forge-task.mjs"),
			"utf8",
		);
		expect(prepare).toContain(
			'readFileSync(resolve(plugin, "hooks/hooks.json"',
		);
		expect(prepare).toContain("Object.entries(manifest.hooks ?? {})");
		expect(prepare).toContain("requirementsToml");
		expect(prepare).toContain(
			"COPY requirements.toml /etc/codex/requirements.toml",
		);
		expect(prepare).toContain(
			'managed_dir = "/opt/codex-forge-plugin/plugins/codex-forge"',
		);
		expect(prepare).toContain(
			"node /opt/codex-forge-plugin/plugins/codex-forge/",
		);
		for (const hook of [
			"orchestration/session-start.mjs",
			"orchestration/pre-tool-use.mjs",
			"orchestration/subagent-start.mjs",
			"orchestration/subagent-stop.mjs",
			"orchestration/stop.mjs",
			"orchestration/session-end.mjs",
		])
			expect(
				readFileSync(
					resolve(root, "plugins/codex-forge/hooks/hooks.json"),
					"utf8",
				),
			).toContain(hook);
		expect(prepare).toContain('"additionalContextLimit"');
		expect(prepare).not.toContain("features.hooks");
		expect(
			readFileSync(
				resolve(root, "plugins/codex-forge/assets/developer-instructions.txt"),
				"utf8",
			),
		).toContain(
			"Collect each active agent set with one long multi-agent wait.",
		);
		expect(
			readFileSync(
				resolve(root, "plugins/codex-forge/assets/developer-instructions.txt"),
				"utf8",
			),
		).toContain(
			"After `functions.exec` yields a cell ID, use `functions.wait` on that cell with `yield_time_ms=300000`",
		);
	});

	test("cleanup matches Pier compose and legacy container name boundaries", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-cleanup-"));
		try {
			const job = resolve(temp, "job");
			mkdirSync(resolve(job, "Task__Trial"), { recursive: true });
			const bin = resolve(temp, "bin");
			mkdirSync(bin);
			const log = resolve(temp, "docker-args.log");
			const docker = resolve(bin, "docker");
			writeFileSync(
				docker,
				`#!/bin/sh
printf '%s\\n' '---' "$@" >> "$DOCKER_ARGS_LOG"
if [ "$1" = network ] && [ "$2" = ls ]; then
	if [ ! -f "$DOCKER_STATE" ]; then
		printf 'owned-id\\ttask__trial\\nverifier-id\\ttask__trial__verifier__trial\\nunrelated-id\\ttask__trial-other\\n'
	else
		printf 'unrelated-id\\ttask__trial-other\\n'
	fi
fi
if [ "$1" = network ] && [ "$2" = rm ]; then
	touch "$DOCKER_STATE"
fi
`,
			);
			chmodSync(docker, 0o755);
			const result = spawnSync(
				"bun",
				[resolve(bench, "cleanup-job.mjs"), job],
				{
					encoding: "utf8",
					env: {
						...process.env,
						DOCKER_ARGS_LOG: log,
						DOCKER_STATE: resolve(temp, "docker-state"),
						PATH: `${bin}:${process.env.PATH}`,
					},
				},
			);
			expect(result.status).toBe(0);
			expect(JSON.parse(result.stdout)).toEqual({
				containers_verified: true,
				trials: 1,
			});
			const calls = readFileSync(log, "utf8").trim().split("---\n").slice(1);
			expect(calls).toHaveLength(5);
			expect(calls[0].trim().split("\n")).toEqual([
				"ps",
				"-aq",
				"--filter",
				"name=^/task__trial(__|-)",
			]);
			expect(calls[1]).toContain("network\nls\n--format");
			expect(calls[2].trim().split("\n")).toEqual([
				"network",
				"rm",
				"owned-id",
				"verifier-id",
			]);
			expect(calls[3]).toContain("ps\n-aq\n--filter");
			expect(calls[4]).toContain("network\nls\n--format");
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("runner supports bounded model and effort screening cells", () => {
		const runner = readFileSync(resolve(bench, "run-matrix.mjs"), "utf8");
		expect(runner).toContain("process.env.MODELS");
		expect(runner).toContain("process.env.EFFORTS");
		expect(runner).toContain("selected zero supported matrix cells");
		expect(runner).toContain('options["trial-token-budget"]');
		expect(runner).toContain("trialTokenBudget > 100_000");
		expect(runner).toContain('return "over_budget_or_unknown"');
	});

	test("rejects a per-trial output budget above 100K before execution", () => {
		for (const script of ["run-matrix.mjs", "generate-config.mjs"]) {
			const result = spawnSync(
				"bun",
				[resolve(bench, script), "--trial-token-budget=100001"],
				{ encoding: "utf8" },
			);
			expect(result.status).not.toBe(0);
			expect(result.stderr).toContain(
				"trial-token-budget must be an integer from 10000 through 100000",
			);
		}
	});

	test("summaries reject trials without verifier outcomes and retain the reason", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-summary-"));
		try {
			const trial = resolve(temp, "task__trial");
			mkdirSync(trial);
			writeFileSync(
				resolve(trial, "config.json"),
				JSON.stringify({ task: { name: "task" } }),
			);
			writeFileSync(
				resolve(trial, "exception.txt"),
				"Docker build failed\ntrace\n",
			);
			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary.valid).toBe(false);
			expect(summary.terminal).toBe(false);
			expect(summary.retryable_infrastructure).toBe(true);
			expect(summary.within_100k_output_budget).toBe(false);
			expect(summary.invalid_trials).toEqual([
				{ trial: "task__trial", task: "task", reason: "Docker build failed" },
			]);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("classifies the interrupted Terra-low r2 partial job without a false denominator", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-terra-low-r2-"));
		try {
			writeFileSync(
				resolve(temp, "result.json"),
				JSON.stringify({
					id: "053ea3b3-e7ac-4c2a-937c-2c6da1335932",
					started_at: "2026-08-27T12:36:25.810264",
					updated_at: "2026-08-27T09:36:25.890709Z",
					finished_at: null,
					stats: {
						n_completed_trials: 0,
						n_errored_trials: 0,
						n_running_trials: 2,
						n_pending_trials: 2,
						n_cancelled_trials: 0,
						n_retries: 0,
						evals: {},
						n_input_tokens: null,
						n_cache_tokens: null,
						n_output_tokens: null,
						cost_usd: null,
					},
				}),
			);
			for (const [name, task] of [
				[
					"pest-character-class-coalescing__MzszUGD",
					"pest-character-class-coalescing",
				],
				[
					"numba-stencil-boundary-modes__bbxWqmB",
					"numba-stencil-boundary-modes",
				],
			]) {
				const trial = resolve(temp, name);
				mkdirSync(trial);
				writeFileSync(
					resolve(trial, "config.json"),
					JSON.stringify({
						arm: "forge-core",
						task: { name: task, source: "forge-tasks" },
						agent: { kwargs: { version: "0.150.1" } },
					}),
				);
			}
			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary).toMatchObject({
				n_trials: 2,
				n_completed: 0,
				n_evaluable: 0,
				n_configuration_invalid: 0,
				terminal: false,
				retryable_infrastructure: true,
				valid: false,
				pass_at_1: null,
				passed: 0,
				verifier_passed: 0,
				verifier_pass_at_1: null,
				job_lifecycle: {
					observed: true,
					finished_at: null,
					externally_incomplete: true,
					stats: {
						n_running_trials: 2,
						n_pending_trials: 2,
					},
				},
			});
			expect(summary.job_lifecycle.reason).toContain(
				"retryable infrastructure/manual interruption",
			);
			expect(summary.job_lifecycle.reason).toContain("2 trials still running");
			expect(summary.job_lifecycle.reason).toContain("2 trials pending");
			for (const trial of summary.trials) {
				expect(trial).toMatchObject({
					reward: null,
					configuration_valid: null,
					orchestration: {
						required: true,
						valid: null,
						evidence_status: "unknown",
						invalid_reason: null,
					},
				});
				expect(trial.invalid_reason).toContain(
					"verifier result was not copied",
				);
				expect(trial.invalid_reason).toContain(
					"role compliance is unknown because Codex session copy was not completed",
				);
				expect(trial.invalid_reason).not.toMatch(
					/orchestration invalid|model failure/i,
				);
			}
			expect(summary.invalid_trials).toHaveLength(2);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("retains copied verifier and session metrics from an incomplete job", () => {
		const temp = mkdtempSync(
			resolve(tmpdir(), "forge-deepswe-partial-metrics-"),
		);
		try {
			writeFileSync(
				resolve(temp, "result.json"),
				JSON.stringify({
					finished_at: null,
					stats: {
						n_completed_trials: 1,
						n_running_trials: 1,
						n_pending_trials: 0,
					},
				}),
			);
			const trial = resolve(temp, "task__trial");
			const sessions = resolve(trial, "agent/sessions/2026/08/27");
			mkdirSync(sessions, { recursive: true });
			writeFileSync(
				resolve(trial, "config.json"),
				JSON.stringify({
					arm: "forge-core",
					task: { name: "task", source: "forge-tasks" },
					agent: { kwargs: { version: "0.150.1" } },
				}),
			);
			mkdirSync(resolve(trial, "verifier"), { recursive: true });
			writeFileSync(resolve(trial, "verifier/reward.json"), '{"reward":1}\n');
			const writeSession = (name, id, role, index) => {
				const timestamp = `2026-08-27T00:0${index}:00Z`;
				const source =
					role === "root"
						? "exec"
						: { subagent: { thread_spawn: { agent_role: role } } };
				const events = [
					{
						type: "session_meta",
						payload: {
							id,
							timestamp,
							source,
							...(role === "root" ? {} : { parent_thread_id: "root" }),
						},
					},
					{
						type: "response_item",
						payload: { type: "custom_tool_call", call_id: `${id}-call` },
					},
					{
						type: "event_msg",
						timestamp,
						payload: {
							type: "token_count",
							info: {
								total_token_usage: {
									input_tokens: 10 + index,
									cached_input_tokens: 5,
									output_tokens: 3 + index,
								},
							},
						},
					},
					{ type: "event_msg", payload: { type: "task_complete" } },
				];
				writeFileSync(
					resolve(sessions, name),
					events.map((event) => JSON.stringify(event)).join("\n"),
				);
			};
			writeSession("rollout-root.jsonl", "root", "root", 0);
			writeSession("rollout-worker.jsonl", "worker", "forge-worker", 1);
			writeSession("rollout-reviewer.jsonl", "reviewer", "forge-reviewer", 2);
			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary).toMatchObject({
				n_trials: 1,
				n_completed: 1,
				n_evaluable: 1,
				pass_at_1: 1,
				verifier_pass_at_1: 1,
				terminal: false,
				retryable_infrastructure: true,
				valid: false,
			});
			expect(summary.trials[0]).toMatchObject({
				reward: 1,
				configuration_valid: true,
				tool_calls: 3,
				input_tokens: 33,
				output_tokens: 12,
				orchestration: { valid: true, evidence_status: "complete" },
			});
			expect(summary.completed_totals).toMatchObject({
				tool_calls: 3,
				input_tokens: 33,
				output_tokens: 12,
			});
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("excludes the completed awilix retry3 timeout from a matched denominator", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-awilix-retry3-"));
		try {
			const writeSession = (
				trial,
				name,
				{ id, role, output, complete = true, callId },
			) => {
				const sessions = resolve(trial, "agent/sessions/2026/08/27");
				mkdirSync(sessions, { recursive: true });
				const timestamp = `2026-08-27T00:${String(id).padStart(2, "0")}:00Z`;
				const source =
					role === "root"
						? "exec"
						: { subagent: { thread_spawn: { agent_role: role } } };
				const events = [
					{
						type: "session_meta",
						payload: {
							id: `${role}-${id}`,
							source,
							...(role === "root" ? {} : { parent_thread_id: "root-0" }),
							timestamp,
						},
					},
					...(callId
						? [
								{
									type: "response_item",
									payload: { type: "custom_tool_call", call_id: callId },
								},
							]
						: []),
				];
				if (output != null)
					events.push({
						timestamp,
						type: "event_msg",
						payload: {
							type: "token_count",
							info: {
								total_token_usage: {
									input_tokens: 20,
									cached_input_tokens: 10,
									output_tokens: output,
								},
							},
						},
					});
				if (complete)
					events.push({
						type: "event_msg",
						payload: { type: "task_complete" },
					});
				writeFileSync(
					resolve(sessions, `rollout-${name}.jsonl`),
					events.map((event) => JSON.stringify(event)).join("\n"),
				);
			};
			const createTrial = (name, reward, incompleteRoot = false) => {
				const trial = resolve(temp, name);
				mkdirSync(trial, { recursive: true });
				writeFileSync(
					resolve(trial, "config.json"),
					JSON.stringify({
						arm: "forge-core",
						task: { name: name.split("__")[0], source: "forge-tasks" },
						agent: { kwargs: { version: "0.150.1" } },
					}),
				);
				writeFileSync(resolve(trial, "reward.json"), JSON.stringify(reward));
				writeSession(trial, "root", {
					id: 0,
					role: "root",
					output: incompleteRoot ? null : 10,
					complete: !incompleteRoot,
					callId: `${name}-root`,
				});
				writeSession(trial, "worker", {
					id: 1,
					role: "forge-worker",
					output: 10,
					callId: `${name}-worker`,
				});
				writeSession(trial, "reviewer", {
					id: 2,
					role: "forge-reviewer",
					output: 10,
					callId: `${name}-reviewer`,
				});
			};
			createTrial("actionlint-action-pinning-lint__known", {
				reward: 1,
				partial: 1,
			});
			const awilix = "awilix-async-container-initializ__X4jXGi9";
			createTrial(
				awilix,
				{
					reward: 0,
					f2p_total: 24,
					f2p_passed: 23,
					p2p_total: 162,
					p2p_passed: 161,
					f2p: 23 / 24,
					p2p: 161 / 162,
					partial: 0.989247311827957,
				},
				true,
			);
			writeFileSync(
				resolve(temp, `${awilix}/exception.txt`),
				"pier.trial.execution.AgentTimeoutError: Agent execution timed out after 5400.0 seconds\n",
			);

			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary).toMatchObject({
				n_trials: 2,
				n_completed: 2,
				n_evaluable: 1,
				pass_at_1: 1,
				passed: 1,
				verifier_passed: 1,
				verifier_pass_at_1: 0.5,
				retryable_infrastructure: true,
				within_100k_output_budget: false,
			});
			expect(summary.totals.tool_calls).toBe(6);
			expect(summary.invalid_trials).toEqual([
				{
					trial: awilix,
					task: "awilix-async-container-initializ",
					reason: expect.stringContaining(
						"cumulative output-token usage unavailable; 100K output budget unverified",
					),
				},
			]);
			const awilixSummary = summary.trials.find(
				(trial) => trial.trial === awilix,
			);
			expect(awilixSummary).toMatchObject({
				reward: 0,
				partial: 0.989247311827957,
				verifier: { reward: 0, partial: 0.989247311827957 },
				tool_calls: 3,
				output_tokens: null,
				within_100k_output_budget: null,
				configuration_valid: true,
				orchestration: { valid: true, evidence_status: "complete" },
				sessions: expect.arrayContaining([
					expect.objectContaining({ role: "forge-worker" }),
					expect.objectContaining({ role: "forge-reviewer" }),
				]),
			});
			expect(awilixSummary.invalid_reason).toContain("AgentTimeoutError");
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("deduplicates resumed native web-search items and retains contaminated-trial metrics", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-web-search-"));
		try {
			const trial = resolve(temp, "task__trial");
			const sessions = resolve(trial, "agent/sessions/2026/08/27");
			mkdirSync(sessions, { recursive: true });
			writeFileSync(
				resolve(trial, "config.json"),
				JSON.stringify({
					agent: { kwargs: { version: "0.150.1" } },
					task: { name: "task" },
				}),
			);
			writeFileSync(
				resolve(trial, "reward.json"),
				JSON.stringify({ reward: 1 }),
			);
			writeFileSync(
				resolve(trial, "agent/trajectory.json"),
				JSON.stringify({
					session_id: "root",
					steps: [{ source: "agent", tool_calls: [{ type: "function_call" }] }],
					final_metrics: {
						total_prompt_tokens: 11,
						total_cached_tokens: 3,
						total_completion_tokens: 7,
					},
				}),
			);
			const timestamp = "2026-08-27T00:00:00Z";
			writeFileSync(
				resolve(sessions, "rollout-root.jsonl"),
				[
					{
						type: "session_meta",
						payload: { id: "root", source: "exec", timestamp },
					},
					{
						type: "response_item",
						payload: { type: "web_search_call", id: "ws-1" },
					},
					{
						type: "event_msg",
						timestamp,
						payload: {
							type: "token_count",
							info: {
								total_token_usage: {
									input_tokens: 11,
									cached_input_tokens: 3,
									output_tokens: 7,
								},
							},
						},
					},
					{ type: "event_msg", payload: { type: "task_complete" } },
				]
					.map((event) => JSON.stringify(event))
					.join("\n"),
			);
			writeFileSync(
				resolve(sessions, "rollout-root-resumed.jsonl"),
				[
					{
						type: "session_meta",
						payload: { id: "root", source: "exec", timestamp },
					},
					{
						type: "response_item",
						payload: { type: "web_search_call", id: "ws-1" },
					},
				]
					.map((event) => JSON.stringify(event))
					.join("\n"),
			);
			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary).toMatchObject({
				valid: false,
				n_completed: 1,
				n_evaluable: 0,
				n_configuration_invalid: 1,
				n_web_search_contaminated: 1,
				native_web_search_calls: 1,
				verifier_passed: 1,
			});
			expect(summary.trials[0]).toMatchObject({
				reward: 1,
				configuration_valid: false,
				native_web_search_calls: 1,
				output_tokens: 7,
				web_search_contaminated: true,
			});
			expect(summary.trials[0].logical_sessions).toEqual([
				expect.objectContaining({ session_id: "root", rollout_files: 2 }),
			]);
			expect(summary.invalid_trials[0].reason).toContain(
				"benchmark contamination",
			);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("summaries aggregate legacy V1 root and child sessions without double counting", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-v1-sessions-"));
		try {
			const trial = resolve(temp, "task__trial");
			const agent = resolve(trial, "agent");
			const sessions = resolve(agent, "sessions/2026/08/26");
			mkdirSync(sessions, { recursive: true });
			writeFileSync(
				resolve(trial, "config.json"),
				JSON.stringify({ task: { name: "task" } }),
			);
			writeFileSync(
				resolve(trial, "reward.json"),
				JSON.stringify({ reward: 1 }),
			);
			const writeSession = (
				name,
				meta,
				usage,
				callIds,
				assistantMessages,
				terminal = true,
				tokenEvents = usage ? [{ timestamp: meta.timestamp, usage }] : [],
			) => {
				const events = [
					{ type: "session_meta", payload: meta },
					...Array.from({ length: assistantMessages }, (_, index) => ({
						type: "response_item",
						payload: {
							type: "message",
							id: `message-${index}`,
							role: "assistant",
						},
					})),
					...callIds.map((call_id) => ({
						type: "response_item",
						payload: { type: "custom_tool_call", name: "exec", call_id },
					})),
				];
				for (const tokenEvent of tokenEvents)
					events.push({
						timestamp: tokenEvent.timestamp,
						type: "event_msg",
						payload: {
							type: "token_count",
							info: { total_token_usage: tokenEvent.usage },
						},
					});
				if (terminal)
					events.push({
						type: "event_msg",
						payload: { type: "task_complete" },
					});
				writeFileSync(
					resolve(sessions, name),
					events.map((event) => JSON.stringify(event)).join("\n"),
				);
			};
			writeSession(
				"rollout-root-1.jsonl",
				{
					id: "root-1",
					session_id: "root-1",
					source: "exec",
					timestamp: "2026-08-26T00:00:00Z",
				},
				{ input_tokens: 100, cached_input_tokens: 40, output_tokens: 7 },
				["root-a"],
				1,
			);
			writeSession(
				"rollout-root-2.jsonl",
				{
					id: "root-1",
					session_id: "root-1",
					source: "exec",
					timestamp: "2026-08-26T00:00:01Z",
				},
				{ input_tokens: 150, cached_input_tokens: 80, output_tokens: 9 },
				["root-a", "root-b"],
				1,
				true,
				[
					{
						timestamp: "2026-08-26T00:00:00Z",
						usage: {
							input_tokens: 100,
							cached_input_tokens: 40,
							output_tokens: 7,
						},
					},
					{
						timestamp: "2026-08-26T00:00:01Z",
						usage: {
							input_tokens: 150,
							cached_input_tokens: 80,
							output_tokens: 9,
						},
					},
				],
			);
			writeSession(
				"rollout-child.jsonl",
				{
					id: "child-1",
					session_id: "root-1",
					source: {
						subagent: { thread_spawn: { agent_role: "forge-worker" } },
					},
					parent_thread_id: "root-1",
					timestamp: "2026-08-26T00:01:00Z",
				},
				{ input_tokens: 200, cached_input_tokens: 100, output_tokens: 11 },
				["child-a"],
				0,
			);
			writeSession(
				"rollout-reviewer.jsonl",
				{
					id: "child-2",
					session_id: "root-1",
					source: {
						subagent: { thread_spawn: { agent_role: "forge-reviewer" } },
					},
					parent_thread_id: "root-1",
					timestamp: "2026-08-26T00:02:00Z",
				},
				{ input_tokens: 300, cached_input_tokens: 150, output_tokens: 13 },
				["reviewer-a"],
				1,
			);
			// The direct artifact is a child trajectory, as observed in legacy V1
			// runs. A nested root artifact proves session-id selection wins.
			writeFileSync(
				resolve(agent, "trajectory.json"),
				JSON.stringify({
					session_id: "child-1",
					steps: [{ source: "agent", tool_calls: [{ name: "child" }] }],
					final_metrics: {
						total_prompt_tokens: 200,
						total_cached_tokens: 100,
						total_completion_tokens: 11,
						total_cost_usd: 0.01,
					},
				}),
			);
			const nested = resolve(sessions, "nested");
			mkdirSync(nested, { recursive: true });
			writeFileSync(
				resolve(nested, "trajectory.json"),
				JSON.stringify({
					session_id: "root-1",
					steps: [{ source: "agent", tool_calls: [] }],
					final_metrics: {
						total_prompt_tokens: 100,
						total_cached_tokens: 40,
						total_completion_tokens: 7,
						total_cost_usd: 0.02,
					},
				}),
			);
			const reviewerTrajectory = resolve(sessions, "reviewer");
			mkdirSync(reviewerTrajectory, { recursive: true });
			writeFileSync(
				resolve(reviewerTrajectory, "trajectory.json"),
				JSON.stringify({
					session_id: "child-2",
					steps: [{ source: "agent", tool_calls: [{ name: "review" }] }],
					final_metrics: {
						total_prompt_tokens: 300,
						total_cached_tokens: 150,
						total_completion_tokens: 13,
						total_cost_usd: 0.04,
					},
				}),
			);
			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary.totals).toMatchObject({
				tool_calls: 4,
				model_turns: 4,
				input_tokens: 650,
				cached_input_tokens: 330,
				uncached_input_tokens: 320,
				output_tokens: 33,
			});
			expect(summary.trials[0]).toMatchObject({
				metrics_scope: "all Codex V1 sessions",
				trajectory_session_id: "root-1",
				cost_usd: 0.07,
			});
			expect(summary.trials[0].sessions).toHaveLength(3);
			expect(summary.trials[0].sessions.map((session) => session.role)).toEqual(
				["root", "forge-worker", "forge-reviewer"],
			);
			expect(summary.trials[0].sessions[0]).toMatchObject({
				session_id: "root-1",
				rollout_files: 2,
				input_tokens: 150,
				output_tokens: 9,
				tool_calls: 2,
				model_turns: 2,
			});
			expect(summary.trials[0].sessions[1]).toMatchObject({
				session_id: "child-1",
				role: "forge-worker",
				model_turns: 1,
			});

			// A completed child without a terminal token count makes the aggregate
			// usage and output-budget verdict explicitly unknown.
			writeSession(
				"rollout-child.jsonl",
				{
					id: "child-1",
					session_id: "root-1",
					source: {
						subagent: { thread_spawn: { agent_role: "forge-worker" } },
					},
					parent_thread_id: "root-1",
					timestamp: "2026-08-26T00:01:00Z",
				},
				null,
				["child-a"],
				2,
			);
			const incompleteResult = spawnSync(
				"bun",
				[resolve(bench, "summarize.mjs"), temp],
				{ encoding: "utf8" },
			);
			expect(incompleteResult.status).toBe(0);
			const incompleteSummary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(incompleteSummary.trials[0]).toMatchObject({
				input_tokens: null,
				output_tokens: null,
				within_100k_output_budget: null,
			});
			expect(incompleteSummary.totals).toMatchObject({
				input_tokens: null,
				output_tokens: null,
				uncached_plus_output_tokens: null,
			});
			expect(incompleteSummary.per_pass).toBeNull();
			expect(incompleteSummary.cost_usd).toBe(0.07);
			expect(incompleteSummary.cost_per_million_tokens_usd).toBeNull();
			expect(incompleteSummary.cost_per_million_output_tokens_usd).toBeNull();
			expect(
				incompleteSummary.cost_per_million_uncached_plus_output_tokens_usd,
			).toBeNull();
			expect(incompleteSummary.valid).toBe(false);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("accounts for one Forge worker and a reused reviewer session", () => {
		const temp = mkdtempSync(
			resolve(tmpdir(), "forge-deepswe-role-accounting-"),
		);
		try {
			const trial = resolve(temp, "task__trial");
			const sessions = resolve(trial, "agent/sessions/2026/08/26");
			mkdirSync(sessions, { recursive: true });
			writeFileSync(
				resolve(trial, "config.json"),
				JSON.stringify({
					arm: "forge-core",
					task: { name: "task", source: "forge-tasks" },
					agent: { kwargs: { skills_dir: "/opt/codex-forge/skills" } },
				}),
			);
			writeFileSync(
				resolve(trial, "reward.json"),
				JSON.stringify({ reward: 1 }),
			);
			const writeSession = (name, meta, callId, timestamp, output = 5) => {
				const events = [
					{ type: "session_meta", payload: { ...meta, timestamp } },
					{
						type: "response_item",
						payload: {
							type: "custom_tool_call",
							name: "exec",
							call_id: callId,
						},
					},
					{
						timestamp,
						type: "event_msg",
						payload: {
							type: "token_count",
							info: {
								total_token_usage: {
									input_tokens: 20,
									cached_input_tokens: 10,
									output_tokens: output,
								},
							},
						},
					},
					{ type: "event_msg", payload: { type: "task_complete" } },
				];
				writeFileSync(
					resolve(sessions, name),
					events.map((event) => JSON.stringify(event)).join("\n"),
				);
			};
			writeSession(
				"rollout-root.jsonl",
				{ id: "root", session_id: "root", source: "exec" },
				"root-call",
				"2026-08-26T00:00:00Z",
			);
			writeSession(
				"rollout-worker.jsonl",
				{
					id: "worker",
					session_id: "root",
					source: {
						subagent: { thread_spawn: { agent_role: "forge-worker" } },
					},
					parent_thread_id: "root",
				},
				"worker-call",
				"2026-08-26T00:01:00Z",
			);
			const reviewerMeta = {
				id: "reviewer",
				session_id: "root",
				source: {
					subagent: { thread_spawn: { agent_role: "forge-reviewer" } },
				},
				parent_thread_id: "root",
			};
			writeSession(
				"rollout-reviewer-1.jsonl",
				reviewerMeta,
				"review-1",
				"2026-08-26T00:02:00Z",
			);
			writeSession(
				"rollout-reviewer-2.jsonl",
				reviewerMeta,
				"review-2",
				"2026-08-26T00:03:00Z",
			);

			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary.trials[0].orchestration).toMatchObject({
				required: true,
				valid: true,
				role_session_ids: {
					root: ["root"],
					"forge-worker": ["worker"],
					"forge-reviewer": ["reviewer"],
				},
				reviewer_reuse: {
					session_id: "reviewer",
					rollout_files: 2,
					resumed_rollout_files: 1,
				},
			});
			expect(summary).toMatchObject({
				n_completed: 1,
				n_evaluable: 1,
				n_configuration_invalid: 0,
				pass_at_1: 1,
				verifier_passed: 1,
				valid: true,
			});
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("keeps verifier reward and observed metrics but excludes invalid Forge orchestration", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-role-invalid-"));
		try {
			const trial = resolve(temp, "task__trial");
			const sessions = resolve(trial, "agent/sessions/2026/08/26");
			mkdirSync(sessions, { recursive: true });
			writeFileSync(
				resolve(trial, "config.json"),
				JSON.stringify({
					arm: "forge-core",
					task: { name: "task", source: "forge-tasks" },
					agent: { kwargs: { skills_dir: "/opt/codex-forge/skills" } },
				}),
			);
			writeFileSync(
				resolve(trial, "reward.json"),
				JSON.stringify({ reward: 1 }),
			);
			const writeSession = (name, id, role, index) => {
				const timestamp = `2026-08-26T00:0${index}:00Z`;
				const events = [
					{
						type: "session_meta",
						payload: {
							id,
							session_id: "root",
							timestamp,
							source:
								role === "root"
									? "exec"
									: { subagent: { thread_spawn: { agent_role: role } } },
							parent_thread_id: role === "root" ? undefined : "root",
						},
					},
					{
						type: "response_item",
						payload: { type: "custom_tool_call", call_id: `${id}-call` },
					},
					{
						timestamp,
						type: "event_msg",
						payload: {
							type: "token_count",
							info: {
								total_token_usage: {
									input_tokens: 10,
									cached_input_tokens: 5,
									output_tokens: 3,
								},
							},
						},
					},
					{ type: "event_msg", payload: { type: "task_complete" } },
				];
				writeFileSync(
					resolve(sessions, name),
					events.map((event) => JSON.stringify(event)).join("\n"),
				);
			};
			writeSession("rollout-root.jsonl", "root", "root", 0);
			writeSession("rollout-hard-worker.jsonl", "hard", "forge-hard-worker", 1);
			writeSession("rollout-reviewer-a.jsonl", "review-a", "forge-reviewer", 2);
			writeSession("rollout-reviewer-b.jsonl", "review-b", "forge-reviewer", 3);
			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary).toMatchObject({
				n_completed: 1,
				n_evaluable: 0,
				n_configuration_invalid: 1,
				pass_at_1: null,
				verifier_passed: 1,
				valid: false,
			});
			expect(summary.trials[0]).toMatchObject({
				reward: 1,
				configuration_valid: false,
				invalid_reason: expect.stringContaining("forge-hard-worker"),
				tool_calls: 4,
			});
			expect(summary.invalid_trials[0].reason).toContain("observed 2");
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});

	test("isolates Forge role-compliance and usage failures in matched trials", () => {
		const temp = mkdtempSync(resolve(tmpdir(), "forge-deepswe-role-boundary-"));
		try {
			const forgeConfig = {
				arm: "forge-core",
				task: { name: "task", source: "forge-tasks" },
				agent: { kwargs: { skills_dir: "/opt/codex-forge/skills" } },
			};
			const createTrial = (name, config, roles) => {
				const trial = resolve(temp, name);
				const sessions = resolve(trial, "agent/sessions/2026/08/26");
				mkdirSync(sessions, { recursive: true });
				writeFileSync(resolve(trial, "config.json"), JSON.stringify(config));
				writeFileSync(
					resolve(trial, "reward.json"),
					JSON.stringify({ reward: 1 }),
				);
				roles.forEach(({ id, role, malformed = false }, index) => {
					const timestamp = `2026-08-26T00:${String(index).padStart(2, "0")}:00Z`;
					const payload = {
						id: malformed ? undefined : id,
						session_id: "root",
						timestamp,
						source:
							role === "root"
								? "exec"
								: { subagent: { thread_spawn: { agent_role: role } } },
						parent_thread_id: role === "root" ? undefined : "root",
					};
					const events = [
						{ type: "session_meta", payload },
						{
							type: "response_item",
							payload: { type: "custom_tool_call", call_id: `${id}-call` },
						},
						{
							timestamp,
							type: "event_msg",
							payload: {
								type: "token_count",
								info: {
									total_token_usage: {
										input_tokens: 10,
										cached_input_tokens: 5,
										output_tokens: 3,
									},
								},
							},
						},
						{ type: "event_msg", payload: { type: "task_complete" } },
					];
					writeFileSync(
						resolve(sessions, `rollout-${index}.jsonl`),
						events.map((event) => JSON.stringify(event)).join("\n"),
					);
				});
			};
			createTrial(
				"baseline__trial",
				{ task: { name: "baseline", source: "tasks", path: "/repo" } },
				[{ id: "baseline-root", role: "root" }],
			);
			createTrial("root-only__trial", forgeConfig, [
				{ id: "root-only", role: "root" },
			]);
			createTrial("multiple-reviewers__trial", forgeConfig, [
				{ id: "multiple-root", role: "root" },
				{ id: "multiple-worker", role: "forge-worker" },
				{ id: "review-a", role: "forge-reviewer" },
				{ id: "review-b", role: "forge-reviewer" },
			]);
			createTrial("hard-worker__trial", forgeConfig, [
				{ id: "hard-root", role: "root" },
				{ id: "hard", role: "forge-hard-worker" },
				{ id: "hard-review", role: "forge-reviewer" },
			]);
			createTrial("supplementary-hard-worker__trial", forgeConfig, [
				{ id: "supplementary-root", role: "root" },
				{ id: "supplementary-worker", role: "forge-worker" },
				{ id: "supplementary-hard", role: "forge-hard-worker" },
				{ id: "supplementary-review", role: "forge-reviewer" },
				{ id: "supplementary-custom", role: "__proto__" },
			]);
			createTrial("malformed-meta__trial", forgeConfig, [
				{ id: "malformed-root", role: "root" },
				{ id: "malformed-worker", role: "forge-worker" },
				{ id: "malformed-review", role: "forge-reviewer" },
				{ id: "missing-id", role: "forge-scout", malformed: true },
			]);

			const result = spawnSync("bun", [resolve(bench, "summarize.mjs"), temp], {
				encoding: "utf8",
			});
			expect(result.status).toBe(0);
			const summary = JSON.parse(
				readFileSync(resolve(temp, "forge-summary.json"), "utf8"),
			);
			expect(summary).toMatchObject({
				n_completed: 6,
				n_evaluable: 1,
				n_configuration_invalid: 4,
				pass_at_1: 1,
				verifier_passed: 6,
				verifier_pass_at_1: 1,
				valid: false,
			});
			const byTrial = Object.fromEntries(
				summary.trials.map((trial) => [trial.trial, trial]),
			);
			expect(byTrial.baseline__trial).toMatchObject({
				configuration_valid: true,
				orchestration: { required: false, valid: true },
				reward: 1,
			});
			expect(byTrial["root-only__trial"].invalid_reason).toContain(
				"observed 0",
			);
			expect(byTrial["multiple-reviewers__trial"].invalid_reason).toContain(
				"forge-reviewer logical session, observed 2",
			);
			expect(byTrial["hard-worker__trial"].invalid_reason).toContain(
				"forge-hard-worker is not a valid substitute",
			);
			expect(byTrial["supplementary-hard-worker__trial"]).toMatchObject({
				configuration_valid: true,
				orchestration: { required: true, valid: true },
			});
			expect(
				Object.getOwnPropertyDescriptor(
					byTrial["supplementary-hard-worker__trial"].orchestration
						.role_session_ids,
					"__proto__",
				)?.value,
			).toEqual(["supplementary-custom"]);
			expect(byTrial["malformed-meta__trial"].invalid_reason).toContain(
				"malformed or inconsistent session_meta",
			);
			expect(byTrial["malformed-meta__trial"].logical_sessions).toContainEqual(
				expect.objectContaining({ role: null, metadata_valid: false }),
			);
		} finally {
			rmSync(temp, { recursive: true, force: true });
		}
	});
});
