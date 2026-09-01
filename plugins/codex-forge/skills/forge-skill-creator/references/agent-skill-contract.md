# Forge agent-skill contract

Use this contract for skills distributed by Forge and as a conservative baseline for other Codex agent-skill collections.

## Standard anatomy

```text
skill-name/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── scripts/       # optional deterministic helpers
├── references/    # optional details loaded on demand
└── assets/        # optional output resources
```

Create only directories that have an immediate owner and use. Keep instructional documentation in `SKILL.md` or a directly linked file under `references/`; do not add a skill-local README, changelog, installation guide, or reference index.

## SKILL.md

The file begins with YAML frontmatter. Supported keys are `name`, `description`, `license`, `allowed-tools`, and `metadata`.

- `name` matches the directory, uses lowercase hyphen-case, and is at most 64 characters.
- `description` states what the skill does, when it applies, and important exclusions. Keep it at most 1024 characters and omit angle brackets.
- The body contains task-specific procedure and decision criteria that the base agent would not reliably infer.
- Put direct routes to detailed references near the decision that requires them. Every maintained reference should be reachable from `SKILL.md` without an index file.
- Prefer the recurring `Start with evidence`, `Workflow`, `Validation`, and `Boundaries` shape when each section carries real task-specific content. Omit empty or decorative sections.
- Keep one canonical owner for each rule. Link rather than copying paragraphs across the skill, repository documentation, and instruction layers.

## agents/openai.yaml

Quote all strings. A normal interface contains:

```yaml
interface:
  display_name: "Human-facing title"
  short_description: "A 25–64 character scanning label"
  default_prompt: "Use $skill-name to perform the bounded task."
```

The default prompt explicitly names the skill. Add icons, brand color, or MCP dependencies only when the corresponding asset or dependency exists.

Automatic invocation is the default. Add this policy only when the user or owning repository explicitly requires named invocation:

```yaml
policy:
  allow_implicit_invocation: false
```

Forge's repository instruction layer requires explicit `$forge-*` selection, so Forge-distributed skills use that policy. This is a Forge packaging rule, not a general consequence of destructive or sensitive operations.

## Progressive disclosure and resources

- Keep `SKILL.md` concise enough to scan as an operating procedure.
- Put stable schemas, long examples, integration details, and fragile commands in focused reference files.
- Put repeatable transformations and structural checks in scripts. A script should have a clear CLI, fail closed, and be exercised with representative inputs.
- Put templates, images, fonts, and starter material in assets. Assets are consumed by output; they are not instruction storage.
- Remove placeholders, example resources, orphan files, and duplicate implementations before completion.

## Validation boundary

Run `scripts/validate-skill.mjs` for structural checks, then run the target repository's native tests. Structural success does not prove that product-specific discovery, routing, permissions, or tool behavior works at runtime; report those claims as `UNVERIFIED` until exercised in the target product.
