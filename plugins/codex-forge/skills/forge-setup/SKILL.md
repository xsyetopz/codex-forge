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
2. Run `install` for setup or an override-preserving upgrade. Use `--replace` only when the user wants mapped local overrides replaced, `--purge-cache` when old cached Forge versions should be removed, and `--no-tools` only when the user explicitly declines optional tools.
3. After plugin installation or a hook-definition change, start a fresh Codex thread, run `/hooks`, review the exact Forge hook commands, and explicitly trust them through Codex. The installer may enable `features.hooks`, but it cannot inspect or grant runtime hook trust; `doctor` reports trust as `UNVERIFIED`/manual.
4. Run `revert` only when the user wants mapped local overrides replaced by current plugin sources.
5. Run `uninstall` to remove Forge-owned state and restore unchanged preexisting files; use `--purge` only for an explicit request to remove plugin registrations, overrides, backup history, and cached Forge installs.
5. Return the resolved Codex home, changed files, backup, command results, and warnings.

## Resources

- Start with the [reference router](references/index.md) for lifecycle and hashed-file semantics.
- Contract and cases are in [assets/contract.json](assets/contract.json) and [evals/evals.json](evals/evals.json).

## Verify

- Done means doctor reflects the requested state and unrelated configuration remains intact.
- Run `python3 scripts/check.py` from this package and the repository installer regression tests.
- Mark Codex CLI, optional-tool, network, or user-home integration checks `UNVERIFIED` when unavailable.
