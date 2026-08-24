# Codex Forge

Codex Forge is a Codex CLI plugin and user-configuration package for Codex 0.149.0. It doesn't provide a wrapper binary. Continue to run `codex` and, when intentionally desired, stock `codex --yolo`.

## Contents

- replacement base model instructions and compaction prompt;
- `forge-*` software-engineering skills;
- `forge-*` custom subagent role files;
- plugin lifecycle hooks with `[cf]` context/denial messages;
- global Forge execpolicy allow/prompt/forbidden rules;
- transactional Python setup for the normal `$CODEX_HOME/config.toml` (no named profile);
- verified helper-tool installation, including the CodeGraph CLI;
- repo-local Codex marketplace manifest suitable for hosting in a GitHub repository.

## Local plugin installation

From the extracted repository root:

```sh
codex plugin marketplace add .
codex plugin add codex-forge@codex-forge
python3 install.py install
```

The first two commands install the native plugin surfaces. `install.py` materializes Forge-owned user configuration under `$CODEX_HOME` (`~/.codex` by default): model/compaction instructions, registered custom-agent TOMLs, execpolicy rules, and Forge-owned root `config.toml` settings. It creates a timestamped backup and merges managed sections rather than replacing unrelated settings.

After installation, start a fresh Codex thread and run `/hooks`. Review the exact Forge hook
definitions and explicitly trust them through Codex. The installer enables the hooks feature but
cannot inspect or grant hook trust. Re-run `/hooks` and review/trust again whenever the hook
definitions change; `doctor` reports this runtime trust state as `UNVERIFIED` rather than claiming
that a healthy configuration proves trust.

Use `python3 install.py install --no-tools` to skip CLI helper installation. Re-running `install`
upgrades the managed configuration while preserving local overrides. Use
`python3 install.py install --replace --purge-cache` to replace those overrides with the current
plugin sources and remove older cached Forge plugin versions.

Check or uninstall the user-level configuration with:

```sh
python3 install.py doctor
python3 install.py doctor --json
python3 install.py doctor --purge-cache
python3 install.py revert
python3 install.py uninstall
python3 install.py uninstall --purge
```

Installed Forge files are recorded as source-to-target mappings with SHA-256 hashes. Local edits are treated as overrides: reinstall and uninstall preserve them. Run `revert` when you intentionally want every mapped override replaced with the matching file from the currently installed local or Git-cached plugin source. Preexisting target files are backed up and restored on uninstall when the installed copy was not locally changed.

`doctor` reports the source and installed plugin versions, upgrade availability, local override
count, stale cached installs, whether the `codex-forge` plugin is registered, and whether the hooks
feature is enabled. Its `--purge-cache` option removes cached versions other than the source
version. `uninstall --purge` additionally removes installed Forge plugin registrations, locally
overridden managed files, Forge backup history, and every cached Forge plugin install.

The installed plugin also exposes `forge-setup`; from a fresh Codex thread it can run the same setup/repair/uninstall script from the installed plugin root.

## GitHub marketplace installation

The repository root contains `.agents/plugins/marketplace.json` with `codex-forge` at `./plugins/codex-forge`. After publishing the repository to GitHub:

```sh
codex plugin marketplace add OWNER/REPOSITORY --ref REF
codex plugin add codex-forge@codex-forge
```

Start a fresh Codex thread and invoke `forge-setup` to install the `$CODEX_HOME` pieces. The Python installer is bundled inside the plugin, so a Git marketplace installation doesn't require this source checkout after the plugin has been cached.

Plugin installation and Forge user-configuration setup are separate because plugin skills/hooks/assets are plugin resources while replacement model instructions, user agent registrations, and global execpolicy rules are Codex user configuration.

## Permission behavior

Normal `codex` is configured as:

