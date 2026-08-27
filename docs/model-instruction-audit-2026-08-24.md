# Model-instruction ambiguity audit (2026-08-24)

This audit is the long-form owner for instruction-layer and harness findings.
The maintainer index is [AGENTS.md](../AGENTS.md); the change process is
[CONTRIBUTING.md](../CONTRIBUTING.md); durable invariants are at the end of
this file.

This audit classifies four reported risks against the previous Codex Forge
instruction text. The classification is about the contract's possible readings,
not a claim that every GPT-5.6 model exhibits the failure on every task. Codex
Forge 0.1.0-alpha.4 selects a lean Forge model-instruction layer through
`model_instructions_file`
and adds a focused developer-instructions layer through `developer_instructions`.

## Alpha.4 target state

### Upgrade lifecycle limitation (2026-08-27)

An alpha.3 session can retain its loaded versioned plugin root while an
alpha.4 install or plugin refresh changes the cache. `CODEX_SESSION_ID` and
`CODEX_THREAD_ID` describe only the installer caller; they do not provide
cross-process liveness or a lease proving that another session has released a
candidate path. Forge therefore requires all Codex sessions and the app server
to be closed before plugin add/remove/upgrade, version restamp, install, or
uninstall. Its stale-cache operation remains conservative and defers deletion
without reliable cross-process evidence. Upstream cache retention after an
alpha.3-to-alpha.4 transition is recorded as `UNVERIFIED`, not as a Forge
guarantee.

- Forge's model instructions come from `assets/model-instructions.md`, installed
  at `$CODEX_HOME/forge/model-instructions.md` and selected by the managed
  `model_instructions_file` key. Forge contributes runtime orchestration through
  `developer_instructions` from `assets/developer-instructions.txt`.
- Forge targets the legacy multi-agent V1 surface: registered `[agents]` roles
  point to Forge TOML files, each role supplies its own `model` and
  `model_reasoning_effort`, and fresh children use `fork_context=false`.
