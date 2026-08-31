# Managed-file lifecycle

The repository-root `AGENTS.md` remains maintainer governance. Installer-managed
global guidance lives in the separate user-level `$CODEX_HOME/AGENTS.md` file.

- Close every Codex CLI/app session and fully terminate the Codex app server before plugin marketplace add/remove/upgrade, version restamp, install, or uninstall. A loaded session can retain a versioned plugin root across an installer operation.
- The installer performs a read-only process check and refuses install or uninstall mutations when a Codex CLI/app or app-server process remains; plugin marketplace mutations still require the external-terminal shutdown procedure.
- `install` creates or updates the Forge-owned appended section in `$CODEX_HOME/AGENTS.md`; a newly created file starts with `# AGENTS.md`. Existing content remains user-owned and is preserved verbatim outside the marked section. Reinstall replaces only that marked section.
- Managed `config.toml` sections use the exact paired markers `# >>> codex-forge >>>` and `# <<< codex-forge <<<`; the user-level `AGENTS.md` section uses exactly `<!-- CODEX_FORGE_START -->` and `<!-- CODEX_FORGE_END -->`. Legacy AGENTS forms are rejected and are never accepted as current ownership markers.
- A first install claims no existing Forge marker: exact, malformed, unmatched, nested, duplicate, or marker-like content fails closed. Replacement requires recorded ownership and matching block hashes.
- The owned-block state records the exact hashes and insertion boundary needed to preserve bytes outside the block, including files without a trailing newline.
- Every global `AGENTS.md` install or uninstall transaction receives a random ID persisted in `pending_global_agents_transaction` before the pathname claim. Recovery accepts only the exact pending record or commit receipt, verifies transaction-directory ownership and the manifest-recorded inode/mode/hash, removes an uncommitted published target only when it still matches that record, and restores the quarantined original. A matching ownership mapping without the transaction ID is insufficient.
- `install` validates and merges configuration, backs up prior configuration state, copies Forge-owned files (including the model-instruction override and pinned V1 standard-Responses catalog under `$CODEX_HOME/forge/`), updates the exact global block state, and records source and target SHA-256 mappings plus the plugin version. Runtime install and revert copy the checked-in catalog without spawning Codex.
- The managed `[features]` section enables `mcp_2026_07_28 = true` directly; there is no optional compatibility fragment.
- A target hash mismatch identifies a local override. Normal reinstall and uninstall preserve it.
- `install --replace` deliberately overwrites mapped overrides during an upgrade.
- `revert` copies current plugin sources over mapped targets and refreshes the recorded hashes.
- Normal `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets.
- For `$CODEX_HOME/AGENTS.md`, uninstall removes only the proven Forge block and preserves all non-Forge content before and after it. A Forge-created file is removed when only the generated `# AGENTS.md` title remains; later user content remains a valid document. A changed or malformed Forge block fails closed rather than being removed, including during purge.
- `uninstall --purge` also removes plugin registrations, mapped overrides, and backup history. It retains cached Forge roots when cross-process ownership is not proven; `reinstall` performs an exact, validated Forge-root cleanup after supported plugin removal.
- `--purge-cache` is conservative: caller `CODEX_SESSION_ID`/`CODEX_THREAD_ID` values do not prove safety, so stale-cache deletion is deferred. `doctor` reports cache retention as `UNVERIFIED`; confirm upstream cache retention externally after shutdown.
- `doctor` reports source and installed versions, upgrade availability, override count, cached versions, and a required Codex CLI compatibility check (`>= 0.151.0`) in both human and JSON output. An unavailable, malformed, or older CLI makes the diagnosis unhealthy. Confirm hook trust manually with `/hooks`.
