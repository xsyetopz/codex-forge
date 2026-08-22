---
name: forge-setup
description: Codex Forge installation, repair, override restoration, inspection, and uninstall workflows.
---

# Forge Setup

## Use this skill

- Install, repair, inspect, upgrade, revert local overrides, or uninstall Codex Forge user configuration.
- Don't use for ordinary repository implementation, debugging, review, or prompt-policy design.

## Rules

- Locate the plugin root from the loaded skill path and never guess another copy.
- Preserve unrelated user configuration and use hashed source-to-target mappings for managed files.
- Run doctor before repair or upgrade; do not bypass backups, validation, or override preservation.
- Install optional tools only within the setup workflow or when an explicitly invoked workflow requires them.

## Steps

1. Load the lifecycle procedure and run `python3 <plugin-root>/scripts/install.py doctor` for inspection, repair, or upgrade.
2. Run `install` for setup, adding `--no-tools` only when the user explicitly declines optional tools.
3. Run `revert` only when the user wants mapped local overrides replaced by current plugin sources.
4. Run `uninstall` to remove Forge-owned state and restore unchanged preexisting files.
5. Return the resolved Codex home, changed files, backup, command results, and warnings.

## Resources

- Start with the [reference router](references/index.md) for lifecycle and hashed-file semantics.
- Contract and cases are in [assets/contract.json](assets/contract.json) and [evals/evals.json](evals/evals.json).

## Verify

- Done means doctor reflects the requested state and unrelated configuration remains intact.
- Run `python3 scripts/check.py` from this package and the repository installer regression tests.
- Mark Codex CLI, optional-tool, network, or user-home integration checks `UNVERIFIED` when unavailable.
