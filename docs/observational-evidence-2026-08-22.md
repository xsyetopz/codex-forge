# Observational evidence synthesis - 2026-08-22

This document records why Forge changed behavior. It is documentation only; it isn't injected into every Codex turn.

## Evidence classes

The supplied Reddit captures are treated as structured observational evidence.
The Forge owner’s reports from GPT-5.3-Codex and GPT-5.4 onward, described as
carried into the GPT-5.6 family, are treated as first-class longitudinal
observation from a power user of the same products. Repeated reports don't
become universal facts merely by repetition, but recurring failure shapes are
useful when they agree with controlled tests, rollout logs, or public Codex
behavior. Claims about exact quota weighting, cache TTL, or provider internals
remain conditional unless independently exposed by the runtime/provider.

Upstream Codex 0.149.0 facts used here:

- Release 0.149.0 includes additional bounding/retention work and an interactive agents dashboard: <https://github.com/openai/codex/releases/tag/rust-v0.149.0>
- The 0.149.0 config schema exposes `tool_output_token_limit` and Code Mode settings, and documents `agents.max_depth` as V1-only.
- Leaf-model support for Multi-Agent V2 landed before 0.149.0, so Luna can be routed as a leaf worker when the active runtime exposes it.
- GitHub #35050 reports controlled same-task GPT-5.6 tests where explicit bounded Code Mode batching reduced outer cycles and weighted usage substantially; #32503 independently identified rare use of nested `Promise.all` in GPT-5.6 traces.

## Recurrent observations and Forge response

| Observation | Evidence strength used here | Forge response (at the recorded revision) |
| --- | --- | --- |
| Sol can perform broader blind audits but can overthink simple defects | repeated user reports; consistent with existing scope/verification failure controls | narrow-first escalation; blind consequential audit stays Sol; no local defect → architecture escalation without evidence |
| Luna performs better when given explicit observed/expected behavior, scope and oracle | repeated workflow reports | stronger child task packet; Luna only for bounded audit/implementation |
| Agents may stop after the first valid finding | repeated audit reports | review/debug continue through stated criteria and scope |
| Prior conclusions can be defended after contradictory evidence appears | repeated correctness reports | explicit evidence-conflict re-evaluation; no default environment-blame substitution |
| Long/project continuity can be over-assumed | repeated continuity/compaction reports | no cross-thread/model memory assumption; structured handoffs and compact state carry required facts |
| Independent Code Mode calls are often serialized | controlled A/B + independent trace + upstream issue | exact bounded `Promise.allSettled`/`Promise.all` batching guidance |
| Parent/subagent monitoring and handoffs can dominate usage | repeated token-log/workflow reports | one-child default; no progress polling/heartbeats; collect once; no-history forks |
| Root attempts repository operations before the registered worker/reviewer phase | current Forge hook transcripts showing repeated visible `awaiting_worker` and `awaiting_reviewer` denials | proactive phase sequencing in the developer layer; deterministic orchestration hooks remain the backstop |
| High effort can amplify overthinking and subscription burn on ordinary work | supplied subscription failure-mode and effort guides; observational, not contractual quota evidence | medium-first root/role defaults; Luna low for bounded scouting; xhigh only in explicit hard-tail roles |
| Repeated patch→test→fix and duplicate validation inflate context | repeated controlled project comparisons | first-pass convergence, common-cause repair, one focused validation batch |
| Tool-output compression alone doesn't solve repeated-context cost | benchmark/log reports; upstream exposes output budget but truncation can remove evidence | bound output at source; no forced global `tool_output_token_limit` |
| Prompt-cache lifetime/cost matters but reported TTL and subscription behavior vary | repeated direct-token observations with contradictory exact values | no cache-heartbeat optimization; reduce outer cycles and context churn instead |
| Human-facing summaries can become opaque or session-invented jargon | broad recurring reports | concrete mechanism-level wording; no carried invented labels when ordinary terms suffice |
| Stated check-before-use order inverted: user required a CLI-surface check, agent invoked the binary first with `--version`, launched a GUI, then apologized | Forge-user report on a current installed Forge session (PCSX2 2.6.3) | base instructions: keep the user’s stated order in the Goal slot before “produce outcomes through the tools”, matching GPT-5.6 Role→Goal→Success→Constraints→Tools→Output→Stop |
| Large advertised token-saving percentages often shrink under full-session measurement | controlled benchmark reports | performance/research rules require matched workload and full-session outcome/cost, not payload-only claims |
| Bounded work can be framed as a staged result after the requested acceptance boundary is already clear | current Forge task requirements plus repeated reports of plans, reviews, and repairs replacing delivery | model Goal guidance requires completion through the stated boundary in the current workstream; dependency sequencing and concrete UNVERIFIED blockers remain reportable |

### Sanitized local 0.151.0 session sample (2026-08-29)

