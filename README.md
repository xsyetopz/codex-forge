# Codex Forge

Codex Forge is a Codex CLI plugin that packages focused engineering skills, guarded hooks, explicit agent roles, and managed user configuration.

It extends the native `codex` workflow; it does not install a wrapper or replace Codex's own approval and sandbox controls.

## Install Codex Forge

Prerequisites: Codex CLI 0.149.0 and Bun 1.4 or newer.

From the repository root:

```sh
codex plugin marketplace add .
codex plugin add codex-forge@codex-forge
bun install.mjs install
```

The first two commands install the plugin. The final command merges Forge-owned settings into `$CODEX_HOME/config.toml` (`~/.codex` by default), copies agent/rule/prompt assets, records SHA-256 mappings, and creates a timestamped backup. Unrelated configuration is preserved.

Start a fresh Codex thread after installation. Run `/hooks`, review the exact Forge commands, and explicitly trust them in Codex. The installer enables hooks but cannot inspect or grant trust; `doctor` therefore reports hook trust as `UNVERIFIED`.

## Use Codex Forge

Use Codex normally and select a focused workflow when it matches the task:

```text
$forge-deliver implement this bounded change and run the affected tests
```

Available skills:

| Skill | Purpose |
| --- | --- |
| `forge-deliver` | Features, fixes, refactoring, and dependency migration |
| `forge-debug` | Evidence-led root-cause and performance diagnosis |
| `forge-review` | Code review, test design, and UI verification |
| `forge-research` | Current technical research with primary sources |
| `forge-setup` | Installation, repair, inspection, and uninstall |
| `forge-prompt-audit` | Instruction, hook, and prompt ownership audits |

Each `SKILL.md` is a concise entrypoint. Its `references/index.md` routes to task-specific details so agents do not load unrelated guidance.

## Manage the installation

```sh
bun install.mjs doctor
bun install.mjs doctor --json
bun install.mjs install --replace --purge-cache
bun install.mjs revert
bun install.mjs uninstall
bun install.mjs uninstall --purge
```

- `install --no-tools` skips optional CLI-helper installation.
- Reinstall preserves mapped files changed locally; `--replace` deliberately replaces those overrides.
- `revert` restores current plugin sources over mapped targets.
- `uninstall` restores unchanged preexisting targets and removes unchanged Forge-created targets.
- `uninstall --purge` also removes plugin registrations, overrides, backup history, and cached installs. Use it only when that destructive scope is intended.

## Permission model

Forge configures ordinary Codex work for `approval_policy = "on-request"` and `sandbox_mode = "workspace-write"`. External/public writes remain approval-sensitive. A dedicated PreToolUse hook and `forge.rules` deny recognized catastrophic commands even when other approval boundaries are relaxed.

The shell backstop is intentionally bounded. It recognizes documented wrappers, operators, destructive Git forms, broad recursive deletion, privilege escalation, host power commands, and download-to-shell pipelines. It does not claim complete shell-language or OS-sandbox coverage. Stock `codex --yolo` remains dangerous and should be limited to externally protected or disposable environments.

## Agent routing

The root uses Sol for supervision, architecture, ambiguous diagnosis, and semantic judgment. Registered leaf roles use Luna for bounded work, Terra for justified long-context retrieval, and Sol for hard-tail review. One child is the default; parallel writers require disjoint ownership. Forge children cannot spawn grandchildren.

Agent handoffs include an objective, scope, observed/expected behavior when relevant, acceptance oracle, validation ceiling, and stop condition. The plugin does not assume another thread or model remembers prior conversation.

## CodeGraph

Forge installs `@colbymchenry/codegraph` when optional tools are enabled. The launcher prefers an installed `codegraph`, then Bun/bunx, pnpm/pnpx, Yarn, and npx. It never initializes a repository: creating `.codegraph/` remains an explicit user decision.

When an index exists, use `codegraph explore` before flat search for structural questions. The plugin also exposes `codegraph serve --mcp` through `.mcp.json`.

## Git marketplace

The repo marketplace is `.agents/plugins/marketplace.json`, with the plugin at `plugins/codex-forge`.

```sh
codex plugin marketplace add OWNER/REPOSITORY --ref REF
codex plugin add codex-forge@codex-forge
```

After the plugin is cached, start a fresh thread and use `forge-setup`; the Bun installer is included in the plugin.

## Validate changes

```sh
bun run validate:schemas
bun test
```

Schema validation checks the distributed hook manifest, plugin manifest, and skill metadata. The test suite covers hook decisions, configuration merging, local-override preservation, installer lifecycle, and repository contracts. Live model or external integration behavior remains `UNVERIFIED` unless the opt-in isolated runtime harness observes it.

## Design evidence

See [design evidence](docs/design-evidence.md), [failure controls](docs/failure-controls.md), and the dated [observational evidence synthesis](docs/observational-evidence-2026-08-22.md). Prompt guidance is kept compact; deterministic hooks, configuration, schemas, and tests own enforceable behavior.

## License

[MIT](LICENSE)
