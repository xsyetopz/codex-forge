# Codex Forge

Codex Forge is a Codex CLI plugin and user-configuration package for Codex 0.149.0. It doesn't provide a wrapper binary. Continue to run `codex` and, when intentionally desired, stock `codex --yolo`.

## Contents

- replacement base model instructions and compaction prompt;
- `forge-*` software-engineering skills;
- `forge-*` custom subagent role files;
- plugin lifecycle hooks with `[cf]` context/denial messages;
- global Forge execpolicy hard denials;
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

The first two commands install the native plugin surfaces. `install.py` materializes Forge-owned user configuration under `$CODEX_HOME` (`~/.codex` by default): model/compaction instructions, registered custom-agent TOMLs, execpolicy rules, a short marked CodeGraph section in global `AGENTS.md`, and Forge-owned root `config.toml` settings. It creates a timestamped backup and merges managed sections rather than replacing unrelated settings.

Use `python3 install.py install --no-tools` to skip CLI helper installation.

Check or uninstall the user-level configuration with:

```sh
python3 install.py doctor
python3 install.py revert
python3 install.py uninstall
```

Installed Forge files are recorded as source-to-target mappings with SHA-256 hashes. Local edits are treated as overrides: reinstall and uninstall preserve them. Run `revert` when you intentionally want every mapped override replaced with the matching file from the currently installed local or Git-cached plugin source. Preexisting target files are backed up and restored on uninstall when the installed copy was not locally changed.

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
approval_policy = "never"
approvals_reviewer = "user"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

This keeps ordinary repository edits sandboxed without routine approval prompts. Sandbox escapes fail in normal mode; stock `codex --yolo` remains available when the user intentionally disables Codex sandbox/approvals.

`codex --yolo` remains Codex's native dangerous flag. Forge doesn't alias or wrap it. Current Codex defines it as no approvals + no sandbox. Forge's PreToolUse hook and `forge.rules` still reject known destructive/history-rewriting/public/external mutation commands where those enforcement surfaces are dispatched. Don't treat that as an OS sandbox: upstream hook/rule coverage has had gaps, so `--yolo` should still be used only where the host/worktree is disposable or otherwise externally protected.

Forge blocks external/public writes by default rather than trying to infer consent from prose. This includes Git push, PR/issue/release mutation, publication, remote shell/sync, cluster mutation and infrastructure apply/destroy.

## Agent routing

The root remains `gpt-5.6-sol` / `medium`. Architecture, ambiguous root cause and final semantic judgment stay in the root and can raise effort when required.

Forge only delegates when the active `spawn_agent` schema can prove an explicit role/model route. Generic inherited-model children are denied. Codex 0.149.0 includes leaf-model support under Multi-Agent V2, so Luna is a valid bounded worker route when the active runtime exposes it; runtime/schema evidence still wins over static assumptions. This avoids turning a Sol root into expensive Sol child/grandchild trees when role/model routing is unavailable.

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
