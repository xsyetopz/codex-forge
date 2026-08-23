#!/usr/bin/env python3
from __future__ import annotations

import json
import shlex
import sys
from pathlib import Path


def emit(event: str, *, deny: str | None = None, context: str | None = None) -> None:
    out = {"hookSpecificOutput": {"hookEventName": event}}
    hook = out["hookSpecificOutput"]
    if deny:
        hook["permissionDecision"] = "deny"
        hook["permissionDecisionReason"] = deny
    if context:
        hook["additionalContext"] = context
    print(json.dumps(out))


def command_text(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list) and all(isinstance(x, str) for x in value):
        return shlex.join(value)
    if isinstance(value, dict):
        for key in ("command", "cmd", "script"):
            if key in value:
                return command_text(value[key])
    return ""


def advisory(command: str) -> str | None:
    try:
        tokens = shlex.split(command)
    except ValueError:
        tokens = command.split()
    if not tokens:
        return None
    base = Path(tokens[0]).name
    if base == "grep" and "-R" in tokens:
        return "Use bounded `rg`; use `codegraph_explore` for structural queries."
    if base == "ls" and "-R" in tokens:
        return "Use `rg --files`/`fd`; use `codegraph_explore` for structural queries."
    if base == "find" and len(tokens) > 1 and tokens[1] == ".":
        return "Bound the search or use `fd`; use `codegraph_explore` for structural queries."
    if base in {"cat", "sed", "head", "tail"} and any(
        str(token).endswith("SKILL.md") for token in tokens[1:]
    ):
        return (
            "Use native skill loading; don't shell-read `SKILL.md` to activate a skill."
        )
    return None


def main() -> None:
    event = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        payload = {}

    if event == "SessionStart":
        emit(
            event,
            context="Code discovery: prefer `codegraph_explore` over grep/file-read for structural queries; use `rg`/read for literals.",
        )
        return

    if event == "SubagentStart":
        emit(
            event, context="Child: don't spawn agents; stay in scope; return evidence."
        )
        return

    if event != "PreToolUse":
        return

    tool = str(payload.get("tool_name") or payload.get("tool") or "").lower()
    inp = payload.get("tool_input") or payload.get("input") or {}

    if "spawn_agent" in tool and isinstance(inp, dict):
        fork_turns = inp.get("fork_turns")
        fork_context = inp.get("fork_context")
        role = inp.get("agent_type")
        model = inp.get("model")
        if fork_context is True or fork_turns not in (None, "none", 0, "0"):
            emit(event, deny="Use no parent-context fork for subagents.")
            return
        if not role and not model:
            emit(event, deny="Select a Forge role or explicit cheaper child model.")
            return

    command = command_text(inp)
    if command:
        hint = advisory(command)
        if hint:
            emit(event, context=hint)


if __name__ == "__main__":
    main()
