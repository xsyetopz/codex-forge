---
name: forge-debug
description: Explicit `$forge-debug` workflow for unknown failures, regressions, flaky behavior, cross-system bugs, and measured performance problems.
license: MIT
---

# Forge Debug

## Workflow

1. Record the observed behavior, expected behavior, smallest reproducer, and acceptance oracle before editing.
2. Keep a short list of competing hypotheses. Gather one discriminating observation at a time and trace outward as evidence requires.
3. For measured latency, throughput, memory, or resource work, read [the performance workflow](references/performance.md) before changing code.
4. Identify the lowest causal owner. Apply the smallest authorized repair there, or report the supported cause when the request is diagnostic only.
5. Re-run the reproducer, then one affected-boundary regression batch. Report the causal mechanism, repair, commands and exit statuses, and material uncertainty.

## Gotchas

- The narrow reproducer should change from failing to passing for the predicted reason; a broad green suite alone provides weaker causal evidence.
- Prefer a causal repair over retries, swallowed errors, wider timeouts, or unrelated rewrites.
- Performance claims require a matched workload, environment, metric, baseline, and repeated measurements.
- Use `$forge-deliver` for bounded known-cause changes and `$forge-review` for review-only requests.
