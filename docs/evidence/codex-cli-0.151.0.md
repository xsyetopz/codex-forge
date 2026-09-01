# Codex CLI 0.151.0 source audit

Forge targets `rust-v0.151.0` exactly. The vendored checkout is
`vendor/codex-cli-0.151.0`, tag commit
`78c290807ce710180111df227df3b7a4fe845452`. It was indexed locally with
CodeGraph (4,367 files, 141,720 nodes, 510,221 edges at initialization).

This document is the capability authority for Forge. External release link:
[Codex CLI 0.151.0](https://github.com/openai/codex/releases/tag/rust-v0.151.0).

## Complete 0.151.0 release delta

The release adds:

- configurable discovery grace for optional MCP servers;
- extension inspection or replacement of MCP tool results before model input;
- plugin-catalog merging with per-repository configuration while reporting an
  invalid project marketplace without hiding valid plugins.

It fixes:

- restoration of permission profiles across TUI turns and `/cd` sandbox
  weakening;
- model-specific tool availability and reasoning effort across model switches
  and fallbacks;
- remote sandbox path decisions using the executor's real home, operating
  system, and path conventions;
- preservation of structured MCP tool/resource errors in app-server output;
- nested-subagent token accounting in root goal budgets;
- stale Guardian classifications authorizing work after permission changes.

It also adds telemetry for escalated stdin-review size and remote executor MCP
discovery, and stabilizes Guardian WebSocket/core fixtures under slow or highly
concurrent CI. The release changelog names PRs #41183, #41189, #41191, #41192,
#41193, #41194, #41195, #41196, #41199, #41202, #41204, #41205, #41206,
#41207, #41208, and #41209.

## Hook semantics

Source owners:

- `codex-rs/hooks/src/events/pre_tool_use.rs`
- `codex-rs/hooks/src/events/stop.rs`
- `codex-rs/hooks/src/engine/output_parser.rs`
- `codex-rs/hooks/src/schema.rs`

`PreToolUse` aggregates every matched handler and blocks when any controlling
handler blocks. Input replacement is ignored whenever the aggregate blocks;
otherwise the last completed replacement wins. This makes overlapping broad
PreToolUse matchers order-sensitive and difficult to reason about.

Stop and SubagentStop share the same executor. A controlling handler can:

- stop hook processing with `continue: false`;
- block completion and provide a reason that becomes a continuation prompt;
- exit with code 2 and use stderr as that continuation prompt.

When any handler requests a stop, its result dominates blocking. Otherwise,
blocking reasons are joined and returned as continuation fragments. Therefore
a product Stop hook is an active workflow-control surface, not passive cleanup.
Forge 0.151.0 uses no Stop hook and never matches native close, interrupt, wait,
or send-input tools.

### Operational-recovery feasibility

The September 1, 2026 operational-recovery review checked whether Forge could
enforce factual recovery reporting without changing Codex source.

| Surface | What 0.151.0 permits | Boundary for Forge |
| --- | --- | --- |
| `model_instructions_file` | Replaces base instructions for the configured model transport | Correct owner for default response behavior; model adherence remains observational |
| `AGENTS.md` / developer instructions | Adds project or harness context through separate injected layers | Useful for scoped workflows, but duplicating the base rule would create prompt conflict and repetition |
| Skills | Adds selectively loaded task instructions and resources | Appropriate for distinct reusable workflows, not a cross-cutting correction to default execution-failure reporting |
| `PreToolUse` | Inspects a pending supported tool call and can deny or replace its input | Can enforce syntactic command policy; it cannot establish from arguments alone that the model verified an application's CLI contract |
| `PostToolUse` | Inspects an executed tool response and can block continuation or add feedback | Cannot undo the side effect or replace ordinary tool output through command-hook JSON |
| `Stop` | Receives `last_assistant_message`; a controlling handler can block completion and return a continuation prompt | Can request a rewrite, but cannot replace the assistant message directly. Completion blocking re-enters the model loop and can override current user intent, the failure Forge previously removed |
| `notify` | Observes the completed turn and final assistant text | Post-turn observation only |
| Extension MCP result contributor | Receives a mutable MCP result before client/model delivery | Compiled extension surface for MCP results, not a plugin command hook or a general assistant-message interceptor |
| App-server client | Receives protocol events and chooses its own presentation | A replacement client could filter display, but cannot mutate the normal CLI assistant item through a documented request |

`StopCommandInput` includes `stop_hook_active` so a handler can distinguish a
continuation attempt, but that supports loop management rather than safe
semantic classification. A social-language detector would still need to
distinguish an operational recovery response from requested quotation,
analysis, or creative writing. A false positive would block completion and
inject more work after the user had already supplied direction.

Forge therefore uses the base Output contract plus an opt-in live response
evaluation. It adds no Stop hook, generic CLI-verification hook, or assistant
text filter. Exact command families with deterministic authorization risk
remain eligible for `forge.rules` or focused `PreToolUse` controls when a
separate measured failure establishes the matcher and oracle.

Plugin hooks are hash-trusted through the TUI review surface. Installation or a
hook command change still requires a fresh session and manual `/hooks` review.

## Native agent lifecycle

Source owners:

- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/control/legacy.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/`

`send_input` starts or steers a child turn. `interrupt_agent` submits native
`Op::Interrupt`. V1 `close_agent` marks the persisted spawn edge closed, shuts
down the selected child and its live descendants, waits for termination, removes
threads from the manager, and releases capacity. Forge delegates these actions
to Codex instead of reconstructing them in hooks.

## Multi-agent version and capacity

Source owners:

- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/session/multi_agents.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/models-manager/models.json`

The protocol values are `disabled`, `v1`, and `v2`. An enabled
`features.multi_agent_v2` is an unconditional V2 override. Otherwise the model
catalog value wins, then the legacy collaboration feature determines V1 or
disabled. V2's configured maximum includes the root; the V1 agent limit counts
spawned threads. Forge leaves `features.multi_agent_v2` unset and pins its model
catalog entries to V1.

V2 injects root/subagent usage hints and supports full-history forks. This is a
different contract from Forge's registered V1 roles and bounded child context;
Forge does not emulate both surfaces.

## Model instructions and Responses Lite

Source owners:

- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/client.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/protocol/src/openai_models.rs`

`model_instructions_file` is a supported configuration input loaded into base
instructions. On standard Responses those base instructions occupy the request
instructions field. On Responses Lite, Codex rebuilds tools and base
instructions as prompt-side developer items and strips image detail settings.
Forge intentionally pins `use_responses_lite = false` for its GPT-5.6 entries so
its replacement identity uses standard Responses semantics.

## Compaction and goals

`compact_prompt` and `experimental_compact_prompt_file` are supported inputs.
Local/custom compaction consumes the configured prompt, while hosted behavior
may use remote compaction. Forge does not enable token-budget compaction because
0.151.0's nested-subagent accounting is accounting, not a durable application
checkpoint.

Goal accounting is session-scoped through shared `AgentControl`. Nested agent
usage can now exhaust the root goal budget and causes
`SessionBudgetExceeded`. This validates budget reporting; it does not authorize
Forge to resume or schedule agents.

## 0.151.0 configuration adopted by Forge

| Capability | Forge decision |
| --- | --- |
| Optional MCP startup grace | Leave native default unless a measured startup issue requires configuration |
| Extension MCP result replacement | No Forge shim; extension-owned capability |
| Project plugin catalogs | Installer and doctor must tolerate repository-specific catalog composition |
| Restored permissions | Rely on native profiles; never weaken through Forge hooks |
| Model switch/fallback plans | Keep role model/effort explicit and validate effective configuration |
| Remote sandbox path semantics | Avoid host-path inference in Forge policy |
| Structured MCP errors | Preserve native error structure |
| Root goal accounting | Treat nested usage as part of the root budget |
| Guardian classification freshness | Do not cache or duplicate authorization in Forge |
