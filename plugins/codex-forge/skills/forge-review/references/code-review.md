# Code review workflow

1. Inspect the full candidate diff and the pre-change behavior it alters.
2. Trace every changed contract to callers, consumers, configuration, and affected tests.
3. Reproduce suspected failures when a focused oracle is available.
4. Report actionable, evidence-backed findings with the affected location and consequence.
5. Preserve each valid finding when later findings reveal additional consequences.
