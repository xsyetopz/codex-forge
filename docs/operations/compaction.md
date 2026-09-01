# Context compaction

This document records the observed continuity failure, its causal mechanism in Codex CLI 0.149.1, and why Codex Forge 0.1.0-alpha.4 uses standard summarizing compaction instead of token-budget context resets. It is documentation only and isn't injected into agent turns.

## Observed incident

The user-visible sequence was:

```text
Context compacted
> Understood. What would you like me to work on?
```

The local rollout established the following sequence:

1. Forge had installed `[features.token_budget] enabled = true`.
2. Near the context limit, Codex instructed the agent to save continuity state with a `notes` tool and then call `new_context`.
3. The agent queried its available tools for `notes` or `history`; neither was present.
4. The agent wrote a detailed checkpoint to `/tmp/codex-forge-checkpoint.md` and called `new_context` anyway.
5. The tool reported that the new window would start without summarizing conversation history.
6. The new window received neither the prior conversation nor the arbitrary `/tmp` checkpoint, so the model asked the user for a task it had already been given.

The compaction banner was accurate at the lifecycle level but obscured the important distinction: this was a fresh token-budget context window, not a standard summary-backed compaction.

## Causal mechanism

Codex CLI 0.149.1 has two materially different paths that can produce a compaction lifecycle event:

