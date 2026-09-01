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

## Operational recovery and social-script substitution

### NeuroArxiv search (2026-09-01)

Searched `cs.CL`, `cs.AI`, `cs.HC`, and `cs.SE` for sycophancy, social
desirability, anthropomorphism, AI apology, error recovery, instruction
compliance, and agent failure. Eight relevant abstracts were read in isolation
before convergence.

| Cluster | Paper | Abstract-grounded role | Scores |
| --- | --- | --- | --- |
| Preference-shaped social behavior | [2310.13548, *Towards Understanding Sycophancy in Language Models*](https://arxiv.org/abs/2310.13548) | Preference judgments can reward convincing agreement over correctness | rel 7, prac 7, rig 9 |
| Assumption-driven social behavior | [2604.03058, *Verbalizing LLMs' assumptions to explain and control sycophancy*](https://arxiv.org/abs/2604.03058) | Models can assume users seek validation and transfer human-human conversational expectations to AI interaction | rel 9, prac 7, rig 8 |
| Apology interface | [2412.15787, *AI Apology: A Critical Review of Apology in AI Systems*](https://arxiv.org/abs/2412.15787) | Apology is an affective, regulatory, and informational trust-repair interface | rel 8, prac 6, rig 7 |
| Chatbot apology preference | [2507.02745, *Who's Sorry Now*](https://arxiv.org/abs/2507.02745) | General chatbot users compared rote, explanatory, and empathic apologies in staged error scenarios | rel 5, prac 5, rig 8 |
| Anthropomorphic output | [2502.16345, *Walkthrough of Anthropomorphic Features in AI Assistant Tools*](https://arxiv.org/abs/2502.16345) | Subjective language and sympathetic tone provide observable social-role signals | rel 8, prac 8, rig 6 |
| Executable constraints | [2603.00822, *ContextCov*](https://arxiv.org/abs/2603.00822) | Passive instruction constraints can drift; deterministic constraints benefit from executable checks | rel 9, prac 8, rig 7 |
| Model-harness failures | [2607.15684, *Understanding Agent-Reactive Bugs at the Model-Harness Boundary*](https://arxiv.org/abs/2607.15684) | Fluent output can conceal instruction non-compliance and weak test oracles | rel 9, prac 8, rig 8 |
| Grounded agent recovery | [2512.07497, *How Do LLMs Fail In Agentic Scenarios?*](https://arxiv.org/abs/2512.07497) | Premature ungrounded action and over-helpful substitution contrast with discovery and verification | rel 9, prac 9, rig 7 |

Scores reflect fit to Forge, small-team practicality, and evidence visible in
the abstract. They do not judge the complete paper.

### Population and task-domain boundary

The chatbot-apology study recruited general chatbot users to compare responses
after staged bias, fabrication, and factual-error vignettes. It did not study
coding-agent operators, real tool execution, user-visible application side
effects, command verification, containment evidence, or recovery accuracy.
Its preference results therefore cannot establish a Forge acceptance oracle.
The paper is useful only for identifying apology as a designed social-repair
interface whose effects vary by context.

### Prior-art pitfalls

- Sycophancy is narrower than the observed behavior: apology, remorse, and
  personal reform promises can displace task reporting without agreeing with a
  user's belief.
- Anthropomorphic cues can make a tool appear to possess emotion, intention, or
  durable personal reform that the runtime does not implement.
- A fluent correction can still fabricate process state, containment, or a
  required user action.
- A text blacklist confuses unwanted agent behavior with quoted analysis,
  requested writing, and legitimate domain content.
- Executable hooks should enforce predicates available in their payload; a
  pending command does not prove whether the model established its CLI support.

### THE PATH: operational task-state recovery

Forge treats the failure as social-script substitution at the
model-harness boundary. The base Output contract now defines the required
response shape for reporting or correcting an execution failure: observed
state, material impact, containment evidence, and required user action. This
positive structure follows the [official GPT-5.6 prompting guidance](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6)
to state product tone as concrete writing choices, preserve evidence and next
actions, remove generic reassurance first, and keep each instruction in one
place.

The earlier PCSX2 invocation remains a stated-order failure owned by the Goal
sentence. It does not create a universal requirement to consult documentation
before every flag or CLI call. Deterministic command restrictions continue to
belong in `forge.rules` or a focused `PreToolUse` matcher only when the command
family and decision oracle are available from the hook payload.

No Forge skill is added. Skills are selectively loaded workflows; this is
cross-cutting default response behavior with no distinct user-invoked task.
No Stop hook is added. Codex 0.151.0 can feed a blocked final response back to
the model, but that reintroduces mandatory continuation authority and cannot
reliably classify requested social text from operational recovery.

First concrete step: run the opt-in isolated `execution-recovery` case against
a fresh installed session and inspect the emitted assistant message. The
load-bearing risk is prompt adherence variance across models and contexts;
static contracts prove the shipped prompt, while live behavior remains
`UNVERIFIED` until observed.

### Open thread

Representative recovery scenarios beyond process/dialog state—such as file
mutation, remote writes, and partial deployment—need separate live cases before
Forge can claim broader behavioral coverage.
