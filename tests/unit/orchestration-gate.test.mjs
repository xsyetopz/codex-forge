import { describe, expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sessionPaths } from "../../plugins/codex-forge/scripts/hooks/orchestration/state.mjs";

const ROOT = resolve(import.meta.dir, "../..");
const PLUGIN = join(ROOT, "plugins", "codex-forge");

function run(script, event, payload, runtime, runtimeExecutable = "bun") {
	const result = spawnSync(
		runtimeExecutable,
		[join(PLUGIN, "scripts", "hooks", "orchestration", script)],
		{
			cwd: ROOT,
			env: { ...process.env, CODEX_FORGE_RUNTIME_DIR: runtime },
			input: JSON.stringify({ hook_event_name: event, ...payload }),
			encoding: "utf8",
		},
	);
	if (result.status !== 0)
		throw new Error(result.stderr || `hook exited ${result.status}`);
	return result.stdout.trim() ? JSON.parse(result.stdout.trim()) : null;
}

function state(runtime, sessionId) {
	const path = join(runtime, `${sessionPaths(sessionId).key}.json`);
	return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function _audit(runtime, sessionId) {
	return join(runtime, `${sessionPaths(sessionId).key}.json.audit.jsonl`);
}

function pre(runtime, sessionId, tool_name, tool_input = {}, extra = {}) {
	return run(
		"pre-tool-use.mjs",
		"PreToolUse",
		{
			session_id: sessionId,
			tool_name,
			tool_input,
			...extra,
		},
		runtime,
	);
}

function denialReason(output) {
	return output.hookSpecificOutput.permissionDecisionReason;
}

function start(runtime, sessionId, agent_id, agent_type) {
	return run(
		"subagent-start.mjs",
		"SubagentStart",
		{
			session_id: sessionId,
			agent_id,
			agent_type,
		},
		runtime,
	);
}

function stopAgent(runtime, sessionId, agent_id, agent_type, message) {
	return run(
		"subagent-stop.mjs",
		"SubagentStop",
		{
			session_id: sessionId,
			agent_id,
			agent_type,
			last_assistant_message: message,
		},
		runtime,
	);
}

function _stopRoot(runtime, sessionId) {
	return run(
		"stop.mjs",
		"Stop",
		{ session_id: sessionId, stop_hook_active: false },
		runtime,
	);
}

function _spawnAsync(script, event, payload, runtime) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(
			"bun",
			[join(PLUGIN, "scripts", "hooks", "orchestration", script)],
			{
				cwd: ROOT,
				env: { ...process.env, CODEX_FORGE_RUNTIME_DIR: runtime },
			},
		);
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => (stdout += chunk));
		child.stderr.on("data", (chunk) => (stderr += chunk));
		child.on("error", reject);
		child.on("close", (code) => {
			if (code !== 0) return reject(new Error(stderr || `hook exited ${code}`));
			resolvePromise(stdout.trim() ? JSON.parse(stdout.trim()) : null);
		});
		child.stdin.end(JSON.stringify({ hook_event_name: event, ...payload }));
	});
}

