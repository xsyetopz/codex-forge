#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

from codegraph import resolve_command

DANGEROUS_PREFIXES = [
    ("rm",),
    ("rmdir",),
    ("unlink",),
    ("shred",),
    ("truncate",),
    ("dd",),
    ("mkfs",),
    ("wipefs",),
    ("fdisk",),
    ("parted",),
    ("sudo",),
    ("doas",),
    ("git", "clean"),
    ("git", "reset", "--hard"),
    ("git", "branch", "-D"),
    ("git", "rebase"),
    ("git", "filter-branch"),
    ("git", "filter-repo"),
    ("git", "reflog", "expire"),
    ("git", "push"),
    ("gh", "pr", "create"),
    ("gh", "pr", "comment"),
    ("gh", "pr", "review"),
    ("gh", "pr", "merge"),
    ("gh", "issue", "create"),
    ("gh", "issue", "comment"),
    ("gh", "release", "create"),
    ("npm", "publish"),
    ("pnpm", "publish"),
    ("twine", "upload"),
    ("cargo", "publish"),
    ("docker", "push"),
    ("kubectl", "apply"),
    ("kubectl", "create"),
    ("kubectl", "delete"),
    ("kubectl", "patch"),
    ("kubectl", "edit"),
    ("helm", "install"),
    ("helm", "upgrade"),
    ("helm", "uninstall"),
    ("terraform", "apply"),
    ("terraform", "destroy"),
    ("tofu", "apply"),
    ("tofu", "destroy"),
    ("ssh",),
    ("scp",),
    ("sftp",),
    ("rsync",),
]
RELATION_TERMS = re.compile(
    r"\b(callers?|callees?|call\s+chain|call\s+graph|blast\s+radius|impact\s+analysis|inherit(?:s|ance)?|dependency\s+(?:graph|impact)|cross[- ]module|execution\s+flow|data\s+flow|architecture\s+relationship|who\s+calls|what\s+calls|multi[- ]file\s+root\s+cause)\b",
    re.IGNORECASE,
)


def emit(event, *, deny=None, context=None):
    out = {"hookSpecificOutput": {"hookEventName": event}}
    h = out["hookSpecificOutput"]
    if deny:
        h["permissionDecision"] = "deny"
        h["permissionDecisionReason"] = "[cf] " + deny
    if context:
        h["additionalContext"] = context
    print(json.dumps(out))


def command_text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list) and all(isinstance(x, str) for x in value):
        return shlex.join(value)
    if isinstance(value, dict):
        for k in ("command", "cmd", "script"):
            if k in value:
                return command_text(value[k])
    return ""


def segments(cmd):
    # Conservative tokenization; rules remain a second independent layer.
    for part in re.split(r"\s*(?:&&|\|\||;|\n)\s*", cmd):
        try:
            t = shlex.split(part)
        except ValueError:
            t = part.split()
        if t:
            yield tuple(t)


def starts(tokens, prefix):
    return len(tokens) >= len(prefix) and tuple(tokens[: len(prefix)]) == prefix


def shell_violation(cmd):
    for t in segments(cmd):
        # Strip common env wrapper.
        while t and "=" in t[0] and not t[0].startswith(("/", "./")):
            t = t[1:]
        if not t:
            continue
        base = Path(t[0]).name
        t = (base,) + t[1:]
        for p in DANGEROUS_PREFIXES:
            if starts(t, p):
                return f"blocked command: {' '.join(p)}"
        if starts(t, ("git", "commit")) and "--amend" in t:
            return "Git amend/history rewrite is disabled"
        if starts(t, ("git", "push")):
            return "remote Git writes are disabled"
        if starts(t, ("curl",)):
            ups = {x.upper() for x in t}
            if any(x in ups for x in ("-X", "--REQUEST")) and any(
                m in ups for m in ("POST", "PUT", "PATCH", "DELETE")
            ):
                return "state-changing HTTP requests are disabled"
            if any(
                x in t
                for x in (
                    "-d",
                    "--data",
                    "--data-raw",
                    "--data-binary",
                    "-F",
                    "--form",
                    "-T",
                    "--upload-file",
                )
            ):
                return "state-changing HTTP uploads/requests are disabled"
        if starts(t, ("grep", "-R")) and shutil.which("rg"):
            return "use bounded `rg` instead of `grep -R`"
        if starts(t, ("ls", "-R")):
            return "recursive directory dumps are disabled; use `fd`/`rg --files`"
        if starts(t, ("find", ".")) and shutil.which("fd"):
            return "use bounded `fd` instead of an unbounded `find .`"
        if starts(t, ("git", "log")) and not any(
            x == "-n" or x.startswith("--max-count") or re.fullmatch(r"-\d+", x)
            for x in t
        ):
            return "bound `git log` with `-n N`/`--max-count=N`"
        if starts(t, ("git", "status")) and not any(
            x in t
            for x in (
                "--short",
                "-s",
                "--porcelain",
                "--porcelain=v1",
                "--porcelain=v2",
            )
        ):
            return "use bounded `git status --short --branch`"
    return None


