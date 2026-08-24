# Test design workflow

1. State the externally meaningful behavior and failure mode the test distinguishes.
2. Follow repository ownership and framework conventions; select the smallest affected regression boundary.
3. Prefer behavioral assertions and deterministic synchronization over implementation snapshots, sleeps, or repeated success alone.
4. When both states are available, verify that the test fails for the intended defect and passes after the causal repair.