The installed runtime was `codex-cli 0.151.0` (`codex --version`). Inspection
used metadata, event names, token counters, and byte/line counts only; auth
material, encrypted reasoning, user text, and unrelated home-directory content
were excluded. The sample was selected reproducibly by matching
`"cli_version":"0.151.0"` under `~/.codex/sessions/2026/08/29/` using
`rg -l '\"cli_version\":\"0.151.0\"' ~/.codex/sessions/2026/08/29`;
representative files were
`rollout-2026-08-29T21-11-14-01a04eb7-f85d-7980-826b-8602fd624e96.jsonl`
and `rollout-2026-08-29T21-07-35-01a04eb4-9ed2-7522-9138-aea54f1d25fa.jsonl`.

The rollout metadata timestamp is `2026-08-29T18:11:14.777Z` (the filename's
`21:11:14` is a local clock rendering, not UTC). The file contains 337 JSONL
records and shows a child thread with `depth:1`, an inherited Forge developer
payload, and repeated orchestration-denial output before its short final
answer. It reached 3,147,582 cumulative tokens at the last counter: input
3,133,400, cached input 3,004,928, output 14,182, and reasoning output 4,264.
Its first counter was 15,035, so cumulative movement was about 209x across 58
token-counter events. The per-turn `last_token_usage` counters show the final
turn at 92,492 tokens (input 91,780, cached input 90,368, output 712,
reasoning output 416), following a preceding 90,983-token turn.

The likely contributors are decomposed as follows: repeated root turns and
inherited child context are directly visible in the counter and message
records; orchestration retries are directly visible in denial outputs; prompt
payload cost is visible in the developer-message records. The attribution that
these mechanisms caused most of the growth is an inference from those signals,
not causal proof. Tool-output size, compaction/resume, and provider quota
weighting remain unquantified in this sanitized sample.

Observed categories: root/subagent accounting is directly evidenced by the
child metadata and cumulative counters; prompt/instruction payload is directly
evidenced by the developer-message records; repeated waits/reviews/repairs are
present in the broader 0.151.0 rollout set and are treated as observational;
tool-output size and compaction/resume are not quantified by this sanitized
sample. The 0.151.0 release's nested-subagent accounting makes this cost visible
to the root goal budget, while the release itself does not imply that every
session has this growth shape.

### Reddit observations and counterexamples

The retained Reddit captures are non-authoritative user observations, not
runtime facts. Multiple reports describe quota drain or repeated correction
loops, including `docs/reddit/Why_is_Codex_Sol_still_eating_up_tokens_like_no_tomorrow_.md`,
`docs/reddit/I_just_confirmed_the_real_culprit_draining_your_usage_limit__Its_Sol_generated_30_hidden,_expensive_child_and_grandchild_agents_in_a_matter_of_minutes!.md`,
and `docs/reddit/How_to_prevent_over_engineering_.md`. Counterexamples in
`docs/reddit/Sol_vs_Terra_vs_Luna__What_Actually_Worked_for_Me.md`-style model
comparisons report successful bounded tasks and lower-cost workflows. These
captures support bounded orchestration and completion wording as hypotheses
consistent with several user experiences; they do not establish universal
model quality, quota formulas, or causality.

### Supplied Reddit capture (2026-08-27)

The supplied capture reports a task-shape distinction rather than a universal
Luna capability claim: Luna reports are strongest for explicit, tightly scoped,
locally verifiable implementation; reports become negative when the task
requires ambiguity resolution, cross-system reasoning, architecture, or
semantic review. The capture is retained at `docs/reddit/` as the repository
evidence copy. Its SHA-256 exactly matches the supplied Downloads source:
`323769b45272e61b592ffa4e625c552f26aad1ba1487bf8f553eba10d59db949`.
The Downloads source remains unchanged.

Forge response: make acceptance-surface routing explicit at the developer
instruction boundary. Luna roles require an explicit contract, local blast
radius, decisive oracle, and cheap rollback; Sol architecture, debugger, and
reviewer roles own ambiguous, cross-system, and intent-reconstructing work.
This is a routing safeguard, not a measured claim about model quality or quota
savings.

## Deliberately not adopted

Forge doesn't hard-code a universal cache TTL, quota multiplier, cache-bump interval, or claimed percentage saving. It doesn't route every implementation to Luna, every retrieval to an indexer, or every task to subagents. It doesn't lower `tool_output_token_limit` globally without a measured workload because truncation can remove decisive evidence. It doesn't assume high cache-hit percentage means low total usage; repeated context can still dominate aggregate traffic.

A one-case CLI failure does not become a universal flags-from-docs or
check-docs-before-every-binary rule. The PCSX2 session inverted the user's
stated check-before-use order; the instruction-layer response stayed in the
Goal slot (“and their stated order”). Official “resolve required discovery
before taking an action” wording was not added for the same reason.

Forge does not enable `features.multi_agent_v2` globally, add
`model_instructions_file` to role TOML, ship an incomplete catalog as a
one-field Lite patch, or use negative constructions in
`model-instructions.md` / `developer-instructions.txt`. Those harness
choices and the replace-vs-additive identity argument live in the
[model-instruction audit](model-instruction-audit-2026-08-24.md).
