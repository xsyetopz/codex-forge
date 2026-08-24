---
name: forge-prompt-audit
description: Use this skill when auditing or revising Codex instructions, skills, hooks, agent prompts, or compaction prompts for conflicts, redundancy, trigger overlap, and unenforced claims. Route ordinary application code to delivery.
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
