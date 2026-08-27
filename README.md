# Codex Forge

Codex Forge is a Codex CLI plugin that packages focused engineering skills, guarded hooks, explicit agent roles, and managed user configuration.

It extends the native `codex` workflow; it doesn't install a wrapper or replace Codex's own approval and sandbox controls.

## Contents

- [Install Codex Forge](#install-codex-forge)
- [Reinstall and cache recovery](docs/reinstall-recovery.md)
- [Use Codex Forge](#use-codex-forge)
- [Manage the installation](#manage-the-installation)
- [Permission model](#permission-model)
- [Agent routing](#agent-routing)
- [Context continuity](#context-continuity)
- [CodeGraph](#codegraph)
- [Git marketplace](#git-marketplace)
- [Validate changes](#validate-changes)
- [Design evidence](#design-evidence)
- [License](#license)

Agents and contributors working in this repository should start from
[AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Install Codex Forge

Prerequisites: Codex CLI 0.150.1 and Bun 1.4 or newer.

Before adding, removing, upgrading, or version-restamping the plugin, close
every Codex CLI/app session and fully terminate the Codex app server. A loaded
session can retain a versioned plugin root while the installer changes the
cache; Forge cannot prove that root is unused across processes.

For the macOS close, verification, escalation, reinstall, fresh-thread, hook
trust, and V1 verification procedure, see [Reinstall and cache recovery](docs/reinstall-recovery.md).

From the repository root:

```sh
codex plugin marketplace add .
codex plugin add codex-forge@codex-forge
bun install.mjs install
```

The first two commands install the plugin. The final command merges Forge-owned settings into `$CODEX_HOME/config.toml` (`~/.codex` by default), copies the pinned agent/rule/prompt/catalog assets, records SHA-256 mappings, and creates a timestamped backup. Unrelated configuration is preserved.

Start a fresh Codex thread after installation. Run `/hooks`, review the exact Forge commands, and explicitly trust them in Codex. The plugin registers its hooks while Codex keeps the default-on hook runtime and owns trust review; `doctor` reports hook trust as `UNVERIFIED` until that review is complete.

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
| `forge-skill-creator` | Agent Skill creation, restructuring, and deterministic package validation |

Each `SKILL.md` keeps its shared workflow and high-value gotchas resident. It links directly to focused `references/` files at the step where branch-specific detail becomes relevant.

Forge workflow skills use Codex-native discovery. Each skill declares
`policy.allow_implicit_invocation = false`, so ordinary tasks keep Forge
workflows unloaded on the normal Codex path and explicit `$forge-*` selectors
activate a Forge workflow.
Host skill loading uses Codex-native filesystem loading through the plugin's
skill directory.

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
- `uninstall --purge` also removes plugin registrations, overrides, and backup history. Cached plugin roots are retained conservatively because cross-process ownership is `UNVERIFIED`; confirm upstream cache retention externally after all sessions and the app server are closed.
- `--purge-cache` reports stale cached versions but does not delete them without reliable cross-process liveness or lease evidence. Upstream cache retention remains `UNVERIFIED`.

## Permission model

Forge configures ordinary Codex work for `approval_policy = "on-request"` and `sandbox_mode = "workspace-write"`. External/public writes remain approval-sensitive. A dedicated PreToolUse hook and `forge.rules` deny recognized catastrophic commands even when other approval boundaries are relaxed.

The shell backstop is intentionally bounded. It recognizes documented wrappers, operators, destructive Git forms, broad recursive deletion, privilege escalation, host power commands, and download-to-shell pipelines. It doesn't claim complete shell-language or OS-sandbox coverage. Stock `codex --yolo` remains dangerous and should be limited to externally protected or disposable environments.

## Agent routing

Codex Forge 0.1.0-alpha.4 targets Codex's legacy multi-agent V1 path. Codex defaults provide
the runtime; Forge installs standalone TOML definitions under
`$CODEX_HOME/agents/`, Codex discovers them as custom roles, and each role
declares its own `model` and `model_reasoning_effort`. Fresh children use
`fork_context=false`. The root uses Sol for supervision, architecture,
ambiguous diagnosis, and semantic judgment. Registered leaf roles use Luna for
bounded work, Terra for justified long-context retrieval, and Sol for hard-tail
review. Ordinary root, planning, worker, retrieval, architecture, debugging, and
review work starts at medium effort; bounded scouting uses Luna low, while the
explicit hard-worker and tail-reviewer roles reserve xhigh for demonstrated hard
tails. The bounded-change flow uses one worker followed by one reviewer;
parallel writers require disjoint ownership, and Forge children stay at one
depth.

Route by acceptance surface rather than task count: Luna roles fit explicit
contracts with local blast radius, decisive oracles, and cheap rollback. Use
Sol architecture, debugger, or reviewer roles when requirements are ambiguous,
changes cross system boundaries, or semantic review must reconstruct intent.

Codex's default-on `multi_agent` and `hooks` features remain active, so Forge
leaves those keys at their native defaults rather than redundantly configuring
them. `features.multi_agent_v2` stays unset: the flag is stable and disabled by
default on Codex installs. Enabling it globally forces the V2 spawn surface,
which defaults `hide_spawn_agent_metadata` and treats an omitted `fork_turns`
as a full-history fork. See [the model-instruction audit](docs/model-instruction-audit-2026-08-24.md).
Install copies the checked-in pinned catalog to
`$CODEX_HOME/forge/model-catalog.json` and points `model_catalog_json` at it.
That complete catalog restamps Forge slugs to
`multi_agent_version = "v1"` and `use_responses_lite = false`. Standard
Responses then treats `model_instructions_file` as the replacement base layer.

Agent handoffs include an objective, scope, observed/expected behavior when relevant, acceptance oracle, validation ceiling, and stop condition. The plugin doesn't assume another thread or model remembers prior conversation.

The managed `[agents]` setting allows eight concurrently open spawned-agent
threads beyond the primary. The normal active set stays at the smallest size
that keeps independent work moving: 2-4 agents ordinarily, expanding toward
5-8 for genuinely independent read-heavy or mechanically sharded work. Shared
writes, sequential dependencies, validation or I/O bottlenecks, and expensive
Sol lanes favor serialized or smaller active sets. Completed agents should be
collected and closed so their capacity returns to the eight-slot ceiling.

Forge installs a lean 245-word model-instruction layer at
`$CODEX_HOME/forge/model-instructions.md` and points the managed
`model_instructions_file` key at that exact path. Sentence order follows
GPT-5.6 Role → Goal → Success → Constraints → Tools → Output → Stop: user
requirements and their stated order occupy the Goal slot before execution
guidance. The layer supplies the evidence, scope,
orchestration, validation, and silent-work contract used by Forge. Codex
carries the root session's effective base instructions into legacy V1
children, so every registered Forge role receives the same base contract;
role TOML files add their bounded developer instructions, model, and effort.
The benchmark baseline leaves the model-instruction key unset for matched stock
base-instruction comparisons.

## Context continuity

Forge selects Codex's standard summary-backed compaction with a self-contained execution checkpoint. The managed configuration leaves token-budget context resets unset; Codex CLI 0.150.1 preserves the summary-producing path, while continuity remains grounded in the compact handoff. The 0.150.1 patch additionally budgets retained images during remote compaction.

See [context compaction findings](docs/context-compaction-2026-08-24.md) for the recorded incident, upstream mechanism, adopted controls, avoided alternatives, and verification limits.

## CodeGraph

Forge installs `@colbymchenry/codegraph` when optional tools are enabled. The launcher prefers an installed `codegraph`, then Bun/bunx, pnpm/pnpx, Yarn, and npx. It never initializes a repository: creating `.codegraph/` remains an explicit user decision.

When an index exists, use `codegraph explore` before flat search for structural questions. The plugin also exposes `codegraph serve --mcp` through `.mcp.json`.

## Git marketplace

The repo marketplace is `.agents/plugins/marketplace.json`, with the plugin at `plugins/codex-forge`.

```sh
codex plugin marketplace add OWNER/REPOSITORY --ref REF
codex plugin add codex-forge@codex-forge
```

Close every Codex CLI/app session and the app server before running plugin
marketplace add/remove/upgrade commands or restamping a version. After the
plugin is cached, start a fresh thread and use `forge-setup`; the Bun installer
is included in the plugin.

## Validate changes

```sh
bun run validate:schemas
bun run validate:skills
bun test
```

Schema validation checks the distributed hook manifest, plugin manifest, and Codex skill metadata. Skill validation checks Agent Skills frontmatter, progressive-disclosure paths, package hygiene, and Codex discovery metadata. The test suite covers hook decisions, configuration merging, local-override preservation, installer lifecycle, and repository contracts. Live model or external integration behavior remains `UNVERIFIED` unless the opt-in isolated runtime harness observes it.

Instruction-layer edits, catalog restamps, and evidence-doc updates follow
[CONTRIBUTING.md](CONTRIBUTING.md).

## Design evidence

See [design evidence](docs/design-evidence.md), [failure controls](docs/failure-controls.md), the dated [observational evidence synthesis](docs/observational-evidence-2026-08-22.md), the [model-instruction audit](docs/model-instruction-audit-2026-08-24.md), and the [context compaction findings](docs/context-compaction-2026-08-24.md). Prompt guidance is kept compact; deterministic hooks, configuration, schemas, and tests own enforceable behavior. One observed failure is not a license to add a wide prompt rule.

## License

[MIT](LICENSE)
