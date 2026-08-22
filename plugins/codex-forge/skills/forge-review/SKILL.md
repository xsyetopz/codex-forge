---
name: forge-review
description: Code review, test design, and UI verification against explicit acceptance criteria.
---

# Forge Review

## Use this skill

- Review a candidate change, design or repair tests, or verify visible UI behavior against explicit criteria.
- Don't edit during review-only work. Route authorized implementation to `$forge-deliver` and unknown failures to `$forge-debug`.

## Rules

- Freeze the candidate and establish the audit boundary, expected behavior, and oracle before judging it.
- Prioritize correctness, regression, security, concurrency, data loss, accessibility, and contract failures over subjective style.
- Tests must encode product behavior rather than the current implementation or checker shape.
- Visible claims require actual target states and breakpoints when the environment is available.

## Steps

1. Classify the request as code review, test-focused verification, or UI verification and load the routed procedure.
2. Trace changed contracts to consumers and inspect the full stated scope, not only the first finding.
3. Verify findings with source or runtime evidence; keep functional, visual, and static evidence distinct.
4. If fixes are authorized, change the smallest causal owner and re-check affected states.
5. Return actionable findings ordered by consequence, or state checked criteria and residual uncertainty when none remain.

## Resources

- Start with the [reference router](references/index.md) for review, testing, and UI procedures.
- Contract and cases are in [assets/contract.json](assets/contract.json) and [evals/evals.json](evals/evals.json).

## Verify

- Done means the stated criteria and scope were exhausted with evidence and no finding was weakened or suppressed.
- Run `python3 scripts/check.py` from this package plus the repository-native focused checks.
- Mark browser, screenshot, device, integration, or behavioral evidence `UNVERIFIED` when unavailable.
