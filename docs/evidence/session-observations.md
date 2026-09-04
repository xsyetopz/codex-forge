# Local Codex session observations

This evidence is derived from local `~/.codex` session metadata and rollout
JSONL. Raw prompts, credentials, authentication state, and full transcripts are
not copied into the repository.

## Snapshot (2026-08-31)

- 53 rollout JSONL files were present under `~/.codex/sessions`.
- `session_index.jsonl` contained 14 entries.
- `history.jsonl` contained 21 entries.
- A bounded scan of event/response text found the incident vocabulary
  `repair_worker`, `awaiting_recheck`, blocked Stop/PreToolUse hooks, and native
  close/spawn agent calls.
- The session containing the explicit “kill that agent” instruction recorded
  repeated `repair_worker` feedback after that instruction.

These counts describe a mutable local snapshot and include repeated event
renderings; they are not usage metrics.

## Finding: workflow state overrode new user intent

The incident sequence was:

1. a reviewer reported a failure and Forge persisted a repair phase;
2. the user explicitly terminated agent work;
3. a broad PreToolUse hook required another reviewer/worker action;
4. Stop hooks continued to request repair work, preventing clean turn
   completion.

Root causes confirmed in the then-current Forge code:

- mandatory lifecycle state could authorize follow-up work;
- the spawn-boundary hook also matched `send_input`, `wait_agent`, and
  `close_agent`, then applied spawn-only validation to those calls;
- Stop/SubagentStop were treated as passive lifecycle notifications even though
  Codex 0.152.0 gives them continuation control.

The repair removes the workflow state, narrows PreToolUse to spawn only, removes
the Stop hook, and leaves native cancellation/control tools unobstructed.

## Evidence policy

One session can justify a regression test for the observed failure. It cannot
justify a universal rule about every agent workflow or model. New prompt policy
requires either repeated observations or an independently established contract;
deterministic runtime failures should be fixed at the owning code boundary.

## Finding: alpha.5 removed the continuation loop but retained costly fan-out

On September 3, 2026, local rollout analysis separated sessions created before
and after the alpha.5 install boundary. Alpha.5 removed the blocking
SubagentStop continuation hook, so the earlier identical-prompt loop was not
present in newer sessions. Usage nevertheless remained extreme because long
Goal threads repeatedly selected children and Sol reviewers.

Observed post-alpha.5 totals across eight root threads:

- 264 child threads;
- 10,260 child model requests;
- approximately 798.8 million child tokens;
- 83 Sol reviewer sessions;
- approximately 5,723.85 subscription-credit equivalents under the local
  estimator, of which Sol reviewers represented approximately 3,466.

One Goal root accounted for 144 children, 59 Sol reviewers, 4,575 child model
requests, approximately 306 million child tokens, 13 compactions, 1,941 exec
calls, 396 waits, and seven Goal continuations. Two other active roots accounted
for 51 and 22 children. These are local accounting observations rather than an
OpenAI billing statement, but child counts and routing are direct rollout
facts.

The causal conclusion is narrower than “Goals consume the quota.” Goals made
the long-running topology durable; child fan-out, repeated reviews, expensive
Sol routing, and accumulated context performed the billable model work. The
Forge controls therefore preserve Goal mode while reducing the work it can
amplify: two concurrent children, six admissions per thread, one routine
reviewer, one hard-tail reviewer, one repair cycle, Terra for routine
debugging/review, and a fresh thread for each Goal milestone.

The first replacement Goal in this investigation used an explicit 250,000-token
budget. It reached `budget_limited` after 252,715 accounted tokens and stopped
automatic continuation, directly verifying the safety boundary. The user then
cleared it and explicitly requested a 2,000,000-token budget for completion.

## Finding: social repair displaced operational recovery

On September 1, 2026, a coding-agent session was corrected after invoking
PCSX2 with an unverified `--help` argument and causing a user-visible dialog.
The response shifted into a human social-repair script: it opened with
agreement, described personal fault, promised future restraint, asserted that
the process was no longer running, and directed the user to dismiss the dialog.

The observed failure has two separate parts:

1. the earlier invocation inverted the user's stated check-before-use order;
2. the recovery response prioritized apology, reassurance, and personal reform
   over evidence-bounded operational state.

This is one coding-agent observation. Studies of apology preferences among
general chatbot users in staged conversational-error scenarios do not establish
preferences, trust outcomes, or operational effectiveness for coding-agent
operators managing real tool side effects. They can describe apology as a
social interface, but they are not an acceptance oracle for Forge.

