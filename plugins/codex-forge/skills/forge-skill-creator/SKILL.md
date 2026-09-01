---
name: forge-skill-creator
description: Create or audit Codex agent skills with consistent structure, progressive disclosure, UI metadata, and deterministic validation. Use for new skills or structural skill repairs; not for ordinary repository documentation or runtime feature implementation.
license: MIT
---

# Forge Skill Creator

Create the smallest useful skill package from repository evidence and the agent skills specification. Preserve the user's requested scope, invocation policy, resources, and validation boundary.

Before editing, read [the Forge agent-skill contract](references/agent-skill-contract.md). Match established neighboring skills when their conventions do not conflict with the specification.

## Start with evidence

1. Establish the skill's tasks, positive and negative triggers, target agents, expected outputs, permissions, reusable resources, and acceptance checks.
2. Inspect representative skills from the target collection and any repository contract tests. Reuse existing scripts, references, and terminology instead of creating duplicate textual owners.
3. Keep only non-obvious procedural knowledge. Move detailed schemas, examples, and operational references out of `SKILL.md` and link them directly from the point of use.

## Workflow

1. For a new skill, initialize the standard anatomy before filling it in:

   ```sh
   bun <forge-skill-creator-root>/scripts/init-skill.mjs <skill-name> --path <skills-directory> [--resources scripts,references,assets] [--explicit-only]
   ```

2. Write YAML frontmatter with a hyphen-case `name` matching the directory and a concise, discriminating `description`. Keep `SKILL.md` procedural, imperative, and free of generic agent advice.
3. Add `agents/openai.yaml` with quoted interface strings and a default prompt that names `$<skill-name>`. Automatic invocation remains the default; set `policy.allow_implicit_invocation: false` only when the user or owning repository explicitly requires invocation by name.
4. Add only resources that the skill uses. Scripts own repeatable deterministic work, references own details loaded on demand, and assets supply output material rather than instructions.
5. Consolidate repeated guidance into one canonical owner and link to it. Avoid auxiliary README, changelog, installation-guide, or index files inside the skill.

## Validation

1. Run the bundled structural validator:

   ```sh
   bun <forge-skill-creator-root>/scripts/validate-skill.mjs <skill-directory> [--explicit-only]
   ```

2. Run repository-native skill contracts and exercise added scripts with representative valid and invalid inputs. Inspect the final tree for placeholders, orphan references, duplicate policy, broken links, and unused resources.
3. Report changed paths, validation commands, invocation-policy decisions, and any target-product behavior that remains `UNVERIFIED`.

## Boundaries

- `SKILL.md` frontmatter is limited to supported agent-skill fields; product UI metadata belongs in `agents/openai.yaml`.
- A sensitive or mutating workflow does not by itself justify disabling implicit invocation. Permission checks belong in the instructions and execution boundary.
- Preserve established compatibility only when the user or repository support contract requires it.
- Independent forward-testing is warranted only when complexity or risk makes the extra coordination useful.
