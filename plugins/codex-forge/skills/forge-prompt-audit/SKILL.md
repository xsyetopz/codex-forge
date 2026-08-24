---
name: forge-prompt-audit
description: Agent instruction, hook, and prompt audits for conflicts, redundancy, and unenforced claims.
---

# Forge Prompt Audit

## Use this skill

- Audit or revise Codex instructions, skills, hooks, agent prompts, or compaction prompts.
- Don't use for ordinary application code, repository documentation, or current external research; route those to `$forge-deliver` or `$forge-research`.

## Rules

- Identify which layer owns each behavior: runtime configuration, deterministic hook/rule, base instruction, agent definition, or selectable skill.
- Keep durable always-on policy out of skills and keep workflow-specific procedures out of base instructions.
- Remove repeated instructions and overlapping selectors without losing unique authority, examples, or failure cases.
- Don't claim prompt prose enforces filesystem, credential, process, or network boundaries.

## Steps

1. Inventory the active prompt layers, selectors, hooks, schemas, and representative failure cases.
2. Load the audit procedure and map each retained behavior to one authoritative owner.
3. Remove redundancy, resolve conflicts by authority, and keep selectors bounded to workflows that materially change execution.
4. Validate structure and compare representative behavior where runtime evaluation is available.
5. Return ownership changes, removed overlap, evidence, and limitations.

## Resources

- Start with the [reference router](references/index.md) for layer ownership and audit checks.

## Verify

- Done means every retained instruction and selector has one distinct owner and no requirement is silently lost.
- Run plugin schema and routing tests; when editing Forge itself, run `bun run validate:schemas && bun test` from the repository root.
- Mark behavioral routing, token-use, cache, or external runtime evaluation `UNVERIFIED` when unavailable.
