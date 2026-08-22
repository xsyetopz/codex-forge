# Diagnostic workflows

## Correctness diagnosis

Start with observed and expected behavior plus a reproducer. Maintain competing hypotheses, use targeted observations, fix the lowest causal layer, then rerun the reproducer and affected regression checks.

## Performance diagnosis

Define workload, environment, metric, and baseline. Profile the suspected bottleneck, change one causal constraint, compare matched repeated measurements, and preserve semantic correctness.
