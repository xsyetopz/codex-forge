---
name: forge-prompt-audit
description: Explicit `$forge-prompt-audit` workflow for Codex instructions, skills, hooks, agent prompts, and compaction prompts.
license: MIT
---

# Forge Prompt Audit

## Workflow

1. Inventory the active instruction layers, selectors, hook definitions, schemas, and representative failure cases.
2. Assign each retained behavior to one owner: runtime configuration, deterministic hook or rule, base instruction, agent definition, or selectable skill.
3. For a hook audit or change, read [the Codex hook gotchas](references/codex-hooks.md) and verify version-sensitive behavior against current official OpenAI documentation.
4. Consolidate repeated guidance and overlapping selectors while preserving unique authority, examples, and failure cases.
5. Validate structure and deterministic behavior. Compare representative routing behavior when a runtime evaluator is available.
6. Report ownership changes, consolidated overlap, commands and exit statuses, and behavioral claims that remain unverified.

## Gotchas

- Runtime settings own configuration; hooks and rules own deterministic decisions; base instructions own durable policy; agent definitions own role boundaries; skills own distinct selected workflows.
- Describe prompt prose as guidance. Filesystem, credential, process, and network enforcement belongs to runtime controls.
- Keep a selector when its activation materially changes task intent or workflow rather than only a model, tool, tactic, or phase.
- Hook matching and trust are runtime state. A valid JSON definition proves structure rather than activation or trust.
- Replace identity through `model_instructions_file`. Keep Goal (user requirements and stated order) before “produce outcomes through the tools”. Role TOML carries developer instructions, model, and effort only. `features.multi_agent_v2` stays unset. One observed failure stays a single Goal-slot sentence. Word count and SHA-256 are pinned in `tests/unit/contracts/documentation.test.mjs`. The Forge source-tree rationale is `docs/model-instruction-audit-2026-08-24.md`.
