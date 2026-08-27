# Managed-file lifecycle

- Close every Codex CLI/app session and fully terminate the Codex app server before plugin marketplace add/remove/upgrade, version restamp, install, or uninstall. A loaded session can retain a versioned plugin root across an installer operation.
- `install` validates and merges configuration, backs up prior state, copies Forge-owned files (including the model-instruction override and pinned V1 standard-Responses catalog under `$CODEX_HOME/forge/`), and records exact source and target SHA-256 mappings plus the plugin version. Runtime install and revert copy the checked-in catalog without spawning Codex.
- A target hash mismatch identifies a local override. Normal reinstall and uninstall preserve it.
- `install --replace` deliberately overwrites mapped overrides during an upgrade.
- `revert` copies current plugin sources over mapped targets and refreshes the recorded hashes.
- Normal `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets.
- `uninstall --purge` also removes plugin registrations, mapped overrides, and backup history. It retains cached Forge roots when cross-process ownership is not proven.
- `--purge-cache` is conservative: caller `CODEX_SESSION_ID`/`CODEX_THREAD_ID` values do not prove safety, so stale-cache deletion is deferred. `doctor` reports cache retention as `UNVERIFIED`; confirm upstream cache retention externally after shutdown.
- `doctor` reports source and installed versions, upgrade availability, override count, and cached versions. Confirm hook trust manually with `/hooks`.
