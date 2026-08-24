# Skill package design

## Allocation

| Location | Put here |
| --- | --- |
| `SKILL.md` description | Activation intent, relevant keywords, and the nearest likely routing boundary |
| `SKILL.md` body | Short shared workflow, selection logic, universal constraints, and surprising gotchas |
| `references/` | Variant-specific procedures, schemas, policies, substantial examples, and uncommon edge cases |
| `scripts/` | Deterministic validation, transformation, or computation that would otherwise be regenerated |
| `assets/` | Templates and resources copied or adapted into generated output |
| `agents/openai.yaml` | Codex UI metadata, invocation policy, and supported tool dependencies |

## Progressive disclosure

- Link each reference from `SKILL.md` at the step that determines when it applies.
- Keep reference files one level below the package root and focused on one branch.
- Keep reference-to-reference chains out of the package so the entrypoint remains the routing authority.
- Give a reference over 300 lines a short contents list. For a reference over 10,000 words, put useful search terms in `SKILL.md`.
- Keep each fact in one authoritative location.

## Trigger tests

Write representative prompts in three sets:

1. Clear activations that name the task in ordinary user language.
2. Near-miss requests that belong to an adjacent skill.
3. Ambiguous requests where the description should provide enough information for a stable choice.

Tune the description rather than adding broad catchalls. Short descriptions are valid when they remain discriminating.

## Package hygiene

- Keep runtime-supporting files and attribution required by their licenses.
- Keep auxiliary README, installation, quick-reference, and changelog files at repository level unless the runtime workflow consumes them.
- Keep links and symlinks within the package root.
- Keep deterministic scripts executable, self-contained, and helpful on invalid input.

<!-- Derived from OpenAI's built-in skill-creator and substantially modified for Codex Forge. -->
