# Codex hook gotchas

- Codex sends one JSON object on standard input. Read `hook_event_name`, `tool_name`, and `tool_input` from that payload.
- Plugin hook commands run from the session working directory. Resolve bundled scripts with `PLUGIN_ROOT`.
- Matcher groups and handlers that match the same event run concurrently. Design each handler to remain correct when its peers have already started.
- `PreToolUse` matches shell calls as `Bash`; `spawn_agent` also matches `Agent`. Treat hooks as a guardrail because specialized tool paths may use another path.
- Keep model-visible context short and set `additionalContextLimit` when a tighter cap is useful.
- Plugin hooks become active after review and trust of the current hook-definition hash.
- Synchronous hooks own blocking and rewriting. Background hooks deliver supported informational output at a later safe point.
