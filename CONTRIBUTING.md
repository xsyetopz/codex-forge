# Contributing

Forge keeps product behavior in plugin assets, installer config, hooks, and
tests. Evidence for those choices lives under `docs/`. Read [AGENTS.md](AGENTS.md)
for the owner map before editing instruction layers.

## Validate

From the repository root:

```sh
bun run validate:schemas
bun run validate:skills
bun test
```

Contract tests pin instruction markers, the ban on negative constructions in
both instruction layers, model-instruction word count and SHA-256, and Goal
before Tools order. Live model behavior stays `UNVERIFIED` unless the opt-in
isolated runtime harness observes it.

## Instruction-layer edits

Canonical files:

- `plugins/codex-forge/assets/model-instructions.md` — replace identity
- `plugins/codex-forge/assets/developer-instructions.txt` — Forge protocol
- role TOML under `plugins/codex-forge/agents/` — model, effort, role-local
  developer instructions only

When changing `model-instructions.md`:

1. Keep positive phrasing. The contract test rejects `do not`, `never`, `not`,
   and similar constructions.
2. Keep the GPT-5.6 section order (Role, Goal, Success, Constraints, Tools,
   Output, Stop). Do not add section labels. Keep user requirements and stated
   order before “produce outcomes through the tools”.
3. State each rule once. Do not widen a single observed failure into a policy
   that covers unrelated CLI, flag, or tool-use cases.
4. Update the pinned word count and SHA-256 in
   `tests/unit/contracts/documentation.test.mjs`.
5. Record the observation in
   [session evidence](docs/evidence/session-observations.md),
   map the failure in
   [failure controls](docs/reference/failure-controls.md), and put the rationale
   in
   [model instruction evidence](docs/evidence/model-instructions.md).

Role files must not gain `model_instructions_file`. Codex copies the parent
session’s base instructions into children and drops that key from role
overrides. See the model-instruction audit.

After users install, `$CODEX_HOME/forge/model-instructions.md` updates only on
`bun install.mjs install` (or `revert` / `--replace`). Editing the plugin
asset does not change an already-installed Codex home.

## Catalog and multi-agent surface

The installer copies the complete checked-in
`plugins/codex-forge/assets/model-catalog.json` to
`$CODEX_HOME/forge/model-catalog.json`; runtime install and revert perform no
Codex catalog subprocess. Leave `features.multi_agent_v2` unset. Refresh the
pinned developer snapshot explicitly with:

```sh
bun run catalog:refresh
```

The refresh command has a bounded subprocess, preserves the pinned file after
host timeout/nonzero/malformed results, and atomically replaces it after a
valid complete host snapshot. Record any extra catalog field rewrite in the
model-instruction audit.
