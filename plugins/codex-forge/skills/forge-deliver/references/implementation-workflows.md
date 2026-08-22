# Implementation workflows

## Ordinary delivery

Locate the owner and acceptance oracle, implement one coherent bounded patch, change both sides of contracts, and validate the affected boundary.

## Structural migration

Record preserved behavior and the intended topology. Map dependencies, migrate shared contracts before dependents, keep mechanical movement attributable, and reject aliases unless a supported consumer requires them.

## Dependency migration

Identify the package-manager source of truth and requested target. Read current upstream migration guidance, update the minimum declarations and lock state, repair actual call sites, and run package plus affected integration checks.
