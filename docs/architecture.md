# Architecture

Codex Forge has four runtime owners with one-way dependencies.

| Owner | Responsibility | Depends on |
| --- | --- | --- |
| Plugin assets | Base identity, developer routing, model catalog, roles, rules | Codex 0.153.1 configuration contracts |
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
| `PreToolUse` | Validate agent spawn boundaries and atomically reserve bounded admissions |
| `SubagentStart` | Record the child without adding prompt context |
| `SubagentStop` | Record the final bounded handoff |
| `SessionEnd` | Clear per-session continuity state |

Forge deliberately has no `Stop` hook. The audited Codex path treats a blocking Stop or
SubagentStop hook as a continuation request, so a mandatory worker/reviewer
state machine at that boundary can override a later user instruction to stop.
Agent interruption, closure, waiting, and messaging remain native Codex tools
and have no Forge PreToolUse matcher.

Child behavior comes from the inherited base instructions plus the selected
role TOML. The SubagentStart hook persists lifecycle state only; reviewer,
repository-intelligence, handoff, and delegation prose remains at its prompt or
enforcement owner instead of being repeated as hook context.

## Continuity boundary

`scripts/lib/continuity-state.mjs` stores two classes of state. Spawn admissions
are atomic enforcement records capped at six per thread, including one routine
reviewer and one hard-tail reviewer. Child status and handoffs remain
observations. The state never schedules a worker, reviewer, repair,
or recheck. Native Codex owns agent execution and cancellation, so stale Forge
state cannot create work after user cancellation.

Goal creation and status updates are root-owned. The PreToolUse hook returns a
Forge child's Goal mutation request to the root, while handoffs remain bounded
evidence. Ambiguity and incomplete specifications remain root engineering work
rather than child-controlled Goal blockers.

## Migration decision

The rejected design persisted a mandatory linear lifecycle and used blocking
hooks to drive it. Repairing that state machine would retain an unnecessary
authority layer and continue coupling cancellation to review policy. The chosen
design deletes the scheduler, preserves only continuity data, and lets prompts
request review when the task warrants it. Rollback is the Git history of the
removed hooks and tests; there is no runtime compatibility shim.
