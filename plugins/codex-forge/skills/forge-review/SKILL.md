---
name: forge-review
description: Explicit `$forge-review` workflow for candidate changes, test design or repair, and visible UI verification.
license: MIT
---

# Forge Review

## Workflow

1. Freeze the candidate and define the audit boundary, expected behavior, and oracle before judging it.
2. For a code-change review, read [the code review workflow](references/code-review.md). For test design or repair, read [the test design workflow](references/test-design.md). For visible UI verification, read [the UI verification workflow](references/ui-verification.md).
3. Trace changed contracts to their consumers and cover the complete stated scope.
4. Verify each finding with source or runtime evidence. When fixes are explicitly authorized, repair the smallest causal owner and re-check affected states.
5. Return actionable findings ordered by consequence. When none remain, state the checked criteria and material residual uncertainty.

## Gotchas

- Review-only work preserves the candidate unchanged.
- Prioritize correctness, regression, security, concurrency, data loss, accessibility, and contract failures over subjective style.
- Tests encode product behavior rather than the current implementation or checker shape.
- Static inspection establishes static evidence. Keep behavioral, integration, and visual claims tied to their own evidence.
- Use `$forge-deliver` for authorized implementation and `$forge-debug` for unknown root causes.
