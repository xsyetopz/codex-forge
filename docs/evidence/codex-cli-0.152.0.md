# Codex CLI 0.152.0 source audit

Forge targets `rust-v0.152.0` exactly. The annotated tag object
`7f6bee13af649d0da23ac0c2bf5c83f571fcd611` points to source commit
`316795b3cf2a45e90d121d9f46499d4658b2645c`. The `vendor/codex-cli`
submodule gitlink pins that exact commit; `rust-v0.152.0` is the corresponding
upstream annotated tag and was the latest stable `rust-v*` tag on September 1,
2026. `.gitmodules` uses shallow checkout mode. Git has no native submodule
setting for following the newest tag, so Forge advances the gitlink only after
auditing a specific stable release.

This document is the capability authority for Forge. External release link:
[Codex CLI 0.152.0](https://github.com/openai/codex/releases/tag/rust-v0.152.0).

## Complete 0.152.0 release delta

The release adds:

- Vim draft search with `/`, `?`, `n`, and `N`;
- actionable rate-limit banners;
- credential-refresh progress in the TUI and `codex exec`;
- package-style MCP server names;
- per-tool MCP `output_token_limit`;
- configurable app-server `thread/shellCommand` timeouts.

It fixes:

- Guardian preservation of user instructions, answers, and valid authorization
  across compaction;
- restored thread working directories and filesystem permissions;
- MCP cache, plugin-refresh, and authentication-header continuity;
- model-picker refresh without selection loss;
- Windows PowerShell, terminal-query, and older JediTerm failures;
- cloud-task credential protection against untrusted origins and redirects.

The release also makes `update_plan` opt-in, preloads plugin recommendations,
makes subagents inherit the root service tier, lets model metadata activate
token budgeting when configuration is silent, and moves proactive multi-agent
guidance into model-catalog metadata. The official tag comparison contains 90
commits and 300 changed paths relative to the previous release tags.

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
Forge 0.152.0 uses no Stop hook and never matches native close, interrupt, wait,
or send-input tools.

### Operational-recovery feasibility

The September 1, 2026 operational-recovery review checked whether Forge could
enforce factual recovery reporting without changing Codex source.

| Surface | What 0.152.0 permits | Boundary for Forge |
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

## V1 child instruction and role projection

Source owners:

- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/agent/role.rs`
- `codex-rs/core/src/agent/role_tests.rs`

A V1 spawn clones the parent turn's effective configuration, installs the
parent session's resolved base-instruction text, and refreshes live runtime
state. The selected role is then projected through an explicit whitelist.
Role-local `developer_instructions` replace the cloned parent value. Effective
role fields include model and reasoning settings, verbosity, personality,
selected feature reductions, and selected skill reductions. Subagents use the
root session service tier; role-local and spawn-request service tiers no longer
control it.

`model_instructions_file`, `compact_prompt`,
`experimental_compact_prompt_file`, and `sandbox_mode` can parse in a role file
but are absent from the projected override. The child therefore inherits the
parent base instructions, compact prompt, sandbox, and permissions. Provider,
approval, app, MCP, notification, and authority-expanding settings are likewise
excluded or restored from the live parent turn. Forge omits all ineffective
role fields rather than documenting them as child controls.

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
0.152.0's nested-subagent accounting is accounting, not a durable application
checkpoint.

V1 children retain the parent-effective `compact_prompt` in their cloned
configuration. Automatic and manual local compaction consume that inherited
value; role-local compact-prompt fields are dropped. Remote compaction and
token-budget context resets do not consume the local prompt.

Goal accounting is session-scoped through shared `AgentControl`. Nested agent
usage can now exhaust the root goal budget and causes
`SessionBudgetExceeded`. This validates budget reporting; it does not authorize
Forge to resume or schedule agents.

## 0.152.0 configuration adopted by Forge

### Config schema and TUI surfaces

Source owners:

- `codex-rs/core/config.schema.json`
- `codex-rs/config/src/types.rs`
- `codex-rs/tui/src/bottom_pane/status_line_setup.rs`
- `codex-rs/cli/src/doctor/title.rs`

Codex CLI 0.152.0 accepts `[tui].status_line` and
`[tui].terminal_title` as ordered string lists. Every Forge-selected identifier
is accepted by the 0.152.0 parsers. Forge writes the canonical status identifier
`context-used` rather than its accepted legacy alias `context-usage`; the
requested terminal-title aliases `project`, `status`, and `thread` remain valid
and normalize internally to `project-name`, `run-state`, and `thread-title`.

The editor schema directive is the first line of every Forge-generated
`config.toml` and uses the official `.json` URL. The 0.152.0 schema also defines
`exclude_slash_tmp`, `exclude_tmpdir_env_var`, and `writable_roots` under
`sandbox_workspace_write`; reinstall preserves these settings when migrating a
configuration that placed them inside the older Forge marker.

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
| Opt-in `update_plan` | Enable `[tools.update_plan]` because Forge uses plan state as an observable coordination surface |
| Root-owned service tier | Keep `service_tier = "flex"` at the root and remove ineffective role-local duplicates |
| Model-owned token-budget defaults | Pin `features.token_budget = false`; an omitted value now permits the model catalog to activate fresh-window resets |
| Model-catalog multi-agent guidance | Keep `include_collaboration_mode_instructions = false` and retain Forge's explicit root delegation contract |
