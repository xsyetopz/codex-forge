# Context compaction findings - 2026-08-24

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

Forge leaves `features.token_budget` unset so Codex uses its standard compaction path. This is used because the standard path produces replacement history and honors `experimental_compact_prompt_file`.

### A self-contained execution checkpoint

`plugins/codex-forge/assets/compact-prompt.md` asks the compaction model to preserve the objective, constraints, decisions, worktree state, validation, blockers, and a concrete next action. It also states that the next model must continue the current task rather than ask the user to restate it.

This prompt is guidance, not deterministic storage. Its scope is the content and quality of a summary after the standard compaction path has actually selected it.

### Lean Forge model instructions plus a developer layer

Codex Forge 0.1.0-alpha.4 installs the lean 245-word Forge model-instruction layer from
`plugins/codex-forge/assets/model-instructions.md` to
`$CODEX_HOME/forge/model-instructions.md` and points
`model_instructions_file` at that exact target. Forge adds its runtime
orchestration layer from `plugins/codex-forge/assets/developer-instructions.txt`
through `developer_instructions`. The compact prompt produces the handoff while
the Forge model layer remains its consumer.

## Current configuration boundaries

| 0.1.0-alpha.4 state | Reason |
| --- | --- |
| Standard summary-backed compaction | `features.token_budget` remains unset, selecting Codex's summary-producing path and `experimental_compact_prompt_file`. |
| Self-contained execution checkpoint | `assets/compact-prompt.md` records objective, constraints, decisions, worktree state, validation, blockers, and the next action. |
| Forge model instruction layer | `assets/model-instructions.md` is installed at `$CODEX_HOME/forge/model-instructions.md` and selected through `model_instructions_file`. |
| Forge developer instruction layer | `assets/developer-instructions.txt` is installed through `developer_instructions`. |
| Durable handoff state | The compact prompt supplies the summary content; live context exhaustion remains a separate integration observation. |

Token-budget mode can be reconsidered when the target Codex version provides a durable checkpoint service in the active tool surface, the rollover guidance matches that service, and an integration test demonstrates that an unfinished task continues without user restatement.

### Codex CLI 0.150.1 compatibility

Codex CLI 0.150.1 keeps the compaction paths above and enables retained-image
budgeting for remote compaction by default. Retained images now count against
the existing remote-compaction token budget, and older images are trimmed as
needed. This patch improves bounded image retention; it does not change Forge's
selection of standard summary-backed compaction or provide a model-callable
pause/resume goal transition. See the
[0.150.1 release](https://github.com/openai/codex/releases/tag/rust-v0.150.1)
and the tagged
[`CompactionImageBudget` branch](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/core/src/compact_remote_v2.rs#L308-L318).

## Ownership and regression protection

| Concern | Canonical Forge owner | Verification |
| --- | --- | --- |
| Select standard rather than token-budget compaction | `assets/config-template.toml` and `scripts/installer/config.mjs` | Installer test asserts that a fresh Forge configuration doesn't contain `features.token_budget`. |
| Produce a useful checkpoint | `assets/compact-prompt.md` | Installed asset mapping and repository contract validation; model quality remains behavioral evidence. |
| Select lean Forge model instructions | `assets/model-instructions.md` and `scripts/installer/config.mjs` | Installer mapping, exact managed path, and repository contract validation. |
| Add lean Forge developer instructions | `assets/developer-instructions.txt` and `scripts/installer/config.mjs` | Installed asset mapping and repository contract validation. |
| Upgrade an existing installation | Installer managed-block replacement | Reinstall removed Forge's prior token-budget table while preserving unrelated user configuration. |

## Validation performed

- Repository contract, installer, schema, and skill validation cover the alpha.4 configuration and distributed assets.
- Hook/plugin schemas and all seven skill packages validated.
- A local Forge reinstall removed `features.token_budget` from the effective configuration.
- `bun install.mjs doctor --json` reported the installation healthy and current.
- A forced live context-exhaustion run was not performed, so end-to-end rollover behavior remains **UNVERIFIED**.
