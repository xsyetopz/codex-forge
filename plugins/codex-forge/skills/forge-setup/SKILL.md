---
name: forge-setup
description: Install, inspect, repair, upgrade, revert, or uninstall Codex Forge. Use for Forge-managed configuration, plugin registration, cache recovery, and installation health; not for ordinary Codex configuration unrelated to Forge.
license: MIT
---

# Forge Setup

Manage the installed Forge lifecycle from the intended plugin source while preserving user-owned configuration and producing observable recovery evidence.

Define the requested lifecycle operation, source root, target Codex home, overwrite authority, process-shutdown boundary, and completion checks. Read [the managed-file lifecycle](references/managed-files.md) before a mutation and [reinstall and cache recovery](references/reinstall-recovery.md) before a marketplace restamp, upgrade, or cache cleanup.

## Start with evidence

1. Resolve whether the operation uses the current source checkout or the loaded installed plugin. Upgrades and restamps use the intended source checkout; same-version diagnosis may use the installed plugin root.
2. Run `bun <plugin-root>/scripts/install.mjs doctor` before repair or mutation. Record the resolved Codex home, source and installed versions, overrides, compatibility result, cache state, and hook-trust state.
3. Inspect the applicable repository instructions and the exact installer command before execution. Use an external terminal for reinstall because the invoking Codex process cannot safely terminate itself.

## Workflow

1. Use `install` for initial setup or an override-preserving upgrade. Add `--replace` only when the user authorizes overwriting mapped local overrides, `--no-tools` when optional tools must remain untouched, and `--purge-cache` only for its documented diagnostic behavior.
2. Use source-checkout `reinstall` for the validated shutdown, uninstall, exact Forge-cache removal, marketplace restamp, plugin add, install, and doctor sequence. Confirm its process list interactively or use `--yes` only when non-interactive shutdown was authorized.
3. Use `revert` to replace mapped targets with current plugin sources. Use normal `uninstall` to restore pre-install state while preserving overrides; use `uninstall --purge` only for the explicitly broader removal described in the lifecycle reference.
4. After installation or a hook-definition change, start a fresh Codex thread, run `/hooks`, inspect the exact Forge commands, and complete Codex-owned trust review.

## Validation

1. Run `doctor` after the operation and inspect its human or JSON result.
2. Verify the requested installed files, configuration slices, plugin registration, model catalog, backup path, and override behavior with the focused checks in the references.
3. Report commands run, changed state, backup and recovery path, process actions, and any cache, hook-trust, or fresh-thread result that remains `UNVERIFIED`.

## Boundaries

- Preserve bytes outside proven Forge-owned blocks and preserve mapped local overrides unless replacement is explicit.
- Keep backup creation, ownership hashes, transaction recovery, validation, and hook trust in the lifecycle.
- Treat cache ownership as unverified outside the source-checkout reinstall sequence that confirms process shutdown and removes the exact Forge cache.
- Optional tool installation is authorized only by Forge setup or an explicitly invoked Forge workflow that requires the missing tool.
