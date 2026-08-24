#!/usr/bin/env python3
from __future__ import annotations

import json
import shlex
import sys
from pathlib import Path

FORGE_ROLES = {
    "forge-architect",
    "forge-debugger",
    "forge-direct",
    "forge-hard-worker",
    "forge-retriever",
    "forge-reviewer",
    "forge-scout",
    "forge-tail-reviewer",
    "forge-worker",
}


def known_forge_identity(value) -> bool:
    if not isinstance(value, str):
        return False
    identity = value.strip().lower()
    return any(
        identity == role or identity.startswith((f"{role}:", f"{role}/"))
        for role in FORGE_ROLES
    )


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
        # Omitted fork_turns uses the runtime's full-context default. Require an
        # explicit no-context value rather than guessing that omission is safe.
        if fork_context is True or fork_turns not in ("none", 0, "0"):
            emit(event, deny="Set fork_turns=none for a no-parent-context subagent.")
            return
        # Caller identity is runtime-provided and unverified. This check is only
        # defense in depth; the registered role and runtime max-depth controls
        # remain the authoritative boundaries.
        caller_values = [
            payload.get("agent_type"),
            payload.get("agent_id"),
            payload.get("parent_agent_type"),
            payload.get("parent_agent_id"),
            inp.get("parent_agent_type"),
            inp.get("parent_agent_id"),
        ]
        if any(known_forge_identity(value) for value in caller_values):
            emit(
                event,
                deny=(
                    "Forge child agents cannot spawn children "
                    "(runtime caller identity is unverified; defense-in-depth)."
                ),
            )
            return
        if role not in FORGE_ROLES:
            emit(event, deny="Select a registered Forge agent_type for the child.")
            return

    command = command_text(inp)
    if command:
        hint = advisory(command)
        if hint:
            emit(event, context=hint)


if __name__ == "__main__":
    main()
