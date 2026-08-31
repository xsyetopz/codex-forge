# Architecture

Codex Forge has four runtime owners with one-way dependencies.

| Owner | Responsibility | Depends on |
| --- | --- | --- |
| Plugin assets | Base identity, developer routing, model catalog, roles, rules | Codex 0.151.0 configuration contracts |
| Installer | Transactional ownership of user-level Forge files and configuration | Plugin assets and filesystem transaction helpers |
| Hooks | Small event adapters for continuity and spawn-boundary enforcement | Codex hook JSON contract and `scripts/lib/continuity-state.mjs` |
| Tests | Executable product and lifecycle contracts | Canonical assets and public entrypoints |

## Hook boundary

Hook paths follow `scripts/hooks/<hook-type>/<behavior>.mjs`. The directory owns
the Codex event and the filename states the behavior. Shared state and policy
belong under `scripts/lib/`; a directory such as `hooks/orchestration/` is not a
valid owner because it mixes several event lifecycles behind an implementation
label.

Forge hooks are adapters, not a workflow scheduler. The current surface is:

| Event | Behavior |
| --- | --- |
| `SessionStart` | Restore bounded continuity and report CodeGraph availability |
| `PreToolUse` | Validate only agent spawn boundaries |
| `UserPromptSubmit` | Preserve explicit `!RAW` task text |
| `SubagentStart` | Record the child and provide its bounded role contract |
| `SubagentStop` | Record the final bounded handoff |
| `SessionEnd` | Clear per-session continuity state |

Forge deliberately has no `Stop` hook. Codex 0.151.0 treats a blocking Stop or
SubagentStop hook as a continuation request, so a mandatory worker/reviewer
state machine at that boundary can override a later user instruction to stop.
Agent interruption, closure, waiting, and messaging remain native Codex tools
and have no Forge PreToolUse matcher.

## Continuity boundary

`scripts/lib/continuity-state.mjs` records observations only: bounded child
status/handoffs and explicit `!RAW` text. It cannot authorize a worker, reviewer,
repair, or recheck. Native Codex owns agent execution and cancellation. This
keeps stale Forge state from creating work after user cancellation.

## Migration decision

The rejected design persisted a mandatory linear lifecycle and used blocking
hooks to drive it. Repairing that state machine would retain an unnecessary
authority layer and continue coupling cancellation to review policy. The chosen
design deletes the scheduler, preserves only continuity data, and lets prompts
request review when the task warrants it. Rollback is the Git history of the
removed hooks and tests; there is no runtime compatibility shim.