def ensure_codegraph(plugin_root):
    if resolve_command():
        return True
    try:
        p = subprocess.run(
            [
                sys.executable,
                str(Path(plugin_root) / "scripts" / "tools.py"),
                "install",
                "codegraph",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=300,
            check=False,
        )
        return p.returncode == 0 and resolve_command() is not None
    except (OSError, subprocess.TimeoutExpired):
        return False


def main():
    event = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        payload = {}
    if event == "SessionStart":
        emit(
            event,
            context="[cf] Codex Forge active. Use forge-* skills only when their task shape applies; keep ordinary work in root unless delegation has independent value.",
        )
        return
    if event == "SubagentStart":
        emit(
            event,
            context="[cf] Child scope: do not spawn agents; stay within the assigned objective/ownership; return concise evidence to the parent.",
        )
        return
    if event == "UserPromptSubmit":
        prompt = str(payload.get("prompt") or "")
        if RELATION_TERMS.search(prompt):
            root = os.environ.get(
                "PLUGIN_ROOT", str(Path(__file__).resolve().parents[1])
            )
            ok = ensure_codegraph(root)
            msg = "[cf] Relationship-heavy repository task: use the CodeGraph CLI first (`codegraph status . --json`, then `codegraph sync .` and a bounded `codegraph explore --path . ...`, `node`, `callers`, `callees`, `impact`, or `affected` query). Use the CodeGraph MCP tools only if CLI execution is unavailable or fails; verify decisive edges in source."
            if not ok:
                msg = "[cf] CodeGraph CLI is unavailable. Use an already-configured CodeGraph MCP server only as the last-resort graph fallback; otherwise use bounded ast-grep/rg and report the missing CodeGraph capability."
            emit(event, context=msg)
        return
    if event == "PreToolUse":
        tool = str(payload.get("tool_name") or payload.get("tool") or "")
        inp = payload.get("tool_input") or payload.get("input") or {}
        low = tool.lower()
        if "spawn_agent" in low and isinstance(inp, dict):
            ft = inp.get("fork_turns")
            fc = inp.get("fork_context")
            role = inp.get("agent_type")
            model = inp.get("model")
            if fc is True or (ft not in (None, "none", 0, "0")):
                emit(
                    event,
                    deny="subagents must not inherit parent conversation history; use fork_turns=none/fork_context=false",
                )
                return
            if not role and not model:
                emit(
                    event,
                    deny="generic inherited-model spawning is disabled; select a Forge role or explicit cheaper model/effort",
                )
                return
            if model and model not in {"gpt-5.6-luna", "gpt-5.6-terra"}:
                emit(
                    event,
                    deny="child model override must use the bounded Luna/Terra worker routes; keep Sol judgment in the root",
                )
                return
        cmd = command_text(inp)
        if cmd:
            reason = shell_violation(cmd)
            if reason:
                emit(event, deny=reason)
                return
        # Block delete-file patches independently of shell rules.
        if "apply_patch" in low or "patch" == low:
            raw = json.dumps(inp) if not isinstance(inp, str) else inp
            if "*** Delete File:" in raw:
                emit(event, deny="file deletion through patch is disabled")
                return
        return


if __name__ == "__main__":
    main()