```toml
approval_policy = "on-request"
approvals_reviewer = "user"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

This keeps ordinary repository edits sandboxed without routine approval prompts while allowing the user to approve a focused or external action when its rule is `prompt`. Sandbox escapes fail in normal mode; stock `codex --yolo` remains available when the user intentionally disables Codex sandbox/approvals.

`codex --yolo` remains Codex's native dangerous flag. Forge doesn't alias or wrap it. Current Codex defines it as no approvals + no sandbox. Forge's PreToolUse hook and `forge.rules` still hard-deny known catastrophic/destructive commands and route authorizable public/external mutations to the approval boundary where those enforcement surfaces are dispatched. Don't treat that as an OS sandbox: upstream hook/rule coverage has had gaps, so `--yolo` should still be used only where the host/worktree is disposable or otherwise externally protected.

Forge routes external/public writes through the user approval boundary rather than trying to infer consent from prose. This includes Git push, PR/issue/release mutation, publication, remote shell/sync, cluster mutation and infrastructure apply/destroy. Catastrophic shell and history-wipe commands remain hard-denied by `forge.rules` and the dedicated PreToolUse backstop.

The PreToolUse backstop uses a bounded parser for known shell wrappers, operators, and command
forms. It does not analyze arbitrary interpreter source or claim complete shell-language coverage;
unrecognized forms remain subject to the normal Codex policy boundary.

## Agent routing

The root remains `gpt-5.6-sol` / `medium`. Architecture, ambiguous root cause and final semantic judgment stay in the root and can raise effort when required.

Forge only delegates when the active `spawn_agent` schema can prove an explicit registered Forge `agent_type` route. Generic inherited-model children are denied, and known Forge children cannot spawn grandchildren. Codex 0.149.0 includes leaf-model support under Multi-Agent V2, but Forge requires the explicit role boundary rather than relying on model-only leaf assumptions; runtime/schema evidence still wins over static assumptions.

Default intended routes:

| Work | Route |
| --- | --- |
| deterministic exact leaf | Luna low |
| scouting / bounded implementation | Luna high |
| hard bounded settled implementation | Luna xhigh |
| long-context retrieval specialist | Terra high, only when justified |
| architecture / root cause / semantic review | Sol high in root |
| demonstrated hard tail | Sol xhigh |

One child is the default. Parallel writes require disjoint ownership. Child context is explicitly bounded; `fork_turns=none`/equivalent is required. A model/agent handoff is treated as a fresh responsibility-specific session: the child receives an explicit objective, observed/expected behavior where relevant, scope, oracle, validation ceiling, and stop condition instead of relying on conversational continuity. Child role files set `agents.enabled=false` and explicitly prohibit spawning; `agents.max_depth=1` is an additional V1 cap, not a V2 recursion guarantee.

Blind consequential audits and ambiguous root-cause debugging remain in Sol. Luna is used after the problem is bounded enough to specify expected behavior and an oracle; this avoids asking a cheaper worker to infer the audit contract while still using it for implementation and deterministic checks.

## Execution efficiency

Forge adds concrete Code Mode batching guidance because controlled GPT-5.6 tests and independent traces found that serializing already-independent nested tool calls can multiply outer model cycles and repeated context processing. Within a bounded stage, independent calls are grouped with `Promise.allSettled`/`Promise.all`; dependent, adaptive, approval-sensitive, waiting, and conflicting mutation work remains sequential. Batching never widens investigation scope, and tool output is bounded at the command/query source.

Forge doesn't send no-op cache heartbeats or poll agents/processes merely to preserve cache state. Community reports show cache lifetime and quota effects vary by model/runtime and can change; manufactured keepalive traffic is therefore not treated as a stable optimization. Long-running continuity is carried by the current repository, explicit task/goal state, compaction state, and structured handoffs rather than an assumption that another thread or model remembers prior work.

For implementation, Forge biases toward first-pass convergence: establish the owner and acceptance oracle, make one coherent patch where practical, validate in one focused batch, repair common causes rather than symptoms, and stop once sufficient evidence supports the requested result.

## Skill surface

Forge exposes six deliberately selected workflows: delivery, debugging, review/verification, external research, Forge setup, and prompt audit. Refactoring and dependency changes branch within delivery; performance work branches within debugging; testing and UI verification branch within review. CodeGraph selection, delegation, model routing, tasklists, persisted goals, batching, and context management remain base instructions, hooks, agent definitions, or runtime primitives rather than competing skills.

Each retained skill uses progressive disclosure: concise selector metadata and `SKILL.md`, with detailed branches under package-local `references/`.

## CodeGraph

Forge installs `@colbymchenry/codegraph` and uses the CLI by default. Package-manager preference is Bun, pnpm, Yarn, then npm. If no global binary is available, the bundled launcher tries Bun/bunx, pnpm/pnpx, Yarn, then npx before MCP is considered. For relationship-heavy work, check `codegraph status . --json`; for an existing index run `codegraph sync .`; then use `codegraph explore --path .`, `codegraph node --path .`, `codegraph callers`, `codegraph callees`, `codegraph impact`, or `codegraph affected` as appropriate. Index creation with `codegraph init <path>` is explicit because it creates a repository-local `.codegraph/` directory.

The plugin exposes `codegraph serve --mcp` through `.mcp.json`, but MCP calls are a last-resort fallback only when the equivalent CLI invocation is unavailable or fails. Forge doesn't install a second graph implementation or retain alternate graph command aliases.

## Updating

Re-run plugin installation through Codex after changing the Git marketplace source, then run `forge-setup`/`python3 install.py install` again so the user-level assets match the installed plugin version. Start a new Codex thread after plugin/prompt changes.

## Validation

Forge vendors the current SchemaStore contracts for hooks, plugin manifests, and skill metadata under `plugins/codex-forge/schemas/`. Run `uv run plugins/codex-forge/scripts/validate_schemas.py` to validate every distributed instance against those exact schemas. `sh tests/test.sh` includes the schema gate and the installer/hook regression suite.

Static prompt and configuration checks do not establish live model adherence, token-use behavior,
or external integration outcomes; those remain `UNVERIFIED` without a claim-relevant runtime
harness.
