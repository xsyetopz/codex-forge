# Community observations

The 77 Markdown files under `docs/reddit/` are immutable source captures. They
are user reports with uncontrolled environments, subscription accounting, model
routing, prompt stacks, and repository difficulty. Forge uses them to find
failure shapes and hypotheses, never as product guarantees or fixed pricing.

## High-signal clusters

### Review and orchestration can create runaway work

- [Auto review can go completely insane](../reddit/Check_your_Codex_usage_because_auto_review_can_go_completely_insane.md)
  reports a large turn imbalance caused by sandbox-boundary review plus stale
  multi-agent configuration.
- [Hidden child and grandchild agents](../reddit/I_just_confirmed_the_real_culprit_draining_your_usage_limit__Its_Sol_generated_30_hidden,_expensive_child_and_grandchild_agents_in_a_matter_of_minutes!.md)
  attributes unexpected usage to agent fan-out.
- [Orchestrator stopping subagents](../reddit/Codex_Orchestrator_stopping_subagents_based_on_arbitrary_time_limit.md)
  reports premature interruption inside a worker/reviewer loop.
- [Zero workers](../reddit/I_built_a_Codex_orchestrator_expecting_it_to_use_more_agents._It_kept_choosing_0_workers..md)
  provides the opposite observation: delegation overhead can outweigh useful
  work and a model may correctly choose no child.

Forge consequence: concurrency is a ceiling, not a target. Forge uses two
concurrent child slots, six total admissions per thread, one routine review,
one hard-tail review, and one repair cycle. Native interruption and closure
stay unobstructed; stale configuration is removed instead of supported
indefinitely.

### Bounded tasks matter more than a universal model ladder

Reports repeatedly describe Sol planning/review with Luna execution, but their
outcomes conflict:

- [Small self-contained Luna tasks](../reddit/How_I’ve_been_making_my_Codex_limits_last_much_longer_with_Sol_+_Luna.md)
  reports improved consistency and usage.
- [Luna is underrated](../reddit/gpt-5.6-luna_is_underrated.md) reports good value
  with more specific prompts.
- [Luna is a lunatic](../reddit/codex-1vzlal0-luna_is_a_lunatic_and_i_dont_understand_how_yall.md)
  and [Luna ignores analysis-only scope](<../reddit/This_is_what_Luna(tic)_do,_never_follow_the_instructions.md>)
  report poor comprehension and unauthorized mutation.
- [Sol planning, Luna execution?](../reddit/“Sol_for_planning,_Luna_for_execution”,_Is_this_really_the_best_strategy_.md)
  questions whether planning plus review costs more than direct implementation.

Forge consequence: route by task shape, not model folklore. Luna roles require
an explicit local contract and decisive oracle. Architecture and a demonstrated
hard tail stay with Sol. Repository work, retrieval, debugging, and routine
semantic review use Terra. The root may execute directly when delegation has
no measured benefit.

The expanded [Luna MAX discussion](../reddit/Luna_MAX_is_underrated.md) contains
both strong results on bounded technical work and reports of slow execution,
rework, weak project judgment, and cache loss after model switching. The
[three-tier workflow](../reddit/A_3-Tier_GPT-5.6_Workflow_I’ve_Been_Using_for_a_While.md)
maps Sol to goal ownership, Terra to difficult bounded work, and Luna to clear
work with immediate verification, while its comments still dispute the middle
tier and maximum-effort choices.

Forge consequence: alpha.5 keeps task-shape routing rather than promoting Luna
Max globally. Sol owns integration and material architecture, Terra handles
repository-scale evidence and routine review, and Luna receives bounded work.
Effort escalates after ordinary execution proves insufficient.

### Handoffs need one owner and bounded writable scope

- [Agent handoffs](../reddit/How_do_you_guys_handoff_work_between_Agents_.md)
  repeatedly recommends one task source of truth, short handoffs, and separate
  worktrees or branches for parallel mutation.
- The same discussion warns that giant project documents, agent-to-agent chat,
  elaborate state machines, and artificial blockers can cost more coordination
  than the work they organize.
- [Goal, compaction, and steering](../reddit/Goal_+_context_compaction_+_steering_instructions_make_codex_crazy.md)
  reports that instructions may survive compaction while temporal position,
  such as a completed review round, is lost.

