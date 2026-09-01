# Codex Forge

Codex Forge is a Codex CLI 0.151.0 plugin and installer. It supplies a lean
replacement model identity, task-shaped agent roles, focused continuity hooks,
a pinned model catalog, CodeGraph integration, and transactional user-level
configuration. Codex remains the owner of approvals, sandboxing, agent
cancellation, and agent lifecycle.

Maintainers start with [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md),
and the [documentation index](docs/README.md).

## Install

Prerequisites: Codex CLI 0.151.0 and Bun 1.4 or newer.

Close all Codex CLI/app sessions and the app server before installation,
upgrade, removal, or version restamping. Then run:

```sh
codex plugin marketplace add .
codex plugin add codex-forge@codex-forge
bun install.mjs install
```

Start a fresh thread, run `/hooks`, review every Forge command, and trust the
current hashes. Hook trust remains `UNVERIFIED` until this manual review.

The installer merges its marked configuration into `$CODEX_HOME/config.toml`,
manages one marked section in `$CODEX_HOME/AGENTS.md`, copies Forge-owned
assets, records SHA-256 mappings, and creates a timestamped backup. Unrelated
configuration and pre-existing AGENTS content are preserved.

See [reinstall and cache recovery](docs/operations/reinstall-recovery.md) for
the shutdown, recovery, and V1 verification procedure.

## Manage

```sh
bun install.mjs doctor
bun install.mjs doctor --json
bun install.mjs install --replace --purge-cache
bun install.mjs reinstall
bun install.mjs revert
bun install.mjs uninstall
bun install.mjs uninstall --purge
```

- `install --replace` deliberately replaces changed Forge-managed copies.
- `revert` restores current plugin sources over mapped targets.
- `uninstall` restores unchanged pre-existing targets and removes unchanged
  Forge-created targets.
- `uninstall --purge` also removes registration, overrides, and backup history.
- Cache deletion remains conservative when another process could retain a
  versioned plugin root.
- Installer mutations fail closed while Codex processes are active.

The explicit `$forge-setup` skill covers installation, inspection, repair, and
uninstall. Ordinary software work uses Codex directly with the installed model
identity and roles; Forge no longer duplicates generic delivery, debugging,
review, research, or skill-authoring workflows.

## Runtime design

### Model instructions

Forge installs a lean 315-word replacement at
`$CODEX_HOME/forge/model-instructions.md` and selects it with
`model_instructions_file`. Its sentence order follows GPT-5.6 guidance: Role →
Goal → Success → Constraints → Tools → Output → Stop. Forge intentionally
overrides Codex's stock `default.md`; additive developer instructions cannot
remove stock identity clauses.

The pinned full model catalog sets Forge GPT-5.6 entries to
`use_responses_lite = false`, so standard Responses uses the configured base
instructions as the replacement layer. See [model instruction evidence](docs/evidence/model-instructions.md)
and the [0.151.0 source audit](docs/evidence/codex-cli-0.151.0.md).

### Agent routing

Forge uses registered multi-agent V1 roles. `features.multi_agent_v2` stays
unset; the pinned catalog selects V1. The roles route by task shape:

- Luna: exact or bounded local execution with a decisive oracle;
- Terra: repository intelligence and long-context retrieval;
- Sol: architecture, ambiguous debugging, semantic review, and hard-tail work.

Medium is the ordinary baseline. Low fits one exact operation; high and xhigh
are explicit escalations. Eight spawned threads is a capacity ceiling, not a
target. Zero children is valid, children remain one level deep, and shared
writes stay serialized.

Agent review is optional. Forge has no persisted worker → reviewer → repair
state machine. Native `interrupt_agent`, `close_agent`, `send_input`, and
`wait_agent` are never matched by Forge hooks.

### Hooks

Hook paths use `scripts/hooks/<hook-type>/<behavior>.mjs`. Six focused handlers
remain:

- `SessionStart/restore-continuity`
- `PreToolUse/enforce-agent-spawn-boundaries` (two spawn aliases)
- `UserPromptSubmit/preserve-raw`
- `SubagentStart/provide-boundary-context`
- `SubagentStop/record-handoff`
- `SessionEnd/clear-continuity`

There is no Forge Stop hook. Codex 0.151.0 turns a blocking Stop result into a
continuation prompt, which makes it unsuitable for mandatory review policy.
Shared observational state lives in `scripts/lib/continuity-state.mjs` and
cannot authorize new agent work.

### Permissions

Forge configures `approval_policy = "on-request"` and
`sandbox_mode = "workspace-write"`. `forge.rules` supplies narrow command
decisions. Forge does not duplicate Codex's shell parser, permission profiles,
Guardian freshness, or remote sandbox path logic in hooks.

### Context continuity

Forge uses summary-backed compaction. The checked-in compact prompt is the
local/custom-provider override and handoff specification; hosted sessions use
Codex remote compaction. Bounded child handoffs and explicit `!RAW` text are
stored for resume/compact continuity, but the store has no scheduler state.
Token-budget compaction stays unset on 0.151.0. See [compaction](docs/operations/compaction.md).

### CodeGraph

When a repository already contains `.codegraph/`, Forge uses CodeGraph first
for structural discovery and verifies consequential findings in current source.
The launcher prefers an installed binary, then supported package runners.
Repository indexing remains an explicit user decision; Forge synchronizes an
existing index before graph-dependent work when source changes may have made it
stale.

The exact Codex 0.151.0 source used for this audit is copied to
`vendor/codex-cli-0.151.0` and indexed with CodeGraph.

## Validate

```sh
bun run validate:schemas
bun run validate:skills
bun run test
```

`bun run test` intentionally scopes discovery to Forge's `tests/unit`; plain
`bun test` would also traverse the vendored upstream checkout. The opt-in
isolated runtime harness remains `bun run test:isolated`.

## Evidence

Official OpenAI GPT-5.6 guidance favors lean prompts, one statement per rule,
relevant tools only, and compact authorization boundaries. Forge combines that
guidance with the pinned Codex source, local session evidence, immutable Reddit
captures, harness-engineering references, and isolated arXiv reads. Start at
the [documentation index](docs/README.md).

## License

[MIT](LICENSE)
