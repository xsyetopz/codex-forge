---
name: forge-skill-creator
description: Explicit `$forge-skill-creator` workflow for Agent Skills, metadata, references, scripts, assets, and trigger descriptions.
license: Apache-2.0. See license.txt for the forked OpenAI skill-creator terms.
compatibility: Designed for Codex; bundled validation and initialization scripts require Bun 1.4 or newer.
---

# Forge Skill Creator

This skill adapts OpenAI's built-in `skill-creator` workflow for Codex Forge and adds a deterministic package contract.

## Workflow

1. Identify the user intents that should activate the skill and the nearest intents that should select something else.
2. Inspect the current package and its consumers. Preserve useful content, supported metadata, attribution, and established resource paths.
3. Keep `SKILL.md` to the shortest complete workflow. Put universally useful procedure and surprising gotchas there.
4. Link substantial variant-specific detail directly at the decision step that needs it. Read [the package design guide](references/package-design.md) when choosing between resident instructions, references, scripts, and assets.
5. Use `scripts/init-skill.mjs <name> --path <parent>` for a new package when a scaffold is useful. Add only the resource directories the workflow needs.
6. Run `scripts/check-skill.mjs <skill-directory>` after each material revision. Resolve every error and review each advisory warning against the user's intent.
7. Test trigger descriptions with realistic positive and near-miss requests. Run each new deterministic script on a representative success case and an invalid-input case.
8. Return the package paths, validation commands and exit statuses, trigger boundaries, and behavioral evidence that remains unavailable.

## Gotchas

- Codex already handles general reasoning and coding. A strong skill supplies task-specific decisions, fragile invariants, and reusable mechanics.
- Description metadata controls discovery. Phrase it around user intent and include a concise near-miss boundary only where routing could plausibly overlap.
- Positive instructions focus execution on the desired state. Express safety-critical and routing boundaries as explicit authorized states, confirmation gates, and selection criteria.
- Simple skills benefit from remaining self-contained. Conditional references earn their context cost only when a distinct branch needs substantial detail.
- Assets contribute to generated output; references contribute to reasoning; scripts provide deterministic or repeatedly needed computation.
- `agents/openai.yaml` is Codex interface metadata. Keep its default prompt aligned with the package name and preserve policy or dependency fields during focused updates.

<!-- Derived from OpenAI's built-in skill-creator and substantially modified for Codex Forge. -->
