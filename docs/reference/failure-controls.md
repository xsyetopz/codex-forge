# Failure controls

This reference maps observed failure shapes to their lowest current Forge owner.

This is an implementation cross-reference, not a validator schema. Each source failure is mapped to the lowest Forge layer that can materially address it. Prompt-only items aren't represented as hard runtime guarantees.

For context continuity specifically, Forge selects standard summary-backed compaction in configuration, uses the compact prompt to produce the handoff, and uses base instructions to consume it. Token-budget context resets remain disabled because their fresh-window path lacks the durable checkpoint contract Forge requires; Codex CLI 0.150.1 retained-image accounting and 0.151.0 nested-goal accounting do not change that boundary. See [context compaction](../operations/compaction.md).

| Category | Failure | Forge control |
| --- | --- | --- |
| Authority & scope | Invented authorization | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Authority & scope | Decision ownership theft | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Authority & scope | Scope creep | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Authority & scope | Unauthorized environment mutation | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Authority & scope | Destructive-operation overreach | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Authority & scope | Compatibility invention | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Authority & scope | Negative-condition inversion | base authority rules + approval boundary for authorizable actions + Forge hard-deny enforcement for dangerous actions |
| Interpretation & assumptions | Silent assumption filling | base evidence/assumption rules + compact state preservation |
| Interpretation & assumptions | Intent invention | base evidence/assumption rules + compact state preservation |
| Interpretation & assumptions | Example or convention promoted to requirement | base evidence/assumption rules + compact state preservation |
| Interpretation & assumptions | Rejected assumption persistence | base evidence/assumption rules + compact state preservation |
| Interpretation & assumptions | Ambiguity overconfidence | base evidence/assumption rules + compact state preservation |
| Interpretation & assumptions | Unnecessary clarification | base evidence/assumption rules + compact state preservation |
| Interpretation & assumptions | Threshold and magic-number invention | base evidence/assumption rules + compact state preservation |
| Architecture & abstraction | Premature abstraction | model instructions + architecture role contract |
| Architecture & abstraction | Familiar-pattern architecture | model instructions + architecture role contract |
| Architecture & abstraction | Source-of-truth hallucination | CodeGraph/source evidence + architecture role contract |
| Architecture & abstraction | Spec/schema reflex | model instructions + repository conventions |
| Architecture & abstraction | Artifact proliferation | model instructions + user-requested acceptance boundary |
| Architecture & abstraction | Current-state/goal conflation | model instructions + explicit task contract |
| Architecture & abstraction | Responsibility collapse | architecture role contract + boundary tests |
| Architecture & abstraction | Public-surface inflation | model instructions + contract tests |
| Architecture & abstraction | Fallback/retry reflex | model instructions + explicit failure evidence |
| Architecture & abstraction | Cache/state persistence invention | architecture contract + source evidence |
| Sources & evidence | Memory over source | base continuity rule + compact state + applicable forge-* skill; current repository/tool evidence wins |
| Sources & evidence | Adjacent-source substitution | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Sources & evidence | Search-result authority | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Sources & evidence | Evidence overreach | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Sources & evidence | Stale-source use | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Sources & evidence | Benchmark/harness conflation | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Sources & evidence | Popularity presented as correctness | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Tool use & execution | Tool skip | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Unnecessary tool use | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Tool-result ignore | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Tool-output fabrication | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Tool-argument hallucination | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Stated check-before-use sequence inverted | base instructions: user requirements and stated order precede the tool-outcome sentence (GPT-5.6 Goal before Tools) |
| Tool use & execution | Tool failure masking | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Cascading execution after broken invariant | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Wrong-tool or wrong-protocol assumption | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Reasoning leakage into machine arguments | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Unbounded tool loop | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Serializable independent-call churn | concrete Code Mode bounded batching rule; dependencies/adaptive work remain sequential |
| Tool use & execution | Poll/heartbeat churn | normal multi-agent V1 wait contract + PreToolUse rewrite that raises short waits to 300 seconds |
| Tool use & execution | Stale current-thread background terminal | base current-thread lifecycle rule + developer exec-session ownership contract + returned session identifier |
| Code & contract correctness | Interface-shape mismatch | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | One-sided contract edit | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Partial implementation presented as complete | model instructions + applicable forge-* skill provide guidance/workflow; the repository contract test deterministically guards shipped instruction artifacts; live-model behavior remains UNVERIFIED unless a hook or rule enforces it |
| Code & contract correctness | Staged version/phase presented as completion while a bounded requested outcome remains unfinished | model instructions provide current-workstream acceptance-boundary guidance; observational evidence is recorded in `observational-evidence-2026-08-22.md`; the repository contract test guards the shipped artifacts, while live-model behavior remains UNVERIFIED unless a hook or rule enforces it |
| Code & contract correctness | Silent code loss | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Generated-source confusion | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Wrapper-source confusion | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Defensive-validation inflation | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Error swallowing | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Comment/log/TODO used as a fix | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Verification & testing | Green-test completion fallacy | reviewer role + claim-relevant verification contract |
| Verification & testing | Checker overfitting | reviewer role + claim-relevant verification contract |
| Verification & testing | Runtime-proof substitution | reviewer role + claim-relevant verification contract |
| Verification & testing | Test-as-spec absolutism | reviewer role + claim-relevant verification contract |
| Verification & testing | Visible-test overfitting | reviewer role + claim-relevant verification contract |
| Verification & testing | Verification-scope inflation | reviewer role + claim-relevant verification contract |
| Verification & testing | Verification-scope underreach | reviewer role + claim-relevant verification contract |
| Verification & testing | Verification churn | reviewer role + focused validation batch |
| Verification & testing | Tautological/static-structure test generation | model instructions + reviewer role require a test to distinguish a meaningful wrong behavior, regression, boundary, or failure mode |
| Verification & testing | Flaky-success laundering | reviewer role + claim-relevant verification contract |
| Verification & testing | Snapshot/golden acceptance reflex | reviewer role + claim-relevant verification contract |
| Verification & testing | Mocking away the behavior | reviewer role + claim-relevant verification contract |
| Verification & testing | Reproducibility leakage | reviewer role + claim-relevant verification contract |
| Repository hygiene & change discipline | Opportunistic cleanup | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Mass rewrite/search-replace overreach | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Dependency/lockfile churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Generated/build artifact contamination | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Filesystem metadata churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Workflow & stopping | Analysis paralysis | base instructions + stop/completion contract |
| Workflow & stopping | Activity-as-progress | base instructions + stop/completion contract |
| Workflow & stopping | Premature hand-back | base instructions + stop/completion contract |
| Workflow & stopping | Blocker invention | base instructions + stop/completion contract |
| Workflow & stopping | Root-cause avoidance | debugger role + stop/completion contract |
| Workflow & stopping | First-finding premature audit stop | debugger/reviewer roles exhaust stated audit criteria/scope |
| Workflow & stopping | Simple-task overthinking | base narrow-first escalation + deliver/debug smallest-sufficient path |
| Workflow & stopping | Reasoning loops from high effort | medium-first root/role defaults + explicit hard-tail escalation roles + bounded stop contracts |
| Workflow & stopping | Audit recursion | base instructions + stop/completion contract |
| Workflow & stopping | Failure-recovery blindness | base instructions + stop/completion contract |
| Workflow & stopping | Social-script substitution during execution-failure recovery | base Output contract requires an operational task-state update; hosted behavior remains observational until live evaluation |
| Workflow & stopping | Goal/context drift | native goal state + base instructions |
| Workflow & stopping | Goal pause/block conflation | Codex 0.151.0 goal contract: model tools synchronize/create and update complete/blocked; user/system controls own pause/resume/edit/clear; nested usage counts toward the root budget |
| Multi-agent & delegation | Subagent proliferation | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Duplicate multi-agent work | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Delegation or review ceremony exceeds task value | zero-child option + risk-driven review + bounded role routing |
| Multi-agent & delegation | Conflicting parallel edits | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Subagent authority overtrust | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Coordination overhead exceeds value | base instructions + PreToolUse spawn gate + child-role agent disablement |
| Multi-agent & delegation | Unstructured model/session handoff | no-history fork + explicit objective/scope/oracle/stop handoff contract |
| Multi-agent & delegation | Child result lost across resume/compaction | bounded child terminal handoffs persisted in continuity state + compact execution checkpoint |
| Multi-agent & delegation | Duplicate broad repository reconnaissance across workers | optional `forge-repo-intelligence` preflight returns bounded structural/impact evidence to root before implementation |
| Multi-agent & delegation | V2 spawn hides model overrides and rejects the natural override call | pinned complete `model_catalog_json` restamps Forge slugs to V1; leave `features.multi_agent_v2` unset; registered V1 roles + `fork_context=false` |
| Multi-agent & delegation | Integrated V1 agent left open | developer collect-integrate-close contract + V1 `close_agent`; completed agents otherwise retain concurrency slots |
| Multi-agent & delegation | Weak-model blind audit | acceptance-surface routing: Luna requires an explicit contract, local blast radius, decisive oracle, and cheap rollback; consequential, ambiguous, cross-system, or intent-reconstructing work remains with Sol roles |
| Skills, instructions & context | Applicable guidance ignored | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Ceremonial instruction reading | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Instruction decay | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Skill-routing failure | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Skill overlap or overcapture | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Skill without execution/stopping contract | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Instruction-file sprawl | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Context-file overload | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Prompt patch stacking | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | User rhetoric/repetition inflates the execution prompt | base `!RAW` grammar + lean internal task-contract normalization preserving requirements and decisions |
| Skills, instructions & context | One observed failure widened into a universal prompt rule | record in observational-evidence; map here; keep the smallest Goal-slot wording; see model-instruction audit |
| Memory, context & state | Stale or contaminated context | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Memory accumulation | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Context churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Recursive hallucination cascade | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Cross-thread continuity assumption | standard summary-backed compaction + compact handoff + base continuity rule; token-budget reset disabled by default; no implied memory from prior thread/model |
| Memory, context & state | Repository graph reasoning against stale edits | CodeGraph sync before the next graph-dependent query when edits may have stale state + current-source verification |
| Memory, context & state | Remote catalog context-cap mismatch | complete pinned `model_catalog_json` for Forge-owned model behavior; local context overrides cannot claim to exceed a remote ceiling, so effective `/status` remains the runtime oracle |
| Memory, context & state | Stale conclusion defense | evidence-conflict re-evaluation rule; newer verified evidence invalidates old hypothesis |
| Upgrade lifecycle | Loaded session executes hooks from a replaced versioned plugin root | require all Codex sessions and the app server closed before plugin mutation/restamp; retain stale cache conservatively because installer lacks reliable cross-process liveness/lease evidence; cache retention is `UNVERIFIED` |
| Security & privilege boundaries | Indirect prompt-injection obedience | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Security & privilege boundaries | Privilege propagation from untrusted content | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Security & privilege boundaries | Authorization bypass through tooling | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Security & privilege boundaries | Unsafe composite action | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Communication & reporting | False completion | base communication/final contract |
| Communication & reporting | Inaccurate self-reporting | base communication/final contract |
| Communication & reporting | Evidence-free confidence | base communication/final contract |
| Communication & reporting | Persona/advisory framing | base communication/final contract |
| Communication & reporting | Conversational and validation padding | base communication/final contract |
| Communication & reporting | Meta/process narration | base communication/final contract |
| Communication & reporting | Rhetorical formatting clutter | base communication/final contract |
| Communication & reporting | Redundant restatement | base communication/final contract |
| Communication & reporting | Final-report inflation | base communication/final contract |
| Communication & reporting | Opaque invented jargon | concrete mechanism-language rule + reviewer return contract |
| Research & evaluation | Model folklore | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Research & evaluation | Benchmark mismatch | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Research & evaluation | Single-score blindness | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Research & evaluation | Cost/latency blindness | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Research & evaluation | One-run confidence | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Performance & operational efficiency | Tool-call maximalism | bounded Code Mode batching + applicable forge-* skill; don't widen scope to fill a batch |
| Performance & operational efficiency | Repeated context round-trip amplification | bounded batching, first-pass convergence, focused validation, bounded child handoffs |
| Performance & operational efficiency | Recursive file crawling and repeated flat-search chains | indexed-repo CodeGraph-first structural retrieval + relevance-before-read rule + bounded literal/path search fallback |
| Code & contract correctness | Speculative compatibility preservation | user/support-contract compatibility authority in base instructions; unresolved shim/version/migration choices return to the user |
| Performance & operational efficiency | Search/read churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Performance & operational efficiency | Overbroad repository operations | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Performance & operational efficiency | Instruction/workflow accretion | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Performance & operational efficiency | Subscription quota spikes | model/effort routing: Luna/Terra for routine work, medium-first defaults, Sol and xhigh only for justified hard tails |
