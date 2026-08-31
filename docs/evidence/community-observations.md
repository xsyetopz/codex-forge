# Community observations

The 70 Markdown files under `docs/reddit/` are immutable source captures. They
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

Forge consequence: concurrency is a ceiling, not a target; review and repair
remain optional; native interruption and closure stay unobstructed; stale
configuration is removed instead of supported indefinitely.

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
an explicit local contract and decisive oracle. Ambiguous architecture,
cross-system reasoning, debugging, and semantic review stay with Sol. The root
may execute directly when delegation has no measured benefit.

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
