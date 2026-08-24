# Installation lifecycle

`install` validates and merges configuration, backs up prior state, copies Forge-owned files, and records source/target SHA-256 mappings plus the plugin version. A later hash mismatch is a local override and survives reinstall and uninstall. `install --replace` deliberately overwrites mapped overrides during an upgrade. `revert` copies current plugin sources over mapped targets and refreshes hashes. `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets; `uninstall --purge` also removes plugin registrations, overrides, backup history, and cached Forge installs.

`doctor` reports installed/source versions, upgrade availability, override count, and cached versions. `install --purge-cache` and `doctor --purge-cache` remove stale cached versions while retaining the source version.

Normal plugin hooks also require `features.hooks = true` in the generated user configuration. After
plugin installation, or whenever `hooks/hooks.json` changes, start a fresh Codex thread, run
`/hooks`, review the exact Forge hook definitions, and explicitly trust them through Codex. The
installer cannot inspect or grant that runtime trust. `doctor` reports hook trust as
`UNVERIFIED`/manual when no trustworthy runtime signal is available; a healthy configuration does
not prove that the hooks were trusted.

The optional-tool phase installs `@colbymchenry/codegraph` as the `codegraph` CLI, preferring Bun, then pnpm, Yarn, and npm. When a global install is unavailable, `scripts/codegraph.mjs` retains CLI execution through Bun/bunx, pnpm/pnpx, Yarn, then npx. It doesn't initialize repositories. Run `codegraph init <path>` only after an explicit indexing request; use `status`, `sync`, and CLI queries thereafter. The bundled MCP server declaration uses the same launcher as fallback transport and doesn't replace the CLI-first workflow.

Setup does not modify `$CODEX_HOME/AGENTS.md`; repository-local `AGENTS.md` instructions remain under the repository's control. CodeGraph usage guidance is supplied through the installed Forge instructions and session hook context.
