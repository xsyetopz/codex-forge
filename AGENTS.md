# AGENTS.md

This repository is a Codex CLI plugin, installer, and instruction
harness. It is not a user Codex session. Product identity for installed Forge
sessions lives in plugin assets, not in this file.

## Where to read before changing behavior

| Question | Canonical owner |
| --- | --- |
| Why Forge replaces stock `default.md`, Lite vs standard Responses, V1 catalog restamp, child instruction inheritance | [model instruction evidence](docs/evidence/model-instructions.md) |
| Exact Codex CLI 0.152.0 capability baseline | [0.152.0 source audit](docs/evidence/codex-cli-0.152.0.md) |
| External harness and academic prior art | [research synthesis](docs/evidence/research-synthesis.md) |
| Failure shape → lowest Forge layer | [failure controls](docs/reference/failure-controls.md) |
| Local and community observations | [session evidence](docs/evidence/session-observations.md) and [community observations](docs/evidence/community-observations.md) |
| Compaction / token-budget path | [compaction](docs/operations/compaction.md) |
| How to change instruction layers and evidence docs | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Install, doctor, revert, uninstall | [README.md](README.md) and [managed-file lifecycle](plugins/codex-forge/skills/forge-setup/references/managed-files.md) |

Prompt prose is guidance. Focused hooks, `forge.rules`, config, schemas, and
tests own enforcement. [CONTRIBUTING.md](CONTRIBUTING.md) is the workflow for
instruction-layer edits.

## Instruction-layer invariants

- `plugins/codex-forge/assets/model-instructions.md` is the replace identity
  (`model_instructions_file`). Positive phrasing only. Word count and SHA-256
  are pinned in `tests/unit/contracts/documentation.test.mjs`. Markdown follows
  the official prompt-engineering structure: `# Identity`, `# Instructions`
  with focused subsections, measured-gap `# Examples`, then `# Context`.
  Instruction subsections preserve Task Contract → Authority and Scope →
  Evidence → Success and Ownership → Tools and Validation → Communication →
  Stop. The user-requirement / stated-order rule precedes tool execution.
- `plugins/codex-forge/assets/developer-instructions.txt` owns root delegation,
  role routing, and review policy. Same ban on negative constructions. Role
  TOMLs own child differentiation and replace the root developer layer for the
  child. On Codex CLI 0.152.0, children inherit the parent base instructions,
  compact prompt, sandbox, and permissions; role-local copies of those settings
  are parsed but excluded from the applied role override. Children also inherit
  the root service tier, so role files omit it.
- One observed failure is not a license to add a wide rule. The PCSX2
  check-before-use case inverted stated order; it did not justify a universal
  flags-from-docs policy.

## Harness invariants

- `features.multi_agent_v2` stays unset. Enabling it globally forces V2.
  Install copies the pinned complete `model_catalog_json`, whose Forge slugs
  use V1 and `use_responses_lite = false` (standard Responses, true replace).
  Details and citations are in the model-instruction audit.
- Pin `features.token_budget = false` on CLI 0.152.0. Model metadata can now
  activate token budgeting when configuration is silent; Forge still lacks the
  durable checkpoint service required for fresh-window resets.
- Enable `tools.update_plan` explicitly because 0.152.0 makes it opt-in and
  Forge uses plan state as an observable coordination surface.
- After install or hook-definition changes, a fresh Codex thread and `/hooks`
  trust review are still required.
