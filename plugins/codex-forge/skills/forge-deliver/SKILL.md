---
name: forge-deliver
description: Repository implementation, refactoring, and dependency migration; excludes diagnosis and review-only work.
---

# Forge Delivery

## Use this skill

- Implement a bounded feature or fix, perform a requested structural refactor, or migrate a dependency.
- Don't use for unknown root causes, review-only work, setup, prompt policy, or research without implementation; route those to `$forge-debug`, `$forge-review`, `$forge-setup`, `$forge-prompt-audit`, or `$forge-research`.

## Rules

- Preserve explicit constraints, public contracts, repository ownership, and generated-source boundaries.
- Establish an observable success condition before nontrivial edits; for migrations, record invariants and dependency order.
- Use current upstream evidence for versioned dependencies. Don't choose an unstated major version or add an unsupported compatibility shim.
- Keep changes within the requested outcome and stop before adjacent cleanup.

## Steps

1. Resolve repository instructions, source owners, callers, contracts, and the focused acceptance oracle.
2. Classify the change as ordinary delivery, structural migration, or dependency migration and load the matching procedure from the reference router.
3. Implement through canonical sources, changing both sides of affected contracts and sequencing shared contracts before dependents.
4. Run the narrowest meaningful validation, then only affected integration checks.
5. Report changed boundaries, observable result, commands, and material limitations.

## Resources

- Start with the [reference router](references/index.md); it routes delivery, refactoring, and dependency procedures.
- Contract and routing cases are package-local in [assets/contract.json](assets/contract.json) and [evals/evals.json](evals/evals.json).

## Verify

- Done means the requested behavior or structural state is present and affected contracts pass without unrelated changes.
- Run `python3 scripts/check.py` from this package and the repository-native focused tests.
- Report static, behavioral, integration, and external-source evidence separately; mark any unavailable category `UNVERIFIED`.
