# Agent notes for this repository

This repository is Codex Forge: a Codex CLI plugin, installer, and instruction
harness. It is not a user Codex session. Product identity for installed Forge
sessions lives in plugin assets, not in this file.

## Where to read before changing behavior

| Question | Canonical owner |
| --- | --- |
| Why Forge replaces stock `default.md`, Lite vs standard Responses, V1 catalog restamp, child instruction inheritance | [docs/model-instruction-audit-2026-08-24.md](docs/model-instruction-audit-2026-08-24.md) |
| Why a behavior exists (external papers, Codex issues, GPT-5.6 prompt structure) | [docs/design-evidence.md](docs/design-evidence.md) |
| Failure shape → lowest Forge layer | [docs/failure-controls.md](docs/failure-controls.md) |
| Longitudinal and Forge-user observations | [docs/observational-evidence-2026-08-22.md](docs/observational-evidence-2026-08-22.md) |
| Compaction / token-budget path | [docs/context-compaction-2026-08-24.md](docs/context-compaction-2026-08-24.md) |
| How to change instruction layers and evidence docs | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Install, doctor, revert, uninstall | [README.md](README.md) and [managed-file lifecycle](plugins/codex-forge/skills/forge-setup/references/managed-files.md) |

Prompt prose is guidance. Hooks, `forge.rules`, config, schemas, and tests own
enforcement. `$forge-prompt-audit` is the workflow for instruction-layer edits.

## Instruction-layer invariants

- `plugins/codex-forge/assets/model-instructions.md` is the replace identity
  (`model_instructions_file`). Positive phrasing only. Word count and SHA-256
  are pinned in `tests/unit/repository-contracts.test.mjs`. Sentence order is
  GPT-5.6 Role → Goal → Success → Constraints → Tools → Output → Stop, without
  section labels. The user-requirement / stated-order sentence precedes
  “produce outcomes through the tools”.
- `plugins/codex-forge/assets/developer-instructions.txt` is Forge
  worker/reviewer protocol. Same ban on negative constructions. No
  `model_instructions_file` on role TOML: children inherit the parent base;
  role-local copies of that key are accepted then dropped.
- One observed failure is not a license to add a wide rule. The PCSX2
  check-before-use case inverted stated order; it did not justify a universal
  flags-from-docs policy.

## Harness invariants

- `features.multi_agent_v2` stays unset. Enabling it globally forces V2.
  Install copies the pinned complete `model_catalog_json`, whose Forge slugs
  use V1 and `use_responses_lite = false` (standard Responses, true replace).
  Details and citations are in the model-instruction audit.
- Leave token-budget compaction unset on CLI 0.149.1.
- After install or hook-definition changes, a fresh Codex thread and `/hooks`
  trust review are still required.