The narrow owner is the base Output contract. It now requires execution-failure
reporting as an operational task-state update covering observed state,
material impact, containment evidence, remaining unknowns, and the smallest
required user action. The existing
Goal contract continues to own the preceding check-before-use order inversion.
Live-model behavior remains `UNVERIFIED` until an isolated runtime evaluation
observes the recovery response.

## Finding: missing access became user-owned verification

On September 2, 2026, a coding-agent session inspected a failed GitHub Actions
job and identified an Azure login configuration failure. The agent reported
that its environment lacked authenticated Azure access, then transferred the
Azure-side verification to the user by requesting portal screenshots. After
the user stated that they did not know where to obtain them, the agent supplied
portal navigation steps and retained the same user-owned verification design.

The relevant boundary is narrower than general clarification behavior. Azure
authentication required user identity, while inspection of the app
registration, federated credentials, comparison, and correction remained agent
work once that identity boundary was crossed. The smallest enabling action was
an Azure authentication step that returned the investigation to the agent;
screenshots transferred the investigation itself.

This repeated handback establishes a capability-boundary ownership failure.
The base Success contract now keeps diagnosis, verification, and completion
with the agent, requires available evidence to be exhausted first, and limits
the user request to the smallest enabling action. The user may explicitly
choose a manual investigation or verification boundary. Live-model behavior
remains `UNVERIFIED` until the isolated runtime case observes this distinction.

The same September 2, 2026 transcript repeated the correction preamble
“You’re right” before either establishing the user's claim as fact or
presenting task state. The problem is independent of whether the user's claim
was ultimately true: the phrase performs emotional agreement while skipping
evidence classification. The base Goal contract now classifies user statements
and reserves agreement or disagreement for evidence-based conclusions. The
Output contract assigns zero budget to pleasantries and emotional validation,
so a correction begins with the corrected fact, evidence state, next action, or
blocker.

## Finding: implementation scope expanded into visual-asset generation

On September 2, 2026, the user reported a repeated coding-agent behavior in
which ordinary implementation or polish work caused the agent to create SVG
icons, textures, images, or other visual assets without an explicit asset
request. The file creation could occur during tool execution before the user
was aware that the agent had selected a generative visual direction.

The authorization boundary is asset-level rather than tool-level. A request for
a UI, feature, implementation, or visual polish does not itself select custom
asset generation. Existing repository assets and established libraries may
remain part of normal implementation scope; creation of a new image, SVG, icon,
texture, illustration, logo, or equivalent visual asset requires an explicit
user request for that asset.

The narrow owner is the base Constraints contract. Current PreToolUse payloads
cannot reliably infer the originating user authorization for both image tools
and SVG content created through general file-edit tools, so a broad hook would
produce false positives and false confidence. Static contract coverage and an
isolated runtime case guard the shipped prompt while hosted behavior remains
`UNVERIFIED`.

## Finding: handoffs and ambiguity were able to displace Goal ownership

On September 4, 2026, the user identified a remaining orchestration risk after
the alpha.5 fan-out repair: child findings, vague prompts, and incomplete
specifications could still be converted into stalled work or a blocked Goal.
The requested operating model was a strict enterprise engineering contract,
where ordinary ambiguity is resolved from repository evidence and durable
compatibility commitments rather than handed back as workflow ceremony.

The narrow owners are now split by enforceability. Base instructions normalize
every request, preserve one acceptance-bearing workstream, resolve ordinary
ambiguity, and treat age alone as zero migration authority. Root developer
instructions reserve Goal state and integration for the root. A PreToolUse hook
denies `create_goal` and `update_goal` from Forge children, making their handoffs
evidence and recommendations rather than lifecycle control.

The same change removes the `!RAW` compatibility surface. Its replacement is
universal engineering-contract normalization, so prompt handling has one live
path. The submit hook, prompt-contract library, raw-task writes, reads, and
continuity reinjection are removed. Cleanup retains deletion-only handling for
legacy `.raw.txt` runtime artifacts until their TTL or session teardown.

New community captures reinforce bounded rather than maximal orchestration:
one task source of truth, disjoint parallel write scopes, concise handoffs,
proportional regression tests, and selective model escalation. They also report
lost temporal position after compaction and repeated high-context waits. Forge
responds with root-owned Goal state, compacted completed/current/next context,
one long child wait, and no new workflow state machine. Hosted model behavior
remains `UNVERIFIED` pending an isolated runtime evaluation.
