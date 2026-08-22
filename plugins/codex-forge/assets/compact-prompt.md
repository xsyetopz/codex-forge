Compact the thread into durable execution state for another model to resume. This is a state checkpoint, not a narrative summary. Preserve exact literals when they affect correctness.

Retain:

- current user objective; if a persisted goal is active, its exact objective, status, and budget;
- task authority: whether work is read-only or modifications are authorized, plus explicit scope, permissions, constraints, acceptance criteria, requested versions, names, formats, output requirements, and stop conditions;
- rejected assumptions/approaches and why they were rejected;
- decisions established by the user or evidence, clearly separated from proposals and unresolved choices;
- conclusions invalidated by newer evidence, including enough provenance to prevent the invalid conclusion from being revived;
- applicable `AGENTS.md`, Forge, and skill constraints required for remaining work;
- current `update_plan` steps and statuses without inventing progress;
- repository execution state: relevant paths, changed files, interfaces/contracts, observed vs. expected behavior, migrations, commands already run, validation results, failures, and claims still unverified;
- repository-intelligence/search findings still relevant, including CodeGraph findings and exact source locations requiring inspection or verification;
- delegation state: each child's objective/ownership, handoff criteria, returned evidence, outstanding work, and whether its results were independently verified;
- blockers, unresolved questions, and the next concrete action.

Rules:

- Current worktree and verified tool state outrank older conversational claims.
- MUST NOT convert pending, failed, partial, proposed, or unverified work into completed or verified work.
- MUST NOT revive rejected assumptions, superseded plans, or invalidated conclusions.
- MUST NOT infer omitted decisions, requirements, compatibility constraints, or completion.
- Preserve negative conditions, exact identifiers, versions, paths, commands, expected/observed values, and stop/escalation conditions when they remain operationally relevant.
- A fresh model, child, thread, or resumed session MUST NOT be assumed to remember omitted context.
- If evidence conflicts, preserve the conflict and its sources rather than resolving it by guesswork.
- If a goal is active, optimize the checkpoint for resuming that exact goal.

Drop:

- conversational filler;
- repeated explanations and progress narration;
- obsolete exploration and abandoned alternatives whose rejection is already recorded;
- duplicated/raw tool output once its relevant evidence is captured;
- superseded plans;
- completed low-level steps whose resulting state and validation are already recorded.

Output a concise, structured checkpoint containing only state needed to continue safely.
