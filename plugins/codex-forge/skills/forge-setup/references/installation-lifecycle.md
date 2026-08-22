# Installation lifecycle

`install` validates and merges configuration, backs up prior state, copies Forge-owned files, and records source/target SHA-256 mappings. A later hash mismatch is a local override and survives reinstall and uninstall. `revert` deliberately copies current plugin sources over mapped targets and refreshes hashes. `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets.

The optional-tool phase installs `@colbymchenry/codegraph` as the `codegraph` CLI, preferring Bun, then pnpm, Yarn, and npm. When a global install is unavailable, `scripts/codegraph.py` retains CLI execution through bunx/Bun, pnpm/pnpx, Yarn, then npx. It doesn't initialize repositories. Run `codegraph init <path>` only after an explicit indexing request; use `status`, `sync`, and CLI queries thereafter. The bundled MCP server declaration uses the same launcher as fallback transport and doesn't replace the CLI-first workflow.

Setup also merges the marked CodeGraph section from `assets/global-agents.md` into `$CODEX_HOME/AGENTS.md`. The Forge section is under 20 lines. Reinstall replaces only that marked section; uninstall restores the exact prior file when unchanged or removes only the Forge section after unrelated edits.