| Path | Upstream behavior | Continuity consequence |
| --- | --- | --- |
| Standard local compaction | Reads `compact_prompt` or the built-in summarization prompt and generates replacement history. See [`compact.rs`](https://github.com/openai/codex/blob/rust-v0.149.1/codex-rs/core/src/compact.rs#L111-L140). | The next model receives a summary and can continue the active task. |
| Token-budget compaction | Explicitly skips model/server summarization and installs a fresh context window. See [`compact_token_budget.rs`](https://github.com/openai/codex/blob/rust-v0.149.1/codex-rs/core/src/compact_token_budget.rs#L21-L25) and its identical auto-compaction contract at [lines 47-51](https://github.com/openai/codex/blob/rust-v0.149.1/codex-rs/core/src/compact_token_budget.rs#L47-L51). | Continuity depends on separate durable state being available and correctly restored. |

Enabling `Feature::TokenBudget` also exposes `new_context` and `get_context_remaining` directly to the model; the registration is visible in [`spec_plan.rs`](https://github.com/openai/codex/blob/rust-v0.149.1/codex-rs/core/src/tools/spec_plan.rs#L1079-L1082). Forge enabled that feature but did not provide the `notes` service assumed by the injected rollover guidance. The feature/configuration mismatch was therefore the lowest causal owner.

The custom compact prompt was not the cause of this incident: token-budget compaction bypassed summarization, so that prompt never had an opportunity to preserve the task.

## What Forge uses

### Standard summarizing compaction

Forge leaves `features.token_budget` unset so Codex uses summary-producing compaction instead of a fresh token-budget context reset.

On OpenAI-hosted and Azure-hosted models, Codex selects remote compaction. The local `compact_prompt` / `experimental_compact_prompt_file` override is consumed by the local/custom-provider branch, not by the hosted remote-compaction branch. Forge therefore treats its custom compact prompt as a local-provider fallback and documented handoff specification, not as the continuity guarantee for normal hosted Codex sessions. Hosted continuity instead relies on Codex's remote compaction plus Forge's independently persisted orchestration handoffs and deterministic lifecycle recovery.

Codex CLI 0.151.0 V1 children clone the parent-effective compact prompt. Their
automatic and manual local compaction uses that inherited value, while
role-local `compact_prompt` and `experimental_compact_prompt_file` settings are
excluded from the applied role override. Per-role compaction prompts are
therefore unavailable without changing Codex source. Hosted remote compaction
continues to bypass the local Forge prompt for both root and child sessions.

### A self-contained execution checkpoint

`plugins/codex-forge/assets/compact-prompt.md` asks the compaction model to preserve the objective, request mode, exact user/compatibility decisions, constraints, worktree state, validation, CodeGraph/source evidence, bounded child handoffs, blockers, and a concrete next action.

This prompt is guidance, not deterministic storage. It controls local/custom-provider summarization when that branch is selected and records Forge's desired handoff content for audits and fallback providers. It does not override OpenAI-hosted remote compaction.

### Stock Codex prompt versus Forge

The upstream Codex compaction template is intentionally generic: it asks the
summarizer for current progress/decisions, important context/constraints,
remaining work, and critical continuation data, then asks for a concise
handoff. The current upstream template is nine lines / 426 bytes at
[`codex-rs/prompts/templates/compact/prompt.md`](https://github.com/openai/codex/blob/main/codex-rs/prompts/templates/compact/prompt.md),
and `SUMMARIZATION_PROMPT` includes that template from the prompts crate.

Forge keeps the same handoff purpose for the local/custom-provider branch but makes the continuation contract task-execution-specific. Its 111-word override preserves `!RAW` versus
normalized request mode, exact user and compatibility decisions, acceptance
and stop conditions, AGENTS/Forge/skill constraints, source/CodeGraph evidence,
runtime ids, bounded child handoffs, unresolved choices, and one
next executable action. It explicitly collapses superseded exploration and
low-level narration into durable results. This is an override, so the Forge
prompt includes every stock handoff category it still needs rather than
assuming additive behavior.

### Lean Forge model instructions plus a developer layer

Codex Forge 0.1.0-alpha.4 installs the lean 315-word Forge model-instruction layer from
`plugins/codex-forge/assets/model-instructions.md` to
`$CODEX_HOME/forge/model-instructions.md` and points
`model_instructions_file` at that exact target. Forge adds its runtime
orchestration layer from `plugins/codex-forge/assets/developer-instructions.txt`
through `developer_instructions`. Local/custom-provider compaction uses the checked-in compact prompt for the conversation handoff; hosted compaction uses Codex's remote summary path. Independently, Forge continuity state persists bounded child terminal handoffs and active `!RAW` text for resume/compact reinjection. The Forge model layer remains their consumer.

## Current configuration boundaries

| 0.1.0-alpha.4 state | Reason |
| --- | --- |
| Summary-backed rather than token-budget compaction | `features.token_budget` remains unset. Hosted models use Codex remote compaction; local/custom providers use the local summary path. |
| Local/custom-provider execution checkpoint | `assets/compact-prompt.md` records request mode, objective, exact decisions, worktree state, validation, Forge/CodeGraph evidence, child handoffs, blockers, and the next action when the local branch is selected. |
| Forge model instruction layer | `assets/model-instructions.md` is installed at `$CODEX_HOME/forge/model-instructions.md` and selected through `model_instructions_file`. |
| Forge developer instruction layer | `assets/developer-instructions.txt` is installed through `developer_instructions`. |
| Durable handoff state | Local/custom-provider compaction uses the Forge prompt; hosted compaction uses Codex's remote summary. Forge continuity state independently retains bounded child terminal handoffs and active `!RAW` text for resume/compact recovery. |

Token-budget mode can be reconsidered when the target Codex version provides a durable checkpoint service in the active tool surface, the rollover guidance matches that service, and an integration test demonstrates that an unfinished task continues without user restatement.

### Codex CLI 0.150.1 and 0.151.0 compatibility

Codex CLI 0.150.1 keeps the compaction paths above and enables retained-image
budgeting for remote compaction by default. Retained images now count against
the existing remote-compaction token budget, and older images are trimmed as
needed. This patch improves bounded image retention; it does not change Forge's
selection of standard summary-backed compaction or provide a model-callable
pause/resume goal transition. See the
[0.150.1 release](https://github.com/openai/codex/releases/tag/rust-v0.150.1)
and the tagged
[`CompactionImageBudget` branch](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/core/src/compact_remote_v2.rs#L308-L318).

Codex CLI 0.151.0 preserves those compaction interfaces and counts nested
subagent token usage against the root goal budget. That accounting makes the
native goal ceiling more truthful for Forge's one-depth V1 delegation, while
the retained-image behavior remains upstream-owned. The release also improves
per-repository plugin catalog configuration, optional MCP startup grace,
model-specific tool/fallback selection, permission and remote-sandbox
restoration, and MCP result/error handling. Forge consumes these through the
native CLI and does not duplicate them in prompts or speculative configuration.
See the [0.151.0 release](https://github.com/openai/codex/releases/tag/rust-v0.151.0).

The acceptance boundary remains unchanged: Forge leaves `features.token_budget` unset and uses deterministic root goal budgets plus summary-backed compaction. Hosted summary content remains upstream-owned; Forge's durable orchestration state is the independent recovery layer it can enforce. Neither 0.150.1 nor 0.151.0 provides a reason to re-enable Forge's prior token-budget reset configuration, so manual `model_context_window` or `auto_compact` limits are not installed from community snippets.

## Ownership and regression protection

| Concern | Canonical Forge owner | Verification |
| --- | --- | --- |
| Select standard rather than token-budget compaction | `assets/config-template.toml` and `scripts/installer/owners/config.mjs` | Installer test asserts that a fresh Forge configuration doesn't contain `features.token_budget`. |
| Specify the local/custom-provider checkpoint | `assets/compact-prompt.md` | Installed asset mapping and repository contract validation; hosted compaction does not consume this local prompt. |
| Select lean Forge model instructions | `assets/model-instructions.md` and `scripts/installer/owners/config.mjs` | Installer mapping, exact managed path, and repository contract validation. |
| Add lean Forge developer instructions | `assets/developer-instructions.txt` and `scripts/installer/owners/config.mjs` | Installed asset mapping and repository contract validation. |
| Recover active execution evidence after resume/compaction | `scripts/lib/continuity-state.mjs`, `hooks/subagent-stop/record-handoff.mjs`, `hooks/user-prompt-submit/preserve-raw.mjs`, and `hooks/session-start/restore-continuity.mjs` | handoff tests persist bounded child results plus `!RAW` state and reinject them on resume/compact. |
| Upgrade an existing installation | Installer managed-block replacement | Reinstall removed Forge's prior token-budget table while preserving unrelated user configuration. |

## Validation performed

- Repository contract, installer, schema, and skill validation cover the alpha.4 configuration and distributed assets.
- Hook/plugin schemas and all seven skill packages validated.
- A local Forge reinstall removed `features.token_budget` from the effective configuration.
- `bun install.mjs doctor --json` reported the installation healthy and current.
- A forced live context-exhaustion run was not performed, so end-to-end rollover behavior remains **UNVERIFIED**.
