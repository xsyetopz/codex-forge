# Harness research synthesis

## Engineering catalog

[Awesome Harness Engineering](https://github.com/ai-boost/awesome-harness-engineering)
organizes harness work around agent loops, planning, context, tools, skills,
permissions, memory/state, orchestration, verification, observability,
debugging, and human control. Its useful organizing principle for Forge is that
scaffolding assumptions expire as native model/runtime capabilities improve.

Forge applies that principle by deleting its duplicate agent scheduler and
using native Codex 0.151.0 interrupt/close/state behavior. Deterministic Forge
code remains for installer transactions, owned files, exact prompt assets, and
bounded continuity—areas Codex does not own for this plugin.

## NeuroArxiv search

Searched `cs.SE`, `cs.DC`, and `cs.MA` for agent orchestration, workflow
cancellation, durable execution, state-machine recovery, human override, and
agent interruption. Eleven records were returned; eight relevant abstracts
were read in isolation before convergence.

### Papers read

| Cluster | Paper | Abstract-grounded role | Scores |
| --- | --- | --- | --- |
| Durable replay | [2607.13617, *A Telemetry-Driven Model for Quantifying Upgrade Risk in Durable Workflow Execution*](https://arxiv.org/abs/2607.13617) | Versioned replay and coupling-risk model | rel 8, prac 6, rig 8 |
| Durable replay | [2412.13314, *Distributed Speculative Execution for Resilient Cloud Applications*](https://arxiv.org/abs/2412.13314) | Atomic/message-driven recovery analogy | rel 6, prac 5, rig 8 |
| Concurrency safety | [2606.17182, *Verified Detection and Prevention of Concurrency Anomalies in Multi-Agent Large Language Model Systems*](https://arxiv.org/abs/2606.17182) | Stale-generation and effect-order anomaly model | rel 10, prac 8, rig 10 |
| Prompt economy | [2606.08878, *PerspectiveGap: A Benchmark for Multi-Agent Orchestration Prompting*](https://arxiv.org/abs/2606.08878) | Minimal role/topology overhead and leakage | rel 8, prac 8, rig 7 |
| Adaptive topology | [2602.16873, *AdaptOrch: Task-Adaptive Multi-Agent Orchestration in the Era of LLM Performance Convergence*](https://arxiv.org/abs/2602.16873) | Dependency-DAG topology selection | rel 7, prac 6, rig 6 |
| Staged review | [2408.01916, *MAO: A Framework for Process Model Generation with Multi-Agent Orchestration*](https://arxiv.org/abs/2408.01916) | Generate/refine/review/test stages | rel 5, prac 6, rig 6 |
| Broad protocol | [2604.06392, *Qualixar OS: A Universal Operating System for AI Agent Orchestration*](https://arxiv.org/abs/2604.06392) | Explicit command/event protocol analogy | rel 5, prac 3, rig 4 |
| Orchestration evaluation | [2606.13598, *Reward Modeling for Multi-Agent Orchestration*](https://arxiv.org/abs/2606.13598) | Trace-level efficiency evaluation | rel 4, prac 3, rig 5 |

Scores reflect fit to this Forge problem, small-team practicality, and evidence
visible in the fetched abstract—not a judgment of the full papers.

## Prior-art pitfalls

- Durable replay can preserve the wrong policy perfectly; cancellation
  precedence must be a Forge invariant before replay is useful.
- Speculative work cannot make external agent side effects reversible.
- Iterative reviewer/repair stages become the exact failure mode when they are
  mandatory after user cancellation.
- Learned orchestration rewards can reproduce errors present in historical
  traces; hard authorization invariants come first.
- Broad provider/topology compatibility adds surface area without solving
  Forge's narrow Codex contract.

## THE PATH: native lifecycle plus observational continuity

Forge should use Codex's native agent state and cancellation tools as the only
execution authority. Forge continuity state records bounded observations but
cannot schedule work. PreToolUse checks only spawn-time boundaries, while close,
interrupt, wait, and send-input remain unmatched. Stop has no Forge handler,
because native Stop blocking creates another model continuation. Review is an
optional topology selected by task dependency and risk, not a persistent phase.
Regression tests assert that stale handoff state has no lifecycle field and that
native control tools have no Forge matcher.

Primary mechanism: 2606.17182's generation/order anomaly framing. Supporting
evidence: 2607.13617's coupling analysis and 2606.08878's prompt-economy
principle. Failure mode to avoid: 2408.01916-style iterative repair applied as
an unconditional scheduler.

First concrete step: remove every persisted `awaiting_*`, `repair_*`, or
review-gate state and every hook matcher for native cancellation/control tools.
That step is implemented in the current worktree.

Load-bearing risk: a future hook or prompt could quietly reintroduce mandatory
review authority. Contract tests and the source audit therefore own the
no-Stop/no-control-tool-matcher invariant.

## Alternates considered, not chosen

- Full event-sourced orchestration offers richer recovery but recreates a
  scheduler Codex already owns.
- Adaptive multi-agent topology may improve some workloads but belongs in
  optional task routing, not a hard hook protocol.
- Reward-guided orchestration is premature until compliant traces and stable
  outcome measures exist.

## Open thread

Codex 0.151.0 exposes native cancellation and persisted spawn-edge closure, but
the abstracts and release source do not establish a cross-process receipt that
proves every external side effect stopped. Forge should treat that as a runtime
verification boundary rather than inventing one in prompt text.