- Forge sets `agents.max_concurrent_threads_per_session = 8`. Current Codex
  documentation defines this as the cap on concurrently open spawned-agent
  threads excluding the primary; completed threads are collected and closed to
  release capacity. The eight-thread ceiling is a capacity boundary, while
  the root guidance keeps the ordinary active set at 2-4 and expands toward
  5-8 for genuinely independent read-heavy or mechanically sharded work.
  Source: [Codex subagents configuration](https://developers.openai.com/codex/agent-configuration/subagents).
- The installer treats 8 as Forge's fresh default, migrates a prior managed
  default of 3 to 8, preserves a user-selected cap such as 6 in either a
  managed block or an unmanaged `[agents]` setting, and records the effective
  choice in install state so a later reinstall preserves it.
- Registered Forge routing follows the current GPT-5.6 model guidance: Luna
  handles clear, repeatable, high-volume execution; Terra handles balanced
  everyday and read-heavy retrieval; Sol handles complex, ambiguous, and
  high-value architecture, debugging, and semantic review. The Forge role
  files are the routing authority, so root delegation names a registered role
  before considering any raw model override. Source: [Codex model selection](https://developers.openai.com/codex/models).
- The plugin copies the checked-in pinned `assets/model-catalog.json` to
  `$CODEX_HOME/forge/model-catalog.json` and points `model_catalog_json` at
  that file. Forge slugs are restamped to `multi_agent_version = "v1"`.
  `use_responses_lite` is set to `false` so `model_instructions_file` remains
  the replacement base layer on standard Responses.
- Codex's default-on `multi_agent` and `hooks` features remain active; Forge
  leaves those keys at their native defaults. `features.multi_agent_v2` stays
  unset: the flag is stable and disabled by default on Codex installs.
  Enabling it globally forces V2 for every model.
- Forge workflow skills set `policy.allow_implicit_invocation = false`. Ordinary
  tasks follow normal Codex routing, explicit `$forge-*` selectors activate the
  selected workflow, and host skill loading uses Codex-native filesystem
  loading.

### Subscription-aware effort defaults (2026-08-27)

The supplied subscription effort guide reports relative usage rather than a
deterministic quota formula. Forge therefore applies its escalation rule at the
static role boundary: the root and ordinary registered roles start at medium
effort, bounded scouting starts at Luna low, and only explicitly escalated
hard-tail roles use xhigh. Forge keeps the root model on Sol for supervision and
semantic judgment, while routine leaf execution remains on Luna or Terra. This
addresses reasoning loops and quota spikes at the lowest owner available—the
model/effort settings—without claiming a fixed subscription cost or promising a
particular allowance saving.

| Reported risk | Classification | Discriminating reason | Enforced boundary |
| --- | --- | --- | --- |
| “Run relevant non-destructive validation” is broad. | Legitimate ambiguity | “Relevant” did not say whether a result could change the completion decision, so unnecessary suites remained compliant. | Select the smallest non-destructive validation whose result can materially discriminate the requested behavior. |
| “Implement the enforcing or root cause” can overshoot a mechanical request. | Legitimate conditional conflict | A model could substitute an inferred architectural root cause even when the user specified the exact edit. | A specified mechanical request gets that literal change. Root-cause work is reserved for outcome-defined requests and must remain supported and in scope. |
| “Implicit contract consequences” is expansive. | Legitimate undefined boundary | “Implicit” did not identify what evidence makes a consequence mandatory. | Include consequences mechanically implied by an established interface or invariant; keep speculative consequences outside scope. |
| Default worker delegation adds overhead. | Legitimate measured tradeoff | A second context adds transfer and coordination cost, while role-specific model and effort routing can improve correctness. | Root delegates repository work to owning Forge roles; one exact operation with an immediate oracle remains a direct root action. DeepSWE reports the resulting pass/tool-call tradeoff. |

The first three risks are semantic ambiguities rather than unconditional logical
contradictions. The fourth is an explicit orchestration tradeoff selected for
alpha.4 and measured rather than assumed. The replacement file now contains the
four enforced-boundary readings. Static contract tests pin those markers, the
absence of named stock preamble/friendliness clauses, and a ban on negative
constructions in both instruction layers. DeepSWE measures the resulting
whole-trajectory effect; it cannot by itself attribute a pass or call reduction
to one sentence, so component attribution remains an ablation question.

## Why leaving stock `default.md` is the wrong recommendation

Codex documents `model_instructions_file` as an optional override whose default
is unset. Historical sample config called it a legacy base-instruction override
and told operators to prefer `AGENTS.md`. Official Codex guides put custom
behavior in `AGENTS.md`. The GPT-5.6 prompting guide says not to rewrite a
working prompt stack all at once. Conservative commentary restates the scare:
unless you are building a custom harness, append with `developer_instructions`
and leave the built-in identity alone.

That advice is wrong for a coding harness, including Forge, for five reasons.

1. **Wrong layer.** Stock `default.md` is the system/base identity. The same
   file says system, developer, and user instructions take precedence over
   `AGENTS.md`. `developer_instructions` is additive. Neither surface can cancel
   “Before making tool calls, send a brief preamble”, “keep your tone light,
   friendly and curious”, or “feel free to be ambitious”. An additive “stay
   silent” against a base “send a preamble” is two instructions. OpenAI’s
   GPT-5.6 prompting guide says conflicting rules create more instability than
   missing detail. The only supported replacement of `default.md` is
   `model_instructions_file`.

2. **The lost default behavior is the product bug.** The warning that
   replacement “loses default tool-use behaviour” treats preamble, friendliness,
   test-eagerness, ambition, and next-step padding as precious. Those clauses
   authorize the token waste and therapist-coding-agent failure the stock file
   produces. Operational tool-use (`apply_patch`, `rg`, AGENTS.md lookup) is
   restated in the replacement. Identity is what must be replaced.

3. **OpenAI contradicts its own model guide.** The GPT-5.6 prompting guide
   reports that, in an internal coding-agent sample, leaner system prompts
   improved eval scores by roughly 10–15% and reduced total tokens by 41–66%.
   It says broad labels such as “friendly” are ambiguous. Codex still ships a
   276-line `default.md` built from that rejected class of instruction, then
   tells CLI users to leave it in place. Following “do not override” means
   running the prompt the same organization’s model guide says to strip.

4. **“Do not rewrite all at once” is an attribution heuristic, not a reason to
   keep a known-bad identity.** Forge isolates the replacement in one file,
   keeps Forge-specific worker/reviewer protocol in `developer_instructions`,
   and measures against stock with DeepSWE (the comparison arm leaves
   `model_instructions_file` unset). That is the migration workflow the guide
   actually asks for: one changed surface, a matched baseline.

5. **Forge is the custom harness the conservative advice carves out.** A plugin
   that replaces personality, silence, validation, and orchestration is not a
   casual `AGENTS.md` tweak. Leaving stock `default.md` and stacking Forge
   developer text on top would reintroduce the conflict in reason 1.

## Replacement semantics (2026-08-26)

`model_instructions_file` replaces Codex’s built-in base instructions
(`codex-rs/protocol/src/prompts/base_instructions/default.md`) on the standard
Responses path. It does not merge with them. The current `default.md` on
`openai/codex` main is 276 lines.

GitHub issue [openai/codex#38355](https://github.com/openai/codex/issues/38355)
reports that Responses Lite sends the override as an additive developer message
while leaving service default identity in place. The issue’s A/B used
`gpt-5.6-sol` as the Lite-enabled model: with Lite on, a presence probe for
“You are Codex” returned YES; with Lite off, NO. Bundled `models.json` sets
`use_responses_lite: true` for `gpt-5.6-sol`, `gpt-5.6-terra`, and
`gpt-5.6-luna` ([openai/codex#31882](https://github.com/openai/codex/issues/31882)).
Forge’s root model is `gpt-5.6-sol`. On the ChatGPT/Codex backend, the managed
`model_instructions_file` would therefore ride as an additive developer message
on top of the service Sol identity if Forge kept those entries unchanged.
Forge instead installs a pinned complete catalog with `use_responses_lite: false`
for the three GPT-5.6 slugs. This deliberately selects standard Responses,
where the file is the replacement base layer, while also restamping
multi-agent V1.

The DeepSWE `forge-core` arm sets `model_instructions_file`. The comparison arm
leaves that key unset so stock `default.md` remains the base layer.

## Stock `default.md` incentives

These are readings of the current stock text, not a claim about OpenAI’s motive.
A sabotage or product-degradation intent is unsupported. The clauses exist and
they authorize the named behaviors.

| Stock clause class | What the text authorizes | Why it is costly for a coding agent |
| --- | --- | --- |
| Personality: “concise, direct, and friendly”; “light, friendly and curious”; “collaborative and engaging” | Rapport, preamble color, teammate voice | Token spend on social texture. OpenAI’s GPT-5.6 prompting guide says broad labels such as “friendly” are ambiguous and should be replaced by specific writing choices. |
| “Always keeping the user clearly informed about ongoing actions”; mandatory preamble before tool calls; progress updates on long work | User-visible speech before and during tool use | Not a heartbeat. It is model-generated commentary. GPT-5.6 prompting guide now says not to narrate routine tool calls and to use at most a short first-call update plus sparse phase changes. Forge’s product choice is silence except required input, authorization, a material scope decision, a blocker, or the final result. |
| “Clearly stating assumptions, environment prerequisites, and next steps” | Unsolicited planning and gap-filling | Assumptions stated without discriminating evidence become invented context. Next steps become a second task the user did not request. |
| Validation philosophy: start specific then broaden “as you build confidence”; add tests when adjacent patterns look like a logical place; proactive tests on “test-related” tasks regardless of approval mode | Suite expansion and repeated test runs | “Confidence” is not an observable. Adjacent tests are not a mandate to author new tests. Approval mode `on-request` already holds tests until the user is ready under stock rules; “test-related” is a leak that reopens proactive runs. |
| Greenfield: “feel free to be ambitious and demonstrate creativity” | Scope expansion on new work | GPT-5.6 frontend guidance says not to add extra features unless requested. Owner reports since GPT-5.3-Codex are the same shape: unsolicited dumps, invented stages, bird’s-eye answers. |
| “Adapt to the user’s style”; final answers as a “concise teammate”; “any relevant next step or quick option” | Style mirroring and continuation offers | “Style” is not repo coding convention. Mirroring diction and adding next steps fight a literal-request contract. |
| Final-answer markdown formatting bible (Title Case headers, bullet grammar, file-ref micro-syntax, don’t-nest, don’t-say-bold) | Renderer-oriented prose | Always-on instruction weight. Clickable path rules and the `【F:…】` citation ban are the only parts that are CLI-operational rather than voice. |

Stock `default.md` also contains operational clauses that are not personality:
`apply_patch` spelling, `rg` over `grep`, AGENTS.md nested lookup including
outside CWD, no unsolicited commit/branch, no copyright headers, no inline
comments unless asked, no one-letter names, do not re-read after a successful
patch, keep going until the query is resolved, and approval-mode test gating.
Replacement drops those unless Forge or the active harness supplies them.
Current Forge keeps the model layer tool-agnostic: it preserves scoped
AGENTS.md authority, native skill loading, safe local execution, evidence-led
scope, and discriminating validation. Tool-specific routing remains in the
harness and Forge workflow layers rather than expanding the replacement
identity. One-letter variable names and renderer-specific file-link syntax
remain unstated.

## GPT-5.6 prompting guide versus stock `default.md`

OpenAI’s GPT-5.6 prompting guide (developers.openai.com, “Prompting guidance
for GPT-5.6 Sol”) independently recommends removing the class of instruction
that still dominates stock `default.md`.

Reported internal coding-agent sample, directional only, not a Forge guarantee:
leaner system prompts improved eval scores by roughly 10–15%, reduced total
tokens by 41–66%, and reduced cost by 33–67%. The same guide says to state each
instruction once, trim repeated style/process text, keep outcome, success,
constraints, tool routing, and required output shape, and use `text.verbosity`
for default length.

Forge already sets `model_verbosity = "low"` and `personality = false`, and
names required final fields (result, changed paths, validation, unresolved
uncertainty). That is the pattern the guide recommends: verbosity for default
length, prompt for required content.

The guide does not fully agree with Forge’s silence contract. It still
recommends a short visible preamble before the first tool call on multi-step
work, “next action” in short answers, and “run the most relevant validation”.
It also says GPT-5.6 infers the user’s underlying goal so the prompt often need
not prescribe every step. That last claim is the same failure shape as
“bird’s-eye view instead of the asked question”. Forge’s literal-request rule
is a deliberate counter-prompt against that model tendency. Whether the counter
holds is an eval question.

The guide’s compact autonomy policy used “run relevant non-destructive
validation”. Forge’s Operating mode now uses the discriminating-acceptance
wording instead of that sample phrase, and Work step 6 sequences expansion
only when the small check leaves material uncertainty or a repository
contract requires a broader gate once. GPT-5-class models follow prompt
contracts closely; conflicting rules can create more instability than missing
detail, which is why the looser OpenAI sample phrase was removed.

## Owner failure shapes versus this layer

These shapes are the Forge owner’s longitudinal observations from GPT-5.3-Codex
and GPT-5.4 onward, reported as carried into the GPT-5.6 family. They are
treated as structured observational evidence from a power user of the same
products, not as a one-off ChatGPT-product ticket and not as a universal law.
Stock instruction text independently authorizes the same shapes. Overlap with
the replacement file:

| Reported failure shape | Stock `default.md` contribution | Current Forge counter |
| --- | --- | --- |
| Invents work, stages, next steps, bird’s-eye answers | Ambition, next steps, “keep the user informed”, infer-the-goal | Exact user requirements, the narrowest success condition, and the requested in-scope result define completion |
| Protects a prior wrong answer; blames environment | No revise-on-contrary-evidence rule | “Revise conclusions when contrary evidence appears”; explanations stay provisional until discriminating evidence |
| Fills gaps instead of asking for the missing artifact | “Clearly stating assumptions” | One focused question when a material choice remains unresolved; mark unverified evidence |
| Does not check current sources | No current-docs rule | Current-upstream acceptance uses external evidence through the Forge developer and research layers |
| Conversational padding, praise, therapist voice | Friendly/curious/collaborative personality | Interim speech is reserved for required input, authorization, material scope decisions, and blockers; completion gets one result |
| Cross-thread or compacted continuity presented as understanding | Stock resume-as-if-complete; ChatGPT product memory is a separate surface with the same shape | The compact prompt preserves an explicit execution checkpoint; missing facts remain uncertainty |
| Style mirroring; invented ownership | “Adapt to the user’s style” | Exact user requirements and scoped repository conventions govern the work |

## Edits applied to `assets/model-instructions.md` (2026-08-27)

The accepted file is a positive, tool-agnostic replacement contract. It keeps
only identity, authority, evidence, scope, validation, authorization, and
user-facing output boundaries. Forge-specific role routing remains in the
developer layer.

The accepted replacement is 245 whitespace-delimited words. Its SHA-256 is
`c56fe1c16b0b54ea2571f23656eb5b0a997e54560c0c3aedc86c84e72264de50`. Sentence
order follows the GPT-5.6 suggested prompt structure without section labels:
Role, Goal (user requirements and stated order), Success, Constraints,
Tools/evidence, Output, Stop. Personality is omitted. The user-requirement
sentence precedes execution guidance.

| Contract | Why |
| --- | --- |
| Authority and preservation | System, developer, user, scoped AGENTS.md, then verified evidence gives one precedence chain while preserving exact requirements, stated order, and unrelated worktree state. User requirements sit in the Goal slot before the tool-outcome sentence. |
| Acceptance and evidence | Expected observable behavior, the stable boundary, and minimum owner/caller/interface/invariant evidence constrain reconnaissance and inference. |
| Mechanical versus causal changes | A specified mechanism receives that mechanism; outcome-defined work receives a supported in-scope causal fix. |
| Discriminating validation | The smallest reversible check decides the boundary first; one broader final gate follows only from remaining material uncertainty or an established repository contract. |
| Current-thread lifecycle | Goal tools synchronize, create goals on explicit user request, and record completion or a repeated impasse. User/system controls own pause, resume, edit, and clear. Returned exec and V1 agent identifiers remain scoped lifecycle handles; stale owned terminals terminate, active agents are collected, and integrated agents close. |
| Silent execution and terse completion | User-facing interim messages serve required input, authorization, a material scope decision, or a blocker. All other state stays internal; repository-change completions list changed paths, validation, and material uncertainty. |

Residual readings that remain accepted tradeoffs: stacked brevity plus
`model_verbosity = "low"` can make answers too short (required final fields are
the mitigation); no preamble can look like a hung session (heartbeat is a
harness concern); worker/reviewer protocol lives in `developer_instructions`
because registered Forge names belong there; one-letter names and
renderer-specific formatting stay unstated.

Prompt-only text does not enforce behavior. Hooks, `forge.rules`, role
sandbox, and approval policy remain the hard layers. This file is the
replacement identity that those layers assume.

## Harness evidence (0.149.1-0.150.1 / GPT-5.6, 2026-08-27)

The installed host reports `codex-cli 0.150.1`; `goals`, `hooks`,
`multi_agent`, and `unified_exec` are stable and enabled, while
`multi_agent_v2` is stable and disabled. The 0.150.1 release changes retained
image accounting during remote compaction and leaves the relevant goal,
unified-exec, standard/Lite Responses, and V1 multi-agent contracts intact.

The tagged goal tool surface exposes `get_goal`, `create_goal`, and
`update_goal`; the update enum contains `complete` and `blocked`, with pause,
resume, budget-limit, and usage-limit transitions assigned to the user or
system. The TUI represents paused/blocked/usage-limited goals separately and
offers a resume action after session resume. Sources:
[`goal spec`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/ext/goal/src/spec.rs#L9-L93),
[`paused-goal resume gate`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/tui/src/app/thread_goal_actions.rs#L54-L85), and
[`resume prompt`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/tui/src/chatwidget/goal_menu.rs#L40-L69).

Unified exec exposes `write_stdin` for a returned session identifier. Codex's
session process manager lists and terminates background processes owned by that
session; the TUI maps `/ps` to listing and `/stop` to stopping all such
background terminals. The model tool surface has no standalone
`terminate_session` function in 0.150.1, so Forge retains returned identifiers
and scopes process termination to current-thread ownership. Sources:
[`write_stdin` spec](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/core/src/tools/handlers/shell_spec.rs#L113-L154),
[`process lifecycle`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/core/src/unified_exec/process_manager.rs#L1537-L1605), and
[`/ps` and `/stop`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/tui/src/slash_command.rs#L119-L120).

Legacy V1 provides wait, resume, and close lifecycle tools. Completed workers
and other integrated agents remain open and consume concurrency until
`close_agent` runs, which makes prompt collection followed by prompt closure a
real resource invariant rather than ceremony. The designated reviewer remains
open through repair follow-ups, reuses the same target for each recheck, and
closes after final acceptance.
Immediate V1 redirection uses `send_input` with `interrupt=true`. Sources:
[`V1 lifecycle specs`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/core/src/tools/handlers/multi_agents_spec.rs#L247-L338) and
[`V1 send-input contract`](https://github.com/openai/codex/blob/rust-v0.150.1/codex-rs/core/src/tools/handlers/multi_agents_spec.rs#L151-L190).

Sources reviewed: [openai/codex#38355](https://github.com/openai/codex/issues/38355),
[openai/codex#40042](https://github.com/openai/codex/issues/40042) (0.149.0-alpha;
role-override drop still the bounded-role contract),
[openai/codex#32031](https://github.com/openai/codex/issues/32031),
[openai/codex#31097](https://github.com/openai/codex/issues/31097),
[openai/codex#11588](https://github.com/openai/codex/issues/11588),
[openai/codex#31882](https://github.com/openai/codex/issues/31882),
Bolin’s [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/),
the [GPT-5.6 prompting best practices](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6#prompting-best-practices),
the [GPT-5.6 Sol prompting guidance](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6),
the [builder’s guide](https://openai.com/index/builders-guide-to-gpt-5-6/),
[Austin1serb/agents-md](https://github.com/Austin1serb/agents-md) (GPT-5.5-era,
useful where it matches 5.6 harness facts), and the captured Sol identity in
[asgeirtj/system_prompts_leaks OpenAI/Codex](https://github.com/asgeirtj/system_prompts_leaks/tree/main/OpenAI/Codex)
(observational capture of client-cache prompts, not a Forge source to copy).
The source-level inheritance boundary is also pinned to OpenAI Codex commit
[`4347f94`](https://github.com/openai/codex/blob/4347f94d5539880e8583028a50a19df5b202d9fa/codex-rs/core/src/tools/handlers/multi_agents_common.rs#L176-L185):
`build_agent_spawn_config` copies the parent's effective `BaseInstructions`
text and provenance into the child config. The corresponding
[`AgentRoleOverrides`](https://github.com/openai/codex/blob/4347f94d5539880e8583028a50a19df5b202d9fa/codex-rs/core/src/agent/role.rs#L37-L50)
surface carries role-local developer instructions, model, effort, summary,
verbosity, personality, service tier, feature reductions, and skill reductions;
it has no role-local `model_instructions_file` field.

### Responses Lite is additive; Forge selects standard Responses

Bolin’s post states the official contract: the Responses `instructions` field
is `model_instructions_file` if set, otherwise the bundled per-model
`base_instructions`. That is replacement on standard Responses.

Lite changes the wire format: empty top-level `instructions`, custom text as a
later `role=developer` item, service Codex identity retained. The #38355 probe
on `gpt-5.6-sol` confirmed the stock “You are Codex” identity remains. The
bundled catalog hardcodes `use_responses_lite: true` for Sol, Terra, and Luna.
Forge’s installer changes all three of those slugs to `false`.

The captured `gpt-5.6-sol.md` identity is stronger personality than CLI
`default.md`: old-friend tone, match the user’s altitude, commentary at least
every 60 seconds, a “safe, relevant next step” after change/build, and implicit
skill use when a task matches a skill description. That last clause conflicts
with Forge skills’ `allow_implicit_invocation = false`. That is why Forge
selects standard Responses for the active GPT-5.6 catalog entries instead of
stacking the lean file beneath the Lite service identity.

### Standard Responses is shipped through a complete pinned catalog

0.149.1 `codex-rs/core/src/client.rs` (`build_responses_request` /
`build_reasoning`) binds Lite to more than instruction placement. With Lite
on: top-level `instructions` is empty, tools go in an `additional_tools`
developer item, base text is a later developer message, `parallel_tool_calls`
is forced off, and `reasoning.context` is `AllTurns`. With Lite off: top-level
`instructions` is `base_instructions.text` (true replace), tools are top-level,
and `reasoning.context` is omitted so Responses uses `current_turn`.

The #38355 author reported that restoring top-level `instructions` while
keeping Lite did not produce a successful response. `model_catalog_json` is a
full catalog replace, not a one-field patch; incomplete catalogs fail startup.
Forge accepts the client-side consequences of selecting standard Responses:
reasoning context uses the standard current-turn behavior and tools use the
standard top-level encoding. The pinned catalog is a complete snapshot of the
host bundled catalog with only Forge's three slugs patched to legacy V1 and
`use_responses_lite: false`. Runtime install and revert copy that exact asset;
the explicit developer refresh command is the only path that invokes the host
catalog CLI.
Authenticated fresh-session root and child behavior remains the integration
oracle for backend compatibility.

### `features.multi_agent_v2` stays unset

[openai/codex#32031](https://github.com/openai/codex/issues/32031) is why Forge
does not enable V2. The V2 spawn surface is the default for `gpt-5.6-sol` /
`gpt-5.6-terra` when that catalog pin is in effect, and for any model when
`features.multi_agent_v2` is on. Two compounding defaults make heterogeneous
role routing undiscoverable and easy to get wrong:

1. `hide_spawn_agent_metadata` defaults to `true`. The advertised spawn schema
   strips routing fields (`model`, `reasoning_effort`, `agent_type`,
   `service_tier` in the issue’s surface). Agents conclude model selection does
   not exist. Setting `hide_spawn_agent_metadata = false` is not a ChatGPT-auth
   workaround: the backend treats `collaboration.spawn_agent` as reserved and
   rejects a client schema that does not match.
2. Omitted `fork_turns` defaults to a full-history fork (`"all"`). On that
   path the natural override call — a different model or role without an
   explicit fresh fork — is the rejected or inherit-parent shape. The working
   call needs `fork_turns: "none"` (or a partial fork), which the default
   schema does not teach.

0.149.1 still matches the parts Forge depends on. `features.multi_agent_v2` is
stable and default-off. Enabling it overrides every model onto V2, including
`gpt-5.6-luna`, which the bundled catalog still pins to `v1`. V2 spawn rejects
Forge’s V1 argument `fork_context=false` (`fork_context is not supported in
MultiAgentV2; use fork_turns instead`). Catalog `multi_agent_version` still
wins when the feature is off ([openai/codex#31097](https://github.com/openai/codex/issues/31097);
0.149.1 bundled catalog: Sol/Terra `v2`, Luna `v1`). Forge restamps those
Forge slugs to `v1` in the pinned `model_catalog_json`. Orchestration stays
on registered V1 roles, `fork_context=false`, `max_depth = 1`, and V1 tool
names.

### Children inherit the parent base; role-local `model_instructions_file` is dropped

[openai/codex#40042](https://github.com/openai/codex/issues/40042) on 0.149.0
alpha: `build_agent_spawn_config` copies the parent session’s
`BaseInstructions` into the child; `AgentRoleOverrides` carries
`developer_instructions`, model, effort, verbosity, personality, and capability
reductions, and does not carry `model_instructions_file`. The field is accepted
in role TOML and then silently lost.

That matches Forge’s current design: one root `model_instructions_file`, role
TOML files without that key, role-local `developer_instructions` only. The
5.5-era pattern of a different `model_instructions_file` per subagent
([Austin1serb/agents-md](https://github.com/Austin1serb/agents-md/blob/main/change-codex-system-prompt.md))
does not work on this runtime. Do not add the key to Forge role files expecting
isolation.

[openai/codex#11588](https://github.com/openai/codex/issues/11588) asked for
CLI replace/append flags because `AGENTS.md` cannot switch identity at
runtime. Closed. `model_instructions_file` remains the supported replace path,
subject to the Lite caveat.

### GPT-5.5-era AGENTS.md patterns: keep bound output, drop preamble

[Austin1serb/agents-md](https://github.com/Austin1serb/agents-md) is GPT-5.5-era.
Keep: byte-cap unknown or potentially large command output (`head -c` / `tail -c`,
not line caps); skip full suites unless risk justifies them; subagents only
when they save context or time. That agrees with Forge’s bound-output and
discriminating-validation rules. Forge still refuses a global
`tool_output_token_limit` because truncation can delete the discriminating
oracle. Byte-caps belong on unknown dumps, not on the validation that decides
completion.

Drop from that repo: “state the approach before editing”, intra-task progress
updates, `Oververbosity:low` as prompt text (Forge already sets
`model_verbosity = "low"`), and the claim that `model_instructions_file` cannot
override the hidden system prompt. That last claim is false on standard
Responses (Bolin) and accidentally true under Lite (#38355).

The generic [prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
page still ships 5.5 agentic samples (keep going until resolved, tool
preambles, TODO lists). The current source for 5.6 is
[prompting best practices](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6#prompting-best-practices).
The [builder’s guide](https://openai.com/index/builders-guide-to-gpt-5-6/)
supports steerage of when to spawn subagents, PTC for deterministic reduction,
and lower reasoning effort on 5.6; it does not restore stock personality.

### What this changes outside the replacement file

Harness sources above drove the catalog/V1 restamp, not prompt text.
`features.multi_agent_v2` stays unset. Role inheritance is already the Forge
layout. A later Forge-user session inverted a stated check-before-use order
and launched PCSX2 with `--version` before the check. The replacement keeps
the user’s stated order in the Goal slot, before the tool-outcome sentence,
following the [GPT-5.6 suggested prompt structure](https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6).
That session is not a license to add a flags-from-docs policy or the guide’s
“resolve required discovery before taking an action” sentence.

## Maintainer invariants

This audit is the long-form owner for instruction-layer and harness findings.
[AGENTS.md](../AGENTS.md) is the index; [CONTRIBUTING.md](../CONTRIBUTING.md)
is the change process. Word count and SHA-256 of `model-instructions.md` are
pinned in `tests/unit/repository-contracts.test.mjs`, not in README prose.

- Replace identity with `model_instructions_file`. Additive
  `developer_instructions` and repository `AGENTS.md` cannot cancel stock
  preamble, friendliness, or ambition.
- Keep `features.multi_agent_v2` unset. Catalog restamp is how Sol/Terra/Luna
  leave the bundled V2 pin. Enabling the feature globally forces V2 for every
  model, including Luna, and V2 rejects Forge’s `fork_context=false`.
- Ship a complete pinned catalog. `model_catalog_json` is a full replace;
  a one-field Lite patch fails startup. Forge restamps only the three GPT-5.6
  slugs to `multi_agent_version = "v1"` and `use_responses_lite = false`.
- Leave `model_instructions_file` off role TOML. Children inherit the parent
  `BaseInstructions`; Codex accepts then drops that key on role overrides.
- Keep instruction assets positive-phrasing. Reorder is structure, not a new
  rule set. Goal (user requirements and stated order) precedes “produce
  outcomes through the tools”.
- Record one observed failure, then change the smallest matching sentence.
  Do not widen a CLI, flag, or tool-use case into a universal discovery policy.
- Prompt prose is guidance. Hooks, `forge.rules`, role sandbox, and approval
  policy remain the hard layers.
- `$CODEX_HOME/forge/model-instructions.md` and the installed pinned catalog
  update only on `install`, `revert`, or `--replace`. Editing a plugin asset
  does not change an already-installed Codex home.
