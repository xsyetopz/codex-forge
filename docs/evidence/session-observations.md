# Local Codex session observations

This evidence is derived from local `~/.codex` session metadata and rollout
JSONL. Raw prompts, credentials, authentication state, and full transcripts are
not copied into the repository.

## Snapshot (2026-08-31)

- 53 rollout JSONL files were present under `~/.codex/sessions`.
- `session_index.jsonl` contained 14 entries.
- `history.jsonl` contained 21 entries.
- A bounded scan of event/response text found the incident vocabulary
  `repair_worker`, `awaiting_recheck`, blocked Stop/PreToolUse hooks, and native
  close/spawn agent calls.
- The session containing the explicit “kill that agent” instruction recorded
  repeated `repair_worker` feedback after that instruction.

These counts describe a mutable local snapshot and include repeated event
renderings; they are not usage metrics.

## Finding: workflow state overrode new user intent

The incident sequence was:

1. a reviewer reported a failure and Forge persisted a repair phase;
2. the user explicitly terminated agent work;
3. a broad PreToolUse hook required another reviewer/worker action;
4. Stop hooks continued to request repair work, preventing clean turn
   completion.

Root causes confirmed in the then-current Forge code:

- mandatory lifecycle state could authorize follow-up work;
- the spawn-boundary hook also matched `send_input`, `wait_agent`, and
  `close_agent`, then applied spawn-only validation to those calls;
- Stop/SubagentStop were treated as passive lifecycle notifications even though
  Codex 0.151.0 gives them continuation control.

The repair removes the workflow state, narrows PreToolUse to spawn only, removes
the Stop hook, and leaves native cancellation/control tools unobstructed.

## Evidence policy

One session can justify a regression test for the observed failure. It cannot
justify a universal rule about every agent workflow or model. New prompt policy
requires either repeated observations or an independently established contract;
deterministic runtime failures should be fixed at the owning code boundary.

## Finding: social repair displaced operational recovery

On September 1, 2026, a coding-agent session was corrected after invoking
PCSX2 with an unverified `--help` argument and causing a user-visible dialog.
The response shifted into a human social-repair script: it opened with
agreement, described personal fault, promised future restraint, asserted that
the process was no longer running, and directed the user to dismiss the dialog.

The observed failure has two separate parts:

1. the earlier invocation inverted the user's stated check-before-use order;
2. the recovery response prioritized apology, reassurance, and personal reform
   over evidence-bounded operational state.

This is one coding-agent observation. Studies of apology preferences among
general chatbot users in staged conversational-error scenarios do not establish
preferences, trust outcomes, or operational effectiveness for coding-agent
operators managing real tool side effects. They can describe apology as a
social interface, but they are not an acceptance oracle for Forge.

The narrow owner is the base Output contract. It now requires execution-failure
reporting as an operational task-state update centered on observed state,
material impact, containment evidence, and required user action. The existing
Goal contract continues to own the preceding check-before-use order inversion.
Live-model behavior remains `UNVERIFIED` until an isolated runtime evaluation
observes the recovery response.
