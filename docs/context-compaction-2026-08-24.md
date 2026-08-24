# Context compaction findings - 2026-08-24

This document records the observed continuity failure, its causal mechanism in Codex CLI 0.149.1, and why Forge uses standard summarizing compaction instead of token-budget context resets. It is documentation only and is not injected into agent turns.

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

### A post-compaction continuity instruction

`plugins/codex-forge/assets/model-instructions.md` tells the resumed model to continue the active task from preserved state without greeting or requesting the task again. This covers the consumer side of the handoff; the compact prompt covers the producer side.

## What Forge avoids

| Avoided choice | Why it is avoided |
| --- | --- |
| Enabling `[features.token_budget]` by default | In Codex CLI 0.149.1 it replaces summarization with a fresh window. Without a verified durable notes/history service, that can discard the active task. |
| Treating a file in `/tmp` as cross-window memory | Environment state may survive, but a new model does not discover or read an arbitrary file automatically. A checkpoint is useful only when the resumed context receives its location and an instruction to load it. |
| Fixing the symptom only in the compact prompt | The failing path bypasses the compact prompt entirely. Prompt changes alone cannot repair a configuration path that never summarizes. |
| Blocking `new_context` with a PreToolUse hook as the primary repair | A hook would reject one model-invoked reset but would not repair automatic token-budget rollover. Removing the incompatible feature selects the correct path at its owner. |
| Assuming the compaction banner proves a summary exists | Both standard summarization and summary-free token-budget resets emit the compaction lifecycle. The rollout and active configuration must distinguish them. |
| Claiming live rollover behavior from static tests | Configuration and prompt tests prove the selected setup, not a complete long-running model session. Live context exhaustion remains a separate integration observation. |

Token-budget mode can be reconsidered when the target Codex version provides a durable checkpoint service in the active tool surface, the rollover guidance matches that service, and an integration test demonstrates that an unfinished task continues without user restatement.

## Ownership and regression protection

| Concern | Canonical Forge owner | Verification |
| --- | --- | --- |
| Select standard rather than token-budget compaction | `assets/config-template.toml` and `scripts/installer/config.mjs` | Installer test asserts that a fresh Forge configuration does not contain `features.token_budget`. |
| Produce a useful checkpoint | `assets/compact-prompt.md` | Installed asset mapping and repository contract validation; model quality remains behavioral evidence. |
| Resume instead of asking for the task | `assets/model-instructions.md` | Installed asset mapping; a forced live rollover was not run. |
| Upgrade an existing installation | Installer managed-block replacement | Reinstall removed Forge's prior token-budget table while preserving unrelated user configuration. |

## Validation performed

- The complete unit suite passed: 194 tests.
- Hook/plugin schemas and all seven skill packages validated.
- A local Forge reinstall removed `features.token_budget` from the effective configuration.
- `bun install.mjs doctor --json` reported the installation healthy and current.
- A forced live context-exhaustion run was not performed, so end-to-end rollover behavior remains **UNVERIFIED**.
