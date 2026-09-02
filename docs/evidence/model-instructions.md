# Model instruction contract and evidence

Forge intentionally replaces Codex's stock `default.md`. This is a product
decision for a custom harness, not an accidental compatibility path.

## Canonical owners

| Layer | Owner |
| --- | --- |
| Base identity | `plugins/codex-forge/assets/model-instructions.md` |
| Root routing, delegation, and review | `plugins/codex-forge/assets/developer-instructions.txt` |
| Child differentiation | `plugins/codex-forge/agents/*.toml` |
| Effective model transport | `plugins/codex-forge/assets/model-catalog.json` |
| Installed selection | managed `model_instructions_file`, `developer_instructions`, and `model_catalog_json` config |

The base file is currently 832 words with a SHA-256 pinned in
`tests/unit/contracts/documentation.test.mjs`. It uses the official
prompt-engineering hierarchy: `# Identity`, `# Instructions`, measured-gap
`# Examples`, then `# Context`. Instructions use focused subsections for Task
Contract, Authority and Scope, Evidence, Success and Ownership, Tools and
Validation, Communication, and Stop. User requirements and stated order appear
before tool execution.

## Official GPT-5.6 guidance

OpenAI's [GPT-5.6 model and prompting guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6),
retrieved on September 2, 2026, is the current primary source. The older
`prompt-guidance-gpt-5p6` route redirects to that model-specific view.