Forge consequence: the root remains the only Goal owner and adjudicator. Child
handoffs are bounded evidence, parallel children receive disjoint scopes, and
shared-worktree mutation is serialized. The compact prompt preserves completed
work, current state, material decisions, and the next acceptance-bearing action
instead of introducing a second project-management state machine.

### V2 control remains uneven across user reports

- [Sol refusing to spawn Luna subagents](../reddit/Sol_refusing_to_spawn_luna_sub_agents.md)
  reports model-routing differences between V1 and V2.
- [Sol orchestrator with Luna subagents](../reddit/For_those_who_don't_know_how_to_set_up_Sol_orchestrator_+_Luna_subagent.md)
  records the V2-specific metadata-visibility workaround and comments that V2
  still has unresolved issues.
- [Hidden expensive child agents](../reddit/I_just_confirmed_the_real_culprit_draining_your_usage_limit__Its_Sol_generated_30_hidden,_expensive_child_and_grandchild_agents_in_a_matter_of_minutes!.md)
  describes the same broad fan-out and quota-drain shape observed locally.

Forge consequence: community workarounds do not establish a stable V2
contract. The 0.153.1 source audit owns transport selection; Forge keeps V1,
fresh child contexts, explicit roles, depth one, and bounded admissions.

### Higher effort is not uniformly better

The captures contain recommendations for Luna High, xhigh, and Max, as well as
counterexamples where long reasoning loops or lower comprehension dominate.
The [Pareto-frontier report](../reddit/The_Codex_Pareto_frontier__Luna_High_→_Terra_Max_→_Sol_Max_—_verified_cost_performance_across_all_15_measured_modes.md)
uses a measured task set, while [Luna High for subagents](../reddit/Use_Luna_High_for_subagents,_not_Max.md)
argues that bounded execution does not benefit from maximum effort.

Forge consequence: medium is the ordinary baseline; high/xhigh is an explicit
escalation after difficulty is demonstrated. No captured quota ratio is encoded
as a deterministic Forge cost formula.

### Overengineering and loops are recurring but non-universal

- [Sol over-engineers](../reddit/Why_does_GPT-5.6_Sol_always_over-engineer_everything_.md),
  [prioritization is poor](../reddit/i_must_say_gpt5.6_sol_is_a_stupidly_intelligent_model._let_me_explain..md),
  and [five-step thinking loop](../reddit/Codex_stuck_in_a_5-step__thinking__loop_every_single_prompt._Anyone_else___.md)
  report scope expansion or repeated reasoning.
- Other captures report strong Sol results and moderate usage, including
  [two long xhigh sessions](../reddit/Am_I_using_Codex_differently__I_ran_two_GPT-5.6_Sol_xhigh_agents_for_~8_hours_and_only_used_40%_weekly.md).

Forge consequence: success is the narrowest user-requested outcome; the prompt
states each boundary once; hooks do not force a review loop; validation must
discriminate the requested behavior rather than expand by default.

### Validation can become its own usage multiplier

- [Test-case proliferation](../reddit/I_now_officially_hate_test_cases,_all_after_codex.md)
  describes tests that mirror constants, tests added for the harness itself,
  and production seams introduced mainly to make more tests possible.
- [Serious orchestration bug](../reddit/Serious_Codex_orchestration_bug___logs_included.md)
  reports repeated model-mediated polling of one long-running command with a
  large accumulated context.
- [Codex user hacks](../reddit/What_are_some_hacks_every_codex_user_should_know_!!.md)
  emphasizes short bounded tasks, external memory, selective high-cost models,
  and explicit handoff context.

Forge consequence: tests stay proportional to the verified defect and support
contract, with one discriminating regression preferred over coverage
multiplication. The root uses one long wait for active children and keeps
validation attached to the requested acceptance boundary.

### Effective model and accounting can differ from the visible selection

Some captures report suspected backend fallback, fast-mode children, or
subscription ratios that differ from API pricing. These are useful diagnostics
but remain externally controlled and time-sensitive. Forge records configured
model/effort and validates its catalog; it does not claim to prove the provider's
resolved backend or predict subscription usage.

## Adoption rule

A community observation enters Forge only when it maps to a narrow owner and a
local oracle. Deterministic hook and configuration bugs become tests. Model
quality, pricing, and quota reports remain hypotheses until representative
Forge evals reproduce them.
