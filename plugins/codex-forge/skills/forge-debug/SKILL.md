---
name: forge-debug
description: Root-cause and performance diagnosis from reproducible evidence; excludes known-cause implementation work.
---

# Forge Debug

## Use this skill

- Diagnose and fix an unknown failure, regression, flaky behavior, cross-file bug, or measured performance problem.
- Don't use when the cause and change are already bounded; route implementation to `$forge-deliver` and review-only requests to `$forge-review`.

## Rules

- Establish observed behavior, expected behavior, and the strongest available reproducer before editing.
- Maintain a small hypothesis set and eliminate candidates with targeted evidence.
- For performance work, establish workload, metric, environment, and baseline before optimization.
- Fix the lowest causal owner; do not hide deterministic defects with retries, swallowed errors, or broader rewrites.

## Steps

1. Record the reproducer, oracle, scope, and whether the defect is correctness or performance related.
2. Load the matching procedure from the reference router and trace outward only when evidence requires it.
3. Test competing hypotheses, identify the causal owner, and implement the smallest authorized repair.
4. Re-run the reproducer and one affected-boundary regression batch; compare matched measurements for performance claims.
5. Return root cause, fix, evidence, and remaining uncertainty.

## Resources

- Start with the [reference router](references/index.md) for correctness and performance diagnosis procedures.
- Contract and cases are in [assets/contract.json](assets/contract.json) and [evals/evals.json](evals/evals.json).

## Verify

- Done means the causal mechanism is supported and the reproducer passes, or a concrete external blocker is identified.
- Run `python3 scripts/check.py` from this package plus the reproducer and focused regression checks.
- Mark profiler, repeated-trial, integration, or external evidence `UNVERIFIED` when unavailable.
