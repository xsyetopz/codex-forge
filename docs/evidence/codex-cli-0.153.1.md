# Codex CLI 0.153.1 capability delta

Forge targets `rust-v0.153.1`. This document records the release delta from
the pinned 0.152.0 source audit and the orchestration decision verified on
September 3, 2026.

Primary upstream sources:

- [Codex CLI 0.153.1 release](https://github.com/openai/codex/releases/tag/rust-v0.153.1),
  tagged at commit `9856412` on September 3, 2026;
- [official Codex changelog](https://developers.openai.com/codex/changelog);
- [official subagent configuration](https://developers.openai.com/codex/subagents);
- [0.153.1 Multi-Agent V2 spawn implementation](https://github.com/openai/codex/blob/rust-v0.153.1/codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs);
- [official app-server Goal contract](https://developers.openai.com/codex/app-server).

The 0.153.1 release contains one 0.153.0 backport: GPT-6 Astra model-catalog
support. Its published delta contains no Multi-Agent V2 or Goal-mode repair.
The complete 0.153.0 release adds an explicitly disabled experimental context
management mode but does not replace the stable Goal or subagent surfaces.

## Effective feature state

A local `codex-cli 0.153.1` probe on September 3, 2026 reported:

| Feature | Maturity | Effective default |
| --- | --- | --- |
| `goals` | stable | `true` |
| `multi_agent` | stable | `true` |
| `multi_agent_v2` | stable | `false` |
| `token_budget` | under development | `false` |
| `context_management` | under development | `false` |

Forge therefore leaves `goals`, `multi_agent`, and `multi_agent_v2` unset.
The first two already provide the stable default-on product surface. The
pinned Forge catalog selects V1 for its three GPT-5.6 slugs, so an explicit V2
feature value would conflict with the selected transport rather than improve
availability.

`features.token_budget` controls the experimental fresh-window context path.
It is distinct from the optional `token_budget` stored on a Goal. Forge keeps
the context feature disabled while preserving Goal mode. A Goal budget is
created only after an explicit user request; reaching it changes the Goal to
`budget_limited` and stops automatic continuation. The app-server
`thread/goal/set` contract can update a non-terminal Goal budget while
preserving its usage history.

## V1 versus V2 control

Multi-Agent V2 is materially improved but still lacks the control equivalence
Forge requires.

The 0.153.1 V2 spawn schema accepts `agent_type`, `model`,
`reasoning_effort`, and `fork_turns` when those fields are exposed. It rejects
the V1 `fork_context` argument. When `fork_turns` is omitted, V2 defaults to
`all`, creating a full-history fork; `fork_turns = "none"` is the explicit
fresh-context form.

Open upstream reports retrieved on September 3, 2026 document remaining
control failures:

- [#31814](https://github.com/openai/codex/issues/31814) reports that the
  default V2 metadata setting removes `agent_type`, `model`, and
  `reasoning_effort` from the model-visible schema, causing parent-model
  inheritance unless V2-specific settings are applied.
- [#33447](https://github.com/openai/codex/issues/33447) reports migration and
  precedence gaps around V2 concurrency configuration.
- [#34215](https://github.com/openai/codex/issues/34215) reports weak client UX
  for increasing a budget-limited Goal even though the app-server now exposes
  the underlying budget update.

These reports are observations, not universal proof. The exact 0.153.1 source
does establish two consequences relevant to Forge: V2 defaults to full-history
forks and uses a different argument/configuration contract. Forge already has
verified V1 role TOMLs, model/effort routing, `fork_context=false`, `max_depth =
1`, and focused hook matchers. V1 is therefore the safer supported transport
for this release.

## Forge 0.153.1 orchestration contract

Forge adopts the following bounded design:

- stable Goal and multi-agent availability come from Codex defaults;
- the complete pinned catalog restamps Sol, Terra, and Luna to V1 and standard
  Responses;
- `agents.max_concurrent_threads_per_session = 2` limits simultaneous child
  work;
- V1 `agents.max_depth = 1` and the spawn hook retain root-owned delegation;
- every child receives `fork_context=false`;
- the spawn hook admits at most six children per thread, one routine reviewer,
  and one hard-tail reviewer;
- routine review and debugging use Terra; Sol child work is reserved for
  architecture and one demonstrated hard tail;
- the root performs at most one repair cycle before integrating and validating;
- one Goal milestone maps to one thread, giving context, usage accounting, and
  child admissions a clear reset boundary;
- no Stop or SubagentStop hook can request continuation.

Official documentation states that each subagent performs its own model and
tool work and therefore consumes more tokens than a comparable single-agent
run. The two-thread concurrency ceiling and six-admission lifetime ceiling are
usage controls, not delegation targets.

## Local verification boundary

The local 0.153.1 bundled catalog selected V2 and Responses Lite for Sol and
Terra and V1 plus Responses Lite for Luna. `bun run catalog:refresh` copied the
complete host catalog and then applied the Forge contract: all three Forge
slugs use `multi_agent_version = "v1"` and `use_responses_lite = false`.

The prior [0.152.0 source audit](codex-cli-0.152.0.md) remains the detailed
source map for unchanged V1 instruction inheritance, hooks, and compaction
behavior. This delta owns the 0.153.1 release, feature state, Goal distinction,
and V1/V2 selection.
