# UI verification workflow

1. Translate supplied requirements into visible states, interactions, breakpoints, and accessibility criteria.
2. Exercise the actual target environment when available and capture evidence for each required state.
3. Separate interaction correctness from appearance and inspect responsive states independently.
4. After a fix, re-check the changed state and adjacent states sharing the same component or layout rule.
5. Label browser, screenshot, device, or visual evidence unavailable in the current environment as unverified.
