# Model instruction contract and evidence

Forge intentionally replaces Codex's stock `default.md`. This is a product
decision for a custom harness, not an accidental compatibility path.

## Canonical owners

| Layer | Owner |
| --- | --- |
| Base identity | `plugins/codex-forge/assets/model-instructions.md` |
| Forge routing and delegation | `plugins/codex-forge/assets/developer-instructions.txt` |
| Role-local behavior | `plugins/codex-forge/agents/*.toml` |
| Effective model transport | `plugins/codex-forge/assets/model-catalog.json` |
| Installed selection | managed `model_instructions_file`, `developer_instructions`, and `model_catalog_json` config |

The base file is currently 315 words with a SHA-256 pinned in
`tests/unit/contracts/documentation.test.mjs`. Its sentence order is Role →
Goal → Success → Constraints → Tools → Output → Stop, without section labels.
The user-requirement and stated-order sentence precedes tool execution.

## Official GPT-5.6 guidance

OpenAI's [GPT-5.6 prompting guidance](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6),
retrieved on September 1, 2026, recommends lean prompts, stating each
instruction once, exposing only relevant tools, keeping product-defining
examples and style, defining compact autonomy and approval boundaries, and
validating prompt changes on representative work. Its response-style guidance
says to preserve required evidence and next actions, define tone through
concrete writing choices, and trim generic reassurance before required facts.

Forge applies that guidance by:

- keeping the base identity short and positive;
- moving role routing into one developer layer;
- deleting duplicated generic workflow skills and broad hooks;
- specifying answer/review/diagnose versus change/build/fix authority once;
- pinning prompt bytes and testing required ordering;
- defining execution-failure recovery as an operational task-state update;
- retaining `!RAW` for explicit wording preservation.

The guidance advises incremental evaluation, not a ban on custom-harness base
instructions. Forge's replacement remains an intentional evaluated surface.

## Why replacement is necessary

`AGENTS.md` and `developer_instructions` are additive lower layers. They cannot
remove system/base identity clauses such as mandatory preambles, friendliness,
ambition, broad validation, or unsolicited next steps. Adding opposite prose
would create conflicts and repetition—the failure class GPT-5.6 guidance warns
against.

Forge is a harness whose product contract includes silence during routine tool
use, literal user scope, bounded validation, and no invented work. Replacing
the base identity is the supported mechanism that changes those defaults at
their owner.

## Standard Responses requirement

Codex 0.151.0 source shows two transports:

- Standard Responses sends base instructions as request instructions.
- Responses Lite rebuilds base instructions and tools as prompt-side developer
  items and strips image detail settings.

The bundled GPT-5.6 catalog uses Responses Lite. Forge installs a complete
pinned catalog with `use_responses_lite = false` for Sol, Terra, and Luna so
`model_instructions_file` has standard Responses replacement semantics. A
partial catalog patch is invalid because `model_catalog_json` replaces the
catalog rather than merging one field.

See the [Codex CLI 0.151.0 source audit](codex-cli-0.151.0.md) for source paths
and the exact runtime baseline.

## Child inheritance and role files

Legacy V1 children inherit the parent session's effective base instructions.
Role TOML owns model, reasoning effort, service tier, sandbox selection, and
role-local developer instructions. A role-local `model_instructions_file` is
outside that supported override surface and is intentionally absent.

Forge keeps `features.multi_agent_v2` unset and restamps its GPT-5.6 catalog
entries to V1. V2 has different fork and usage-hint semantics and is not a
compatibility target for the current role files.

## Observed failure controls

| Failure | Smallest owner |
| --- | --- |
| Scope invention or overengineering | Goal/Success sentences in base identity |
| Ignoring stated order | Goal sentence in base identity |
| Routine narration and social padding | Output sentence in base identity |
| Social-script substitution during execution-failure recovery | Operational task-state sentence in base identity |
| Repeated approval requests for safe local work | Single autonomy boundary in developer instructions |
| Wrong model for ambiguous work | Role-routing paragraph and role TOML |
| Mandatory review/repair loop | Removed from hooks; optional task topology only |
| Stale state creating new work | Continuity schema has no lifecycle authority |

One observation does not license a broad prompt rule. Record the observation,
identify the owner, change the narrowest surface, and add a discriminating test.

## Change procedure

1. Read the current asset, this contract, relevant observations, and the
   0.151.0 source audit.
2. Change one instruction group at a time and keep each rule in one layer.
3. Preserve positive phrasing and Role → Goal → Success → Constraints → Tools →
   Output → Stop order.
4. Update the pinned word count and SHA-256.
5. Run schema, skill, contract, and representative runtime validation.
6. Start a fresh installed session after changes; loaded sessions retain their
   effective instructions.

Live hosted model behavior remains `UNVERIFIED` until the isolated runtime
harness observes it.
