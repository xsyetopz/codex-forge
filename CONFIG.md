# Configuration

Forge modifies the normal root `$CODEX_HOME/config.toml` and a marked CodeGraph section in `$CODEX_HOME/AGENTS.md`; it creates no named profile or wrapper command. The generated Forge AGENTS section is at most 20 lines and uninstall removes only that marked section when unrelated content changed.

The managed settings are intentionally limited to fields whose behavior Forge depends on. Stable feature defaults already matching the desired state aren't repeated.

| Setting | Forge value | Purpose |
| --- | --- | --- |
| model | gpt-5.6-sol | root judgment/orchestration |
| model_reasoning_effort | medium | general root cost/quality point |
| plan_mode_reasoning_effort | high | extra budget only when explicit planning mode needs it |
| model_reasoning_summary | none | remove reasoning-summary output overhead |
| model_verbosity | low | reduce response/output tokens |
| service_tier | flex | lowest-priority/low-cost service tier when supported |
| model_instructions_file | Forge asset | replace stock base behavior instead of cancelling it later |
| experimental_compact_prompt_file | Forge asset | preserve exact task/goal/verification state across compaction |
| include_collaboration_mode_instructions | false | avoid stock collaboration-mode behavior duplicating Forge policy |
| approval_policy | never | no routine shell approval prompts; sandbox escapes fail instead of starting approval work |
| approvals_reviewer | user | app/external approvals, when surfaced, remain user decisions rather than hidden reviewer calls |
| sandbox_mode | workspace-write | normal local-edit boundary |
| sandbox_workspace_write.network_access | true | avoid repeated network escalation for read/package workflows |
| agents.max_concurrent_threads_per_session | 3 | hard concurrency ceiling; policy still defaults to one child |
| agents.max_depth | 1 | V1 recursion cap; child role files also set `agents.enabled=false` and prohibit spawning |
| apps._default.destructive_enabled | false | disable destructive native app tools |
| apps._default.open_world_enabled | false | disable native app tools that can act in an open external world |

Feature changes from the supplied 0.149.0 defaults:

```toml
[features]
fast_mode = false
personality = false
prevent_idle_sleep = true
local_thread_store_compression = true
apply_patch_preserve_line_endings = true
cwd_relative_turn_diffs = true
unified_image_budget = true

[features.token_budget]
enabled = true
```

`token_budget` is enabled using its built-in defaults; it exposes context-window/compaction budget guidance and doesn't impose a guessed per-task spend limit. Persisted `/goal` token budgets are created only when explicitly requested. A `rollout_budget` example is shipped disabled because a hard numeric limit must come from an explicit budget or measured workload, not a guessed constant.

Codex 0.149.0 also exposes `tool_output_token_limit`, but Forge intentionally doesn't force a universal value. A low global cap can hide decisive evidence through truncation, while a high cap can retain excessive output. Forge instead bounds command/query output at source and keeps validation/retrieval scoped. Set the runtime limit only from measured workload needs.

Forge doesn't configure cache keepalive/heartbeat behavior. Prompt-cache lifetime and subscription accounting are runtime/provider properties, and the supplied observations include both large cache-cost effects and instability/TTL differences. The durable mitigation in Forge is fewer outer cycles, bounded outputs, short responsibility-specific handoffs, and no polling done solely for cache retention.

Memories, Chronicle, Guardian v2, deferred executor/world-state, artifact tools, terminal visualization instructions, executed-tool metadata and runtime metrics remain off by default. Optional fragments exist only where a concrete opt-in use is plausible.
