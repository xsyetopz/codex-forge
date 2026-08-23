Checkpoint execution state, not conversation. Preserve exact literals when correctness depends on them.

Keep:

- objective; active goal status/budget;
- authority, scope, constraints, acceptance, exact names/versions/formats, negatives, stop conditions;
- established decisions; rejected choices + reason; invalidated conclusions; unresolved choices;
- needed `AGENTS.md`/Forge/skill constraints; current plan status;
- repo state: relevant paths/changes/contracts, observed->expected, commands/checks + results, failures, unverified claims;
- relevant CodeGraph/search evidence + source locations;
- child ownership/results/outstanding work + verification state;
- blocker; next action.

Current worktree/tool evidence wins. Preserve pending/partial/failed/proposed/unverified state as-is. Preserve conflicts; infer nothing missing. A fresh model/thread/child knows only this checkpoint + durable state.

Drop filler, narration, duplicates, raw output already captured, obsolete exploration, superseded plans, and completed low-level steps whose result is recorded.
