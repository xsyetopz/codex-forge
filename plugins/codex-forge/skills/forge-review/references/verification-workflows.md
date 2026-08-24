# Verification workflows

## Code review

Freeze the candidate, trace changed contracts, complete the stated scope, and report only evidence-backed findings ordered by consequence.

## Test design

Define the behavior oracle, follow repository ownership and framework conventions, and use graph-derived impact context when available to select regression tests. Prefer a minimal behavioral test, treat regression risk as a first-class result, and use deterministic synchronization or repeated trials for timing claims.

## UI verification

Translate supplied requirements into visible criteria, inspect actual target states and breakpoints, separate interaction from appearance, and re-check affected states after fixes.
