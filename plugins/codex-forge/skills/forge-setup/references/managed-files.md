# Managed-file lifecycle

The repository-root `AGENTS.md` remains maintainer governance. Installer-managed
global guidance lives in the separate user-level `$CODEX_HOME/AGENTS.md` file.

- Close every Codex CLI/app session and fully terminate the Codex app server before plugin marketplace add/remove/upgrade, version restamp, install, or uninstall. A loaded session can retain a versioned plugin root across an installer operation.
- The installer performs a read-only process check and refuses install or uninstall mutations when a Codex CLI/app or app-server process remains; plugin marketplace mutations still require the external-terminal shutdown procedure.
- `install` creates or updates the Forge-owned appended section in `$CODEX_HOME/AGENTS.md`; a newly created file starts with `# AGENTS.md`. Existing content remains user-owned and is preserved verbatim outside the marked section. Reinstall replaces only that marked section.
- A first install claims no existing Forge marker: exact, malformed, unmatched, nested, duplicate, or marker-like content fails closed. Replacement requires recorded ownership and matching block hashes.
- The owned-block state records the exact hashes and insertion boundary needed to preserve bytes outside the block, including files without a trailing newline.
- `install` validates and merges configuration, backs up prior configuration state, copies Forge-owned files (including the model-instruction override and pinned V1 standard-Responses catalog under `$CODEX_HOME/forge/`), updates the exact global block state, and records source and target SHA-256 mappings plus the plugin version. Runtime install and revert copy the checked-in catalog without spawning Codex.
- A target hash mismatch identifies a local override. Normal reinstall and uninstall preserve it.
- `install --replace` deliberately overwrites mapped overrides during an upgrade.
- `revert` copies current plugin sources over mapped targets and refreshes the recorded hashes.
- Normal `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets.
- For `$CODEX_HOME/AGENTS.md`, uninstall removes only the proven Forge block and preserves all non-Forge content before and after it. A Forge-created file is removed when only the generated `# AGENTS.md` title remains; later user content remains a valid document. A changed or malformed Forge block fails closed rather than being removed, including during purge.
- `uninstall --purge` also removes plugin registrations, mapped overrides, and backup history. It retains cached Forge roots when cross-process ownership is not proven; `reinstall` performs an exact, validated Forge-root cleanup after supported plugin removal.
- `--purge-cache` is conservative: caller `CODEX_SESSION_ID`/`CODEX_THREAD_ID` values do not prove safety, so stale-cache deletion is deferred. `doctor` reports cache retention as `UNVERIFIED`; confirm upstream cache retention externally after shutdown.
- `doctor` reports source and installed versions, upgrade availability, override count, cached versions, and a required Codex CLI compatibility check (`>= 0.151.0`) in both human and JSON output. An unavailable, malformed, or older CLI makes the diagnosis unhealthy. Confirm hook trust manually with `/hooks`.
