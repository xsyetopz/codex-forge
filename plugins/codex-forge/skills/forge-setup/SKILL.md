---
name: forge-setup
description: Explicit `$forge-setup` workflow for Codex Forge installation, inspection, repair, upgrade, override reversion, and uninstallation.
license: MIT
compatibility: Requires Codex CLI and Bun 1.4 or newer.
---

# Forge Setup

## Workflow

1. Resolve the plugin root from this loaded skill package so every command targets the active copy.
2. Before plugin marketplace add/remove/upgrade, version restamp, or Forge install/uninstall, close every Codex CLI/app session and fully terminate the Codex app server. Follow the [Reinstall and cache recovery](references/reinstall-recovery.md) guide from an external terminal for macOS verification and escalation.
3. For inspection, repair, or upgrade, first run `bun <plugin-root>/scripts/install.mjs doctor`.
4. Run `install` for initial setup or an override-preserving upgrade. Use `--replace` when the user explicitly wants mapped local overrides overwritten, `--purge-cache` to report stale cached versions, and `--no-tools` when optional tools should remain uninstalled.
5. For replace, revert, purge, or uninstall behavior, read [the managed-file lifecycle](references/managed-files.md) before acting.
6. After installation or a hook-definition change, start a fresh Codex thread, run `/hooks`, review the exact Forge commands, and explicitly trust them. The installer enables hooks while Codex owns trust review.
7. Run `doctor` again and report the resolved Codex home, changed files, backup, command results, warnings, and manual or external verification still required.

## Gotchas

- Preserve unrelated user configuration. Recorded source-to-target hashes identify Forge-managed files and local overrides.
- Keep backups, validation, hook trust, and local-override preservation in the lifecycle.
- `revert` replaces mapped targets with current plugin sources; pre-install restoration belongs to uninstall.
- Use `uninstall --purge` only for the explicitly broader removal of registrations, overrides, and backup history; versioned cached roots remain conservatively retained without reliable cross-process ownership evidence.
- Forge cannot establish cross-process cache ownership from caller session or thread IDs. Stale cache deletion stays deferred and cache retention is `UNVERIFIED` unless reliable liveness or lease evidence exists.
- Optional tool installation is authorized during Forge setup or when an explicitly invoked Forge workflow requires the missing tool.
