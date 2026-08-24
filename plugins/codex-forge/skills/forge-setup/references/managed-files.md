# Managed-file lifecycle

- `install` validates and merges configuration, backs up prior state, copies Forge-owned files, and records source and target SHA-256 mappings plus the plugin version.
- A target hash mismatch identifies a local override. Normal reinstall and uninstall preserve it.
- `install --replace` deliberately overwrites mapped overrides during an upgrade.
- `revert` copies current plugin sources over mapped targets and refreshes the recorded hashes.
- Normal `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets.
- `uninstall --purge` also removes plugin registrations, mapped overrides, backup history, and cached Forge installs.
- `doctor` reports source and installed versions, upgrade availability, override count, and cached versions. Confirm hook trust manually with `/hooks`.