describe("legacy V1 Forge orchestration gate", () => {
	test("keeps the reviewed candidate frozen after a root mutation attempt", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-reviewed-mutation";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(
			runtime,
			sessionId,
			"worker-1",
			"forge-worker",
			"candidate ready",
		);
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		stopAgent(
			runtime,
			sessionId,
			"reviewer-1",
			"forge-reviewer",
			"FORGE_REVIEW_RESULT: pass",
		);
		expect(
			pre(runtime, sessionId, "Bash", { command: "git status --short" }),
		).toBeNull();
		expect(
			pre(runtime, sessionId, "Bash", { command: "codex --version" }),
		).toBeNull();
		expect(state(runtime, sessionId).phase).toBe("reviewed");
		const repair = pre(runtime, sessionId, "apply_patch", {
			patch: "root mutation",
		});
		expect(repair.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(denialReason(repair)).toContain("phase `reviewed`");
		expect(denialReason(repair)).toContain("reviewed candidate is frozen");
		expect(state(runtime, sessionId).reviewed).toBe(true);
		const repeated = pre(runtime, sessionId, "Bash", {
			command:
				"git status --short --branch; git log --oneline -3; go test . && go vet ./...",
		});
		expect(repeated.hookSpecificOutput.permissionDecision).toBe("deny");
		expect(denialReason(repeated)).toBe(denialReason(repair));
		expect(state(runtime, sessionId).phase).toBe("reviewed");
	});

	test("replays the soft-gate repair cycle with only routing and frozen-candidate denials", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-soft-r5-replay";
		const workerId = "01a04178-fabe-7243-8abc-a512e80e2ff9";
		const reviewerId = "01a04185-6628-7d31-b76f-58a2ab2e46e0";
		const finalGate =
			"git status --short --branch; git log --oneline -3; git branch --show-current; go test . ./cmd/actionlint; go vet ./...; git diff --check";
		const denials = [];

		denials.push(pre(runtime, sessionId, "Bash", { command: finalGate }));
		expect(denialReason(denials[0])).toContain("phase `awaiting_worker`");
		expect(
			pre(runtime, sessionId, "multi_agent_v1spawn_agent", {
				agent_type: "forge-worker",
				fork_context: false,
				message: "implement",
			}),
		).toBeNull();
		start(runtime, sessionId, workerId, "forge-worker");
		stopAgent(runtime, sessionId, workerId, "forge-worker", "candidate");
		expect(
			pre(runtime, sessionId, "multi_agent_v1spawn_agent", {
				agent_type: "forge-reviewer",
				fork_context: false,
				message: "review",
			}),
		).toBeNull();
		start(runtime, sessionId, reviewerId, "forge-reviewer");
		stopAgent(
			runtime,
			sessionId,
			reviewerId,
			"forge-reviewer",
			"three findings\nFORGE_REVIEW_RESULT: fail",
		);

		expect(
			pre(runtime, sessionId, "multi_agent_v1send_input", {
				target: workerId,
				message: "repair all three findings",
			}),
		).toBeNull();
		start(runtime, sessionId, workerId, "forge-worker");
		stopAgent(runtime, sessionId, workerId, "forge-worker", "repaired");
		expect(state(runtime, sessionId).phase).toBe("awaiting_recheck");
		expect(
			pre(runtime, sessionId, "multi_agent_v1send_input", {
				target: reviewerId,
				message: "recheck repaired evidence",
			}),
		).toBeNull();
		start(runtime, sessionId, reviewerId, "forge-reviewer");
		stopAgent(
			runtime,
			sessionId,
			reviewerId,
			"forge-reviewer",
			"all acceptance criteria pass\nFORGE_REVIEW_RESULT: pass",
		);

		denials.push(pre(runtime, sessionId, "Bash", { command: finalGate }));
		expect(denialReason(denials[1])).toContain("phase `reviewed`");
		expect(denials).toHaveLength(2);
		const current = state(runtime, sessionId);
		expect(current.phase).toBe("reviewed");
		expect(current.review_result).toBe("pass");
		expect(current.worker.id).toBe(workerId);
		expect(current.reviewer.id).toBe(reviewerId);
	});

	test("passes all registered reviewer tools and keeps sentinel lifecycle control", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-reviewer-validation";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, "worker-1", "forge-worker");
		stopAgent(runtime, sessionId, "worker-1", "forge-worker", "candidate");
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, "reviewer-1", "forge-reviewer");
		const child = { agent_id: "reviewer-1", agent_type: "forge-reviewer" };
		const reviewerState = state(runtime, sessionId);
		for (const command of [
			"git show --stat --oneline --decorate 05e787d && printf '\\n--- DIFF ---\\n' && git show --format=fuller --find-renames --find-copies 05e787d",
			"git cat-file -p 05e787d^{commit}; printf '\\n--- refs ---\\n'; git branch -a -vv; printf '\\n--- root files ---\\n'; find . -maxdepth 2 -type f | sort | sed -n '1,240p'",
			"grep -R \"PathConfigs\\|ConfigFile\\|init-config\\|ParseConfig\" -n -- '*_test.go' | head -200",
			"rg -o '\"[^\"]+@v[^\"]+\"' popular_actions.go | sed 's/^\"//;s/\"$//' | awk -F@ '{print $2}' | sort -u | sed -n '1,120p'; printf '\\nCounts/actions with multiple refs:\\n'; rg -o '\"[^\"]+@[^\"]+\"' popular_actions.go | sed 's/^\"//;s/\"$//' | awk -F@ '{print $1}' | sort | uniq -c | sort -nr | sed -n '1,30p'",
			"env | sort",
			"git diff --check; git status --short; git ls-tree -r --name-only HEAD | head",
			"find . -maxdepth 2 -type f -print",
			"rg --files /usr/lib /opt 2>/dev/null | head",
			"gofmt -d config.go; go test ./... && go vet ./...",
			"head -n 35 go.mod && git diff --check 0bdc957 54f5159 && git status --porcelain=v1 --untracked-files=all && git ls-tree -r --name-only 54f5159 | rg '(task|accept|contract|forge|spec)' || true",
			"nl -ba config.go | sed -n '88,195p'; nl -ba rule_action_pinning.go | sed -n '1,180p'",
			"env GOTOOLCHAIN=go1.24.0 go version",
			"git branch --show-current; git branch --all --contains HEAD; git tag --list 'v*'",
			"git remote -v && git branch -a --contains 54f5159 && git show -s --format='%B' 54f5159",
			"rg --files man docs | sort | sed -n '1,160p' && rg -n 'action-pinning|config-file' man/actionlint.1 man/actionlint.1.html 2>/dev/null | head -n 80",
			"rg -n -i 'non-capturing|noncapturing|regexp' /usr/local/go/doc/go1.25.html /usr/local/go/doc/go1.24.html 2>/dev/null | head -n 100",
			"ls -d /usr/lib/go* /opt/go* 2>/dev/null",
			"rg --files /usr/lib /opt /root/.cache 2>/dev/null | rg '/go(1\\.24|/VERSION$|/bin/go$)' | head -n 80",
		])
			expect(pre(runtime, sessionId, "Bash", { command }, child)).toBeNull();
		expect(pre(runtime, sessionId, "webrun", {}, child)).toBeNull();
		const inputGuidance = pre(
			runtime,
			sessionId,
			"request_user_input",
			{ question: "Need clarification" },
			child,
		);
		expect(inputGuidance.hookSpecificOutput.permissionDecision).toBeUndefined();
		expect(inputGuidance.hookSpecificOutput.additionalContext).toContain(
			"FORGE_REVIEW_RESULT: fail",
		);
		for (const command of [
			"git diff 0bdc957..05e787d -- command.go config.go > /tmp/action-pinning.diff && wc -l /tmp/action-pinning.diff",
			'python3 -c \'open("marker", "w").write("x")\'',
			"git cat-file --filters HEAD:config.go",
			"find . -delete",
			"find . '-delete'",
			"find . '-fprintf' output '%p\\n'",
			"gofmt -w config.go",
			"go test ./... $(touch marker)",
			"go test ./... > test.log",
			"PATH=/tmp/evil go test ./...",
			"GOFLAGS=-toolexec=/tmp/evil go test ./...",
			"env -i GOTOOLCHAIN=go1.24.0 go version",
			"sed '-i' 's/a/b/' config.go",
			"sed --in-place=.bak 's/a/b/' config.go",
			"sed '1e touch marker' config.go",
			"sed '1w marker' config.go",
			"sed 's/a/b/w marker' config.go",
			"sed 's/.*/touch marker/e' config.go",
			"sed -f generated.sed config.go",
			"rg --pre 'touch marker' pattern .",
			"sort -o output input",
			"awk 'BEGIN { system(\"touch marker\") }' file",
			"git branch forged-write",
			"git tag forged-write",
			"git reflog write HEAD 0000000000000000000000000000000000000000 0000000000000000000000000000000000000000 message",
			"git diff --output=review.diff",
			"printf -v PATH /tmp/evil; git status --short",
			"printf --help",
			"printf '%s\\n' safe; touch marker",
			"printf '%s\\n' safe > marker",
			"printf '%s\\n' \"$(touch marker)\"",
			"printf '%s\\n' safe `touch marker`",
			"grep needle file; touch marker",
			"grep needle file > marker",
			'grep "$(touch marker)" file',
			"PATH=/tmp/evil grep needle file",
			"env PATH=/tmp/evil git status --short",
			"env -i",
			"git cat-file --filters HEAD:config.go",
			"git cat-file --textconv HEAD:config.go",
			"git cat-file -p -- HEAD",
			"git cat-file -p --output=marker",
			"git --exec-path=/tmp/evil cat-file -p HEAD",
			'git cat-file -p "$(touch marker)"',
			"git cat-file -p HEAD > marker",
		]) {
			expect(pre(runtime, sessionId, "Bash", { command }, child)).toBeNull();
		}
		expect(
			pre(runtime, sessionId, "apply_patch", { patch: "reviewer edit" }, child),
		).toBeNull();
		expect(state(runtime, sessionId)).toEqual(reviewerState);
	});

	test("replays the base-override r2 reviewer payloads without reviewer denials", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "01a04071-0931-7460-929e-86bea194d4d9";
		const reviewerId = "01a0407d-c90a-7923-87b7-4dc71812b053";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(
			runtime,
			sessionId,
			"01a04071-4467-70c3-bb15-0025c0b48a8c",
			"forge-worker",
		);
		stopAgent(
			runtime,
			sessionId,
			"01a04071-4467-70c3-bb15-0025c0b48a8c",
			"forge-worker",
			"candidate",
		);
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, reviewerId, "forge-reviewer");
		const officialFields = {
			agent_id: reviewerId,
			agent_type: "forge-reviewer",
			cwd: "/app",
			model: "gpt-5.6-sol",
			permission_mode: "bypassPermissions",
			transcript_path: null,
			turn_id: "turn-r2-reviewer",
		};
		const admitted = [
			"git show --stat --oneline --decorate 05e787d && printf '\\n--- DIFF ---\\n' && git show --format=fuller --find-renames --find-copies 05e787d",
			"git cat-file -p 05e787d^{commit}; printf '\\n--- refs ---\\n'; git branch -a -vv; printf '\\n--- root files ---\\n'; find . -maxdepth 2 -type f | sort | sed -n '1,240p'",
			"git cat-file -p 05e787d",
			"grep -R \"PathConfigs\\|ConfigFile\\|init-config\\|ParseConfig\" -n -- '*_test.go' | head -200",
			"rg -o '\"[^\"]+@v[^\"]+\"' popular_actions.go | sed 's/^\"//;s/\"$//' | awk -F@ '{print $2}' | sort -u | sed -n '1,120p'; printf '\\nCounts/actions with multiple refs:\\n'; rg -o '\"[^\"]+@[^\"]+\"' popular_actions.go | sed 's/^\"//;s/\"$//' | awk -F@ '{print $1}' | sort | uniq -c | sort -nr | sed -n '1,30p'",
			"env | sort",
		];
		for (const [index, command] of admitted.entries())
			expect(
				pre(
					runtime,
					sessionId,
					"Bash",
					{ command },
					{
						...officialFields,
						tool_use_id: `r2-admitted-${index}`,
					},
				),
			).toBeNull();
		const rejected = [
			"git diff 0bdc957..05e787d -- command.go config.go linter.go docs/config.md docs/usage.md docs/checks.md > /tmp/action-pinning.diff && wc -l /tmp/action-pinning.diff && sed -n '1,260p' /tmp/action-pinning.diff",
			`python3 -c 'import re,collections; s=open("popular_actions.go").read(); a=re.findall(r"\\"([^\\"]+@[^\\"]+)\\"\\s*:",s); refs=sorted(set(x.split("@",1)[1] for x in a if "@v" in x)); print("\\n".join(refs[:120])); c=collections.Counter(x.split("@",1)[0] for x in a); print("MULTI"); print("\\n".join(f"{n} {k}" for k,n in c.most_common(30) if n>1))'`,
		];
		for (const [index, command] of rejected.entries()) {
			expect(
				pre(
					runtime,
					sessionId,
					"Bash",
					{ command },
					{
						...officialFields,
						tool_use_id: `r2-rejected-${index}`,
					},
				),
			).toBeNull();
		}
		const reviewerRunningState = state(runtime, sessionId);
		const childInput = pre(
			runtime,
			sessionId,
			"request_user_input",
			{ question: "Need root input" },
			{ ...officialFields, tool_use_id: "r2-child-input" },
		);
		expect(childInput.hookSpecificOutput.permissionDecision).toBeUndefined();
		expect(childInput.hookSpecificOutput.additionalContext).toContain(
			"FORGE_REVIEW_RESULT: fail",
		);
		expect(state(runtime, sessionId)).toEqual(reviewerRunningState);
		const rootWait = pre(runtime, sessionId, "apply_patch", { patch: "root" });
		expect(denialReason(rootWait)).toContain("phase `reviewer_running`");
		expect(denialReason(rootWait)).toContain(reviewerId);
		expect(denialReason(rootWait)).toContain("multi_agent_v1wait_agent");
		expect(state(runtime, sessionId)).toEqual(reviewerRunningState);
	});

	test("replays the base-override r4 reviewer payloads without reviewer denials", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "01a0411f-11a6-7321-89d0-ede415ad43d4";
		const workerId = "01a0411f-660d-7d40-b8a2-b32e89a2116b";
		const reviewerId = "01a04129-8dd9-7220-ad6f-9475172da277";
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-worker",
			message: "change",
		});
		start(runtime, sessionId, workerId, "forge-worker");
		stopAgent(runtime, sessionId, workerId, "forge-worker", "candidate");
		pre(runtime, sessionId, "spawn_agent", {
			agent_type: "forge-reviewer",
			message: "review",
		});
		start(runtime, sessionId, reviewerId, "forge-reviewer");
		const officialFields = {
			agent_id: reviewerId,
			agent_type: "forge-reviewer",
			cwd: "/app",
			model: "gpt-5.6-sol",
			permission_mode: "bypassPermissions",
			transcript_path: null,
			turn_id: "turn-r4-reviewer",
		};
		const rootCommand = pre(runtime, sessionId, "Bash", {
			command:
				"git status --short --branch; git log --oneline --decorate -3; git show --stat --oneline HEAD; go test ./...",
		});
		expect(denialReason(rootCommand)).toContain("multi_agent_v1wait_agent");
		expect(denialReason(rootCommand)).toContain(reviewerId);
		expect(
			pre(runtime, sessionId, "multi_agent_v1wait_agent", {
				targets: [reviewerId],
				timeout_ms: 300000,
			}),
		).toBeNull();

		const admitted = [
			`printf '%s\\n' '== recent history ==' && git log --oneline --decorate -12 && printf '%s\\n' '== refs ==' && git branch -avv && printf '%s\\n' '== commit message ==' && git show -s --format=fuller 35e100352257712646cfbc9a0c60ed7427393f43 && printf '%s\\n' '== grep acceptance/action pinning ==' && rg -n --hidden -S "action[- ]pin|pinning|acceptance|known-action|known action" . --glob '!popular_actions.go' --glob '!.git/objects/**' --glob '!.git/index' | head -300`,
			"git log --oneline --decorate -12; git branch -avv; git show -s --format=fuller 35e100352257712646cfbc9a0c60ed7427393f43",
			"git merge-base main feat/action-pinning",
			"rg -n 'ExitStatusInvalidCommandOption|ExitStatusSuccessProblemFound' command.go doc.go README.md docs/usage.md | head -50; nl -ba command.go | sed -n '1,60p'; find cmd -maxdepth 2 -type f -print -exec sed -n '1,120p' {} \\;",
			"printf 'on: push\\njobs:\\n  test:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - uses: actions/checkout@v4\\n' | go run ./cmd/actionlint -shellcheck= -pyflakes= -no-color -action-pinning-level semver -",
			"go run ./cmd/actionlint -action-pinning-level invalid -version",
		];
		for (const [index, command] of admitted.entries())
			expect(
				pre(
					runtime,
					sessionId,
					"Bash",
					{ command },
					{
						...officialFields,
						tool_use_id: `r4-admitted-${index}`,
					},
				),
			).toBeNull();

		for (const [index, command] of [
			`python3 -c 'open("marker", "w").write("x")'`,
			"git branch -aD stale",
			"find cmd -type f -exec touch marker \\;",
			"find cmd -type f -exec sed '1w marker' {} \\;",
			"go run ./cmd/actionlint --output=marker",
			"go run ./tools/actionlint -version",
		].entries())
			expect(
				pre(
					runtime,
					sessionId,
					"Bash",
					{ command },
					{
						...officialFields,
						tool_use_id: `r4-rejected-${index}`,
					},
				),
			).toBeNull();
	});
	test("allows exact supervisor validation commands while guarding other commands", () => {
		const runtime = mkdtempSync(join(tmpdir(), "forge-gate-"));
		const sessionId = "gate-supervisor-ops";
		for (const command of [
			"codex --version",
			"docker ps",
			"docker ps -a --format '{{.ID}} {{.Names}}'",
		])
			expect(pre(runtime, sessionId, "Bash", { command })).toBeNull();
		for (const command of [
			"codex --version; touch x",
			"timeout 5 codex --version",
			"PATH=/tmp/evil:$PATH codex --version",
			"docker run image",
			"PATH=/tmp/evil:$PATH docker ps",
			"docker ps --format `touch x`",
			'docker ps --filter "name=$(touch x)"',
			"bun scripts/other.mjs",
		])
			expect(
				pre(runtime, sessionId, "Bash", { command }).hookSpecificOutput
					.permissionDecision,
			).toBe("deny");
	});
});