The official [prompt-engineering guide](https://developers.openai.com/api/docs/guides/prompt-engineering),
also retrieved on September 2, 2026, provides the message-format owner. It says
Markdown headers and lists can mark logical sections and hierarchy, while XML
tags can delimit examples or supporting material. Its general developer-message
order is Identity, Instructions, Examples, then Context, with exact contents
and ordering adaptable by model. Forge now follows that hierarchy directly.

### Complete retrieved guidance map

| Official finding | Forge disposition |
| --- | --- |
| Markdown headers and lists communicate section boundaries and hierarchy | The base file uses explicit H1/H2 sections rather than unlabeled prose |
| XML tags delimit examples and supporting content | Measured-gap examples use `<user_input>` and `<assistant_output>` boundaries |
| A developer message generally orders Identity, Instructions, Examples, and Context | Forge adopts that top-level order and keeps task-specific evidence sources in the final Context section |
| Production prompts belong in code with code review, representative fixtures, tests, and deployment controls | The prompt remains a pinned plugin asset with contract tests, isolated cases, and installer lifecycle ownership |
| Stable reusable prompt content near the beginning improves prompt-cache opportunities | Identity and invariant Instructions form the stable prefix; variable task context arrives later through runtime inputs |
| Leaner system prompts improved one internal coding-agent sample by roughly 10–15% on eval score while reducing tokens by 41–66% and cost by 33–67%; results are directional | Keep the replacement compact relative to stock Codex, state each rule once, and validate on Forge cases |
| Remove one prompt/tool group at a time and rerun the same evals | Pin bytes and word count; keep focused isolated cases for measured gaps |
| Expose only relevant tools with concise, precise descriptions | Tool exposure and descriptions remain Codex/plugin owners; base prose states cross-cutting selection rules once |
| Keep examples and style guidance when they encode a product requirement or measured gap | Forge uses concrete output grammar and regression cases rather than generic personality labels |
| Long sessions amplify repeated prompt and tool content | Keep generic behavior in one base layer and use compaction/continuity owners for growing context |
| GPT-5.6 can infer intent better, while domain context, hard constraints, approval boundaries, success criteria, and ambiguity policy remain valuable | Focused Instruction subsections define those fields with one focused-question rule |
| Answer/explain/review/diagnose/plan and change/build/fix need distinct action authority | `## Authority and Scope` grants inspection/reporting first and adds local mutation authority only for change-shaped requests |
| Safe local reads, log inspection, in-scope edits, and tests should proceed without unnecessary approval | `## Authority and Scope` names those actions and reserves confirmation for external, destructive, costly, or scope-expanding work |
| `text.verbosity` provides the stable default; prompt text should carry task-specific output requirements | Forge sets `model_verbosity = "low"` and uses `## Communication` for required evidence and task-bearing content |
| Short answers should preserve conclusion, evidence, material caveat, decision, and next action before introductions, repetition, reassurance, or optional background | `## Communication` encodes that priority and assigns zero budget to social filler |
| Tone is more reliable when defined through concrete writing choices than labels such as friendly or empathetic | Forge uses direct, impersonal, operational language and an enumerated task-bearing sentence grammar |
| Outcome-focused prompts should state goal, relevant context, constraints, required evidence, success criteria, and output format | Forge maps those fields into the Markdown hierarchy and focused Instruction subsections, with explicit Tools and Validation and Stop boundaries |
| Pro mode is a request execution mode for difficult quality-first tasks and should keep the same outcome-focused prompt | Forge leaves pro mode outside base prose; model/effort routing and representative evaluation own that decision |
| Reasoning mode and effort are independent; compare configurations on representative tasks | Root and role files pin model/effort by task shape; benchmark assets own comparisons |
| Programmatic Tool Calling fits bounded predictable reduction work, requires explicit route/tool/schema/retry/stop instructions, and needs final-message evaluation | Forge 0.152.0 exposes no Forge PTC configuration; direct tools and Code Mode keep their existing owners, while isolated cases inspect final assistant messages |
| Fewer calls, turns, retries, tokens, latency, or cost count as improvements only when final correctness, completeness, and evidence still pass | Forge validation optimizes for the smallest distinguishing oracle rather than activity metrics |
| GPT-5.6 defaults persisted reasoning to `all_turns` when available | Transport owns reasoning context; Forge prompt prose adds no duplicate state policy and current runtime evidence remains the oracle |
| GPT-5.6 supports low through max effort plus pro mode, with `medium` as a balanced starting point and higher effort justified by measured gain | Forge roots at medium, routes bounded roles deliberately, and reserves hard-tail escalation |
| GPT-5.6 provides Sol, Terra, and Luna tiers with different capability/cost roles | The pinned catalog and role TOMLs preserve those workload distinctions |
| Multi-agent is a GPT-5.6 beta for cleanly divisible work | Forge keeps its audited Codex 0.152.0 V1 topology and risk-driven delegation contract |
| Explicit prompt caching, safeguards, and original image detail are request/transport features | They create no base-prompt rule; Forge documents transport ownership and keeps visual-asset creation behind explicit user authorization |
| Current GPT-5-series coding reminders call for an explicit role, structured tool guidance and examples, thorough validation, and clean semantic Markdown | Identity, Tools and Validation, measured-gap Examples, and the Markdown hierarchy cover those concerns |
| Current frontend reminders list established icon libraries such as Lucide, Material Symbols, and Heroicons | Library availability permits reuse within scope; it grants zero authority to generate a new visual asset |
| The general agentic reminder discusses preambles at notable tool decisions and TODO tracking | Forge keeps plan state as a coordination surface while its product contract limits interim speech to required input, authorization, scope decisions, or blockers |

The current official [Codex prompting guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)
was also retrieved. It recommends autonomy and persistence, working code over
plans, and removal of upfront plans, preambles, or rollout status instructions
that can induce early stopping. Its current named API target is
`gpt-5.3-codex`, so Forge uses it only as adjacent harness evidence; GPT-5.6
model guidance remains the target-specific authority.

Forge applies that guidance by:

- keeping the base identity short and positive;
- moving role routing into one developer layer;
- deleting duplicated generic workflow skills and broad hooks;
- specifying answer/review/diagnose versus change/build/fix authority once;
- pinning prompt bytes and testing required ordering;
- classifying user statements before deciding whether agreement is factually
  supported;
- assigning output budget exclusively to task-bearing content;
- defining execution-failure recovery as an operational task-state update;
- retaining agent ownership across user-held capability boundaries;
- requiring explicit user authorization for generated visual assets;
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

Codex 0.152.0 source shows two transports:

- Standard Responses sends base instructions as request instructions.
- Responses Lite rebuilds base instructions and tools as prompt-side developer
  items and strips image detail settings.

The bundled GPT-5.6 catalog uses Responses Lite. Forge installs a complete
pinned catalog with `use_responses_lite = false` for Sol, Terra, and Luna so
`model_instructions_file` has standard Responses replacement semantics. A
partial catalog patch is invalid because `model_catalog_json` replaces the
catalog rather than merging one field.

See the [Codex CLI 0.152.0 source audit](codex-cli-0.152.0.md) for source paths
and the exact runtime baseline.

## Child inheritance and role files

Legacy V1 children inherit the parent session's effective base instructions.
They also inherit the parent's effective compact prompt and live sandbox and
permission state. Role-local `developer_instructions` replace the root
developer layer for the child. Codex CLI 0.152.0 then applies a bounded role
override containing developer instructions, model and reasoning settings,
verbosity, personality, selected feature reductions, and selected skill
reductions. Service tier follows the root session. The role projection excludes
`model_instructions_file`, `compact_prompt`,
`experimental_compact_prompt_file`, and `sandbox_mode`, so Forge omits those
misleading keys from role files.

The current OpenAI [custom-agent documentation](https://developers.openai.com/codex/agent-configuration/subagents)
describes custom agent files as session configuration layers and recommends
narrow, opinionated agents. Forge's support contract remains the audited
0.152.0 V1 implementation, whose applied role projection is narrower than the
current general documentation.

Forge keeps `features.multi_agent_v2` unset and restamps its GPT-5.6 catalog
entries to V1. V2 has different fork and usage-hint semantics and is not a
compatibility target for the current role files.

## Observed failure controls

| Failure | Smallest owner |
| --- | --- |
| Scope invention or overengineering | `## Task Contract` and `## Success and Ownership` |
| Ignoring stated order | `## Task Contract` |
| Routine narration and social padding | `## Communication` assigns zero budget to pleasantries and social-repair language |
| Social-script substitution during execution-failure recovery | Operational task-state rule in `## Communication` |
| Unsupported agreement with a user correction | `## Task Contract` classifies claims and makes agreement evidence-based |
| Unsolicited image, SVG, icon, texture, or other visual-asset generation | `## Authority and Scope` requires explicit asset-level user authorization |
| User receives the agent's inaccessible-system investigation or verification work | `## Success and Ownership` retains agent ownership and limits handback to the smallest enabling action |
| Repeated approval requests for safe local work | `## Authority and Scope` permission boundary |
| Wrong model for ambiguous work | Root developer routing and role TOML |
| Mandatory review/repair loop | Removed from hooks; optional task topology only |
| Stale state creating new work | Continuity schema has no lifecycle authority |

One observation does not license a broad prompt rule. Record the observation,
identify the owner, change the narrowest surface, and add a discriminating test.

## Change procedure

1. Read the current asset, this contract, relevant observations, and the
   0.152.0 source audit.
2. Change one instruction group at a time and keep each rule in one layer.
3. Preserve positive phrasing and the Identity → Instructions → Examples →
   Context hierarchy. Keep the Instruction subsections and their order stable.
4. Update the pinned word count and SHA-256.
5. Run schema, skill, contract, and representative runtime validation.
6. Start a fresh installed session after changes; loaded sessions retain their
   effective instructions.

Live hosted model behavior remains `UNVERIFIED` until the isolated runtime
harness observes it.
