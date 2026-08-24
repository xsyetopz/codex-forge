---
name: forge-setup
description: Use this skill when installing, inspecting, repairing, upgrading, reverting local overrides, or uninstalling Codex Forge user configuration. Route ordinary repository work to the matching engineering skill.
license: MIT
compatibility: Requires Codex CLI and Bun 1.4 or newer.
---

# Forge Setup

## Workflow

1. Resolve the plugin root from this loaded skill package so every command targets the active copy.
2. For inspection, repair, or upgrade, first run `bun <plugin-root>/scripts/install.mjs doctor`.
3. Run `install` for initial setup or an override-preserving upgrade. Use `--replace` when the user explicitly wants mapped local overrides overwritten, `--purge-cache` to remove stale cached versions, and `--no-tools` when optional tools should remain uninstalled.
4. For replace, revert, purge, or uninstall behavior, read [the managed-file lifecycle](references/managed-files.md) before acting.
5. After installation or a hook-definition change, start a fresh Codex thread, run `/hooks`, review the exact Forge commands, and explicitly trust them. The installer enables hooks while Codex owns trust review.
6. Run `doctor` again and report the resolved Codex home, changed files, backup, command results, warnings, and manual or external verification still required.

## Gotchas

- Preserve unrelated user configuration. Recorded source-to-target hashes identify Forge-managed files and local overrides.
- Keep backups, validation, hook trust, and local-override preservation in the lifecycle.
- `revert` replaces mapped targets with current plugin sources; pre-install restoration belongs to uninstall.
- Use `uninstall --purge` only for the explicitly broader removal of registrations, overrides, backup history, and cached installs.
- Optional tool installation is authorized during Forge setup or when an explicitly invoked Forge workflow requires the missing tool.
