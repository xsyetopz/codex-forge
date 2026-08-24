# Failure controls

This is an implementation cross-reference, not a validator schema. Each source failure is mapped to the lowest Forge layer that can materially address it. Prompt-only items aren't represented as hard runtime guarantees.

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
| Architecture & abstraction | Premature abstraction | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Familiar-pattern architecture | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Source-of-truth hallucination | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Spec/schema reflex | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Artifact proliferation | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Current-state/goal conflation | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Responsibility collapse | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Public-surface inflation | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Fallback/retry reflex | base architecture rules + forge-deliver/refactor/review |
| Architecture & abstraction | Cache/state persistence invention | base architecture rules + forge-deliver/refactor/review |
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
| Tool use & execution | Tool failure masking | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Cascading execution after broken invariant | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Wrong-tool or wrong-protocol assumption | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Reasoning leakage into machine arguments | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Unbounded tool loop | base tool policy + forge.rules/PreToolUse where enforceable |
| Tool use & execution | Serializable independent-call churn | concrete Code Mode bounded batching rule; dependencies/adaptive work remain sequential |
| Tool use & execution | Poll/heartbeat churn | base no-cache-heartbeat/no-progress-polling rule + orchestrator wait contract |
| Code & contract correctness | Interface-shape mismatch | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | One-sided contract edit | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Partial implementation presented as complete | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Silent code loss | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Generated-source confusion | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Wrapper-source confusion | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Defensive-validation inflation | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Error swallowing | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Code & contract correctness | Comment/log/TODO used as a fix | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Verification & testing | Green-test completion fallacy | forge-review + claim-relevant verification contract |
| Verification & testing | Checker overfitting | forge-review + claim-relevant verification contract |
| Verification & testing | Runtime-proof substitution | forge-review + claim-relevant verification contract |
| Verification & testing | Test-as-spec absolutism | forge-review + claim-relevant verification contract |
| Verification & testing | Visible-test overfitting | forge-review + claim-relevant verification contract |
| Verification & testing | Verification-scope inflation | forge-review + claim-relevant verification contract |
| Verification & testing | Verification-scope underreach | forge-review + claim-relevant verification contract |
| Verification & testing | Verification churn | forge-review + focused validation-batch contract |
| Verification & testing | Flaky-success laundering | forge-review + claim-relevant verification contract |
| Verification & testing | Snapshot/golden acceptance reflex | forge-review + claim-relevant verification contract |
| Verification & testing | Mocking away the behavior | forge-review + claim-relevant verification contract |
| Verification & testing | Reproducibility leakage | forge-review + claim-relevant verification contract |
| Repository hygiene & change discipline | Opportunistic cleanup | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Mass rewrite/search-replace overreach | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Dependency/lockfile churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Generated/build artifact contamination | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Repository hygiene & change discipline | Filesystem metadata churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Workflow & stopping | Analysis paralysis | base instructions + stop/completion contract |
| Workflow & stopping | Activity-as-progress | base instructions + stop/completion contract |
| Workflow & stopping | Premature hand-back | base instructions + stop/completion contract |
| Workflow & stopping | Blocker invention | base instructions + stop/completion contract |
| Workflow & stopping | Root-cause avoidance | forge-debug/deliver root-cause repair + stop/completion contract |
| Workflow & stopping | First-finding premature audit stop | forge-debug/review require exhausting stated audit criteria/scope |
| Workflow & stopping | Simple-task overthinking | base narrow-first escalation + deliver/debug smallest-sufficient path |
| Workflow & stopping | Audit recursion | base instructions + stop/completion contract |
| Workflow & stopping | Failure-recovery blindness | base instructions + stop/completion contract |
| Workflow & stopping | Goal/context drift | native goal state + base instructions |
| Multi-agent & delegation | Subagent proliferation | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Duplicate multi-agent work | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Conflicting parallel edits | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Subagent authority overtrust | base instructions + PreToolUse spawn gate + max_depth |
| Multi-agent & delegation | Coordination overhead exceeds value | base instructions + PreToolUse spawn gate + child-role agent disablement |
| Multi-agent & delegation | Unstructured model/session handoff | no-history fork + explicit objective/scope/oracle/stop handoff contract |
| Multi-agent & delegation | Weak-model blind audit | consequential/ambiguous audit remains Sol; Luna requires bounded criteria/oracle |
| Skills, instructions & context | Applicable guidance ignored | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Ceremonial instruction reading | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Instruction decay | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Skill-routing failure | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Skill overlap or overcapture | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Skill without execution/stopping contract | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Instruction-file sprawl | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Context-file overload | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Skills, instructions & context | Prompt patch stacking | distinct forge-* triggers/execution/stop contracts; lean always-on prompt |
| Memory, context & state | Stale or contaminated context | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Memory accumulation | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Context churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Recursive hallucination cascade | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Memory, context & state | Cross-thread continuity assumption | base continuity rule + compact/handoff state; no implied memory from prior thread/model |
| Memory, context & state | Stale conclusion defense | evidence-conflict re-evaluation rule; newer verified evidence invalidates old hypothesis |
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
| Performance & operational efficiency | Tool-call maximalism | bounded Code Mode batching + applicable forge-* skill; do not widen scope to fill a batch |
| Performance & operational efficiency | Repeated context round-trip amplification | bounded batching, first-pass convergence, focused validation, bounded child handoffs |
| Performance & operational efficiency | Search/read churn | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Performance & operational efficiency | Overbroad repository operations | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
| Performance & operational efficiency | Instruction/workflow accretion | base instructions + applicable forge-* skill; hard enforcement only at enforcing layer |
