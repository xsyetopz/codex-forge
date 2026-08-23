# Observational evidence synthesis - 2026-08-22

This document records why Forge changed behavior. It is documentation only; it isn't injected into every Codex turn.

## Evidence classes

The supplied Reddit captures are treated as structured observational evidence. Repeated reports do not become universal facts merely by repetition, but recurring failure shapes are useful when they agree with controlled tests, rollout logs, or public Codex behavior. Claims about exact quota weighting, cache TTL, or provider internals remain conditional unless independently exposed by the runtime/provider.

Upstream Codex 0.149.0 facts used here:

- Release 0.149.0 includes additional bounding/retention work and an interactive agents dashboard: <https://github.com/openai/codex/releases/tag/rust-v0.149.0>
- The 0.149.0 config schema exposes `tool_output_token_limit` and Code Mode settings, and documents `agents.max_depth` as V1-only.
- Leaf-model support for Multi-Agent V2 landed before 0.149.0, so Luna can be routed as a leaf worker when the active runtime exposes it.
- GitHub #35050 reports controlled same-task GPT-5.6 tests where explicit bounded Code Mode batching reduced outer cycles and weighted usage substantially; #32503 independently identified rare use of nested `Promise.all` in GPT-5.6 traces.

## Recurrent observations and Forge response

| Observation | Evidence strength used here | Forge 0.1.0-alpha.1 response |
| --- | --- | --- |
| Sol can perform broader blind audits but can overthink simple defects | repeated user reports; consistent with existing scope/verification failure controls | narrow-first escalation; blind consequential audit stays Sol; no local defect → architecture escalation without evidence |
| Luna performs better when given explicit observed/expected behavior, scope and oracle | repeated workflow reports | stronger child task packet; Luna only for bounded audit/implementation |
| Agents may stop after the first valid finding | repeated audit reports | review/debug continue through stated criteria and scope |
| Prior conclusions can be defended after contradictory evidence appears | repeated correctness reports | explicit evidence-conflict re-evaluation; no default environment-blame substitution |
| Long/project continuity can be over-assumed | repeated continuity/compaction reports | no cross-thread/model memory assumption; structured handoffs and compact state carry required facts |
| Independent Code Mode calls are often serialized | controlled A/B + independent trace + upstream issue | exact bounded `Promise.allSettled`/`Promise.all` batching guidance |
| Parent/subagent monitoring and handoffs can dominate usage | repeated token-log/workflow reports | one-child default; no progress polling/heartbeats; collect once; no-history forks |
| Repeated patch→test→fix and duplicate validation inflate context | repeated controlled project comparisons | first-pass convergence, common-cause repair, one focused validation batch |
| Tool-output compression alone doesn't solve repeated-context cost | benchmark/log reports; upstream exposes output budget but truncation can remove evidence | bound output at source; no forced global `tool_output_token_limit` |
| Prompt-cache lifetime/cost matters but reported TTL and subscription behavior vary | repeated direct-token observations with contradictory exact values | no cache-heartbeat optimization; reduce outer cycles and context churn instead |
| Human-facing summaries can become opaque or session-invented jargon | broad recurring reports | concrete mechanism-level wording; no carried invented labels when ordinary terms suffice |
| Large advertised token-saving percentages often shrink under full-session measurement | controlled benchmark reports | performance/research rules require matched workload and full-session outcome/cost, not payload-only claims |

## Deliberately not adopted

Forge doesn't hard-code a universal cache TTL, quota multiplier, cache-bump interval, or claimed percentage saving. It doesn't route every implementation to Luna, every retrieval to an indexer, or every task to subagents. It doesn't lower `tool_output_token_limit` globally without a measured workload because truncation can remove decisive evidence. It doesn't assume high cache-hit percentage means low total usage; repeated context can still dominate aggregate traffic.
