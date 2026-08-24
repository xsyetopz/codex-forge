#!/usr/bin/env python3
"""Deterministic PreToolUse backstop for catastrophic shell commands.

This hook is intentionally narrower than Forge's approval rules.  Focused edits and
ordinary build commands remain available for prompt/HITL decisions; this process only
denies commands for which an approval prompt is not a useful safety boundary.

The parser is deliberately bounded: it recognizes known shell wrappers, operators,
and command forms but does not analyze arbitrary interpreter source or try to execute
shell expansions.
"""

from __future__ import annotations

import codecs
import json
import posixpath
import re
import shlex
import sys
from pathlib import Path

SHELL_TOOL_NAMES = {
    "bash",
    "cmd",
    "exec",
    "exec_command",
    "local_shell",
    "powershell",
    "shell",
    "shell_command",
    "sh",
    "terminal",
    "zsh",
}
SHELL_BASENAMES = {"bash", "dash", "fish", "ksh", "sh", "zsh"}
SHELL_OPERATORS = {
    ";",
    ";;",
    ";&",
    ";;&",
    "&&",
    "||",
    "|",
    "|&",
    "&",
    "(",
    ")",
    "{",
    "}",
}
SHELL_CONTROL_PREFIXES = {
    "if",
    "for",
    "while",
    "until",
    "case",
    "select",
    "then",
    "do",
    "else",
    "elif",
    "fi",
    "done",
    "in",
    "esac",
}
COMMAND_FIELDS = ("command", "cmd", "script")
QUOTE_MARKER = "\x1e"


class ShellToken(str):
    """A shell token retaining whether any part came from quoting."""

    __slots__ = ("quoted",)

    def __new__(cls, value: str, *, quoted: bool = False):
        token = super().__new__(cls, value)
        token.quoted = quoted
        return token


def _is_quoted(token: str) -> bool:
    return bool(getattr(token, "quoted", False))


def _is_syntax_token(token: str, values: set[str] | frozenset[str]) -> bool:
    return not _is_quoted(token) and token in values


def emit(event: str, reason: str | None = None) -> None:
    output = {"hookSpecificOutput": {"hookEventName": event}}
    if reason:
        hook = output["hookSpecificOutput"]
        hook["permissionDecision"] = "deny"
        hook["permissionDecisionReason"] = f"block-dangerous-commands: {reason}"
    print(json.dumps(output))


def _command_value(value: object) -> str | None:
    """Return a shell command from the supported string/list/dict shapes."""
    if isinstance(value, str):
        return value
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return shlex.join(value)
    if isinstance(value, dict):
        for field in COMMAND_FIELDS:
            if field in value:
                command = _command_value(value[field])
                if command is not None:
                    return command
    return None


def command_text(payload: object) -> str | None:
    """Extract a command only from a supported shell-tool payload."""
    if not isinstance(payload, dict):
        return None
    tool = str(payload.get("tool_name") or payload.get("tool") or "").lower()
    if tool not in SHELL_TOOL_NAMES and not any(
        marker in tool for marker in ("shell", "exec_command", "terminal")
    ):
        return None
    value = payload.get("tool_input")
    if value is None:
        value = payload.get("input")
    if value is None:
        value = {field: payload[field] for field in COMMAND_FIELDS if field in payload}
    return _command_value(value)


def shell_tokens(command: str) -> list[str] | None:
    """Tokenize shell operators while preserving quoted command arguments.

    A malformed shell command is left to Codex's normal command handling instead of
    being guessed at by this safety backstop.
    """
    try:
        command = _normalize_ansi_c_quotes(command)
        normalized: list[str] = []
        quote: str | None = None
        escaped = False
        for index, character in enumerate(command):
            if escaped:
                normalized.append(character)
                escaped = False
                continue
            if character == "\\" and quote != "'":
                normalized.append(character)
                escaped = True
                continue
            if character in {"'", '"'}:
                if quote is None:
                    quote = character
                    normalized.append(QUOTE_MARKER)
                elif quote == character:
                    quote = None
                normalized.append(character)
                continue
            if character in {"\n", "\r"} and quote is None:
                previous = next(
                    (item for item in reversed(normalized) if not item.isspace()),
                    "",
                )
                following = next(
                    (item for item in command[index + 1 :] if not item.isspace()),
                    "",
                )
                normalized.append(
                    " "
                    if previous in {"|", "&", "\\"} or following in {"|", "&"}
                    else ";"
                )
                continue
            normalized.append(character)
        lexer = shlex.shlex("".join(normalized), posix=True, punctuation_chars=True)
        lexer.whitespace_split = True
        tokens = []
        for token in lexer:
            quoted = QUOTE_MARKER in token
            tokens.append(ShellToken(token.replace(QUOTE_MARKER, ""), quoted=quoted))
        return tokens
    except (TypeError, ValueError):
        return None


def _normalize_ansi_c_quotes(command: str) -> str:
    """Preserve bounded ``$'...'`` bodies as one shell token.

    ANSI-C quoting is an expansion form rather than a normal quote understood by
    ``shlex``. Decode its common escapes and re-quote the resulting body so
    wrapper handling can inspect it recursively. An unterminated body is left
    untouched and remains subject to normal malformed-input handling.
    """
    output: list[str] = []
    index = 0
    quote: str | None = None
    while index < len(command):
        character = command[index]
        if character == "\\" and quote != "'":
            output.append(command[index : index + 2])
            index += 2
            continue
        if character == '"' and quote is None:
            quote = '"'
            output.append(character)
            index += 1
            continue
        if character == '"' and quote == '"':
            quote = None
            output.append(character)
            index += 1
            continue
        if quote is None and command.startswith("$'", index):
            end = index + 2
            body: list[str] = []
            while end < len(command):
                item = command[end]
                if item == "\\" and end + 1 < len(command):
                    body.append(command[end : end + 2])
                    end += 2
                    continue
                if item == "'":
                    break
                body.append(item)
                end += 1
            if end >= len(command):
                output.append(command[index:])
                break
            raw = "".join(body)
            try:
                decoded = codecs.decode(raw, "unicode_escape")
            except (UnicodeDecodeError, UnicodeError):
                decoded = raw
            # Bash cannot carry NUL bytes in an argv word: ANSI-C NUL escapes
            # disappear during word construction (for example re$'\0'set is
            # the command name `reset`).
            decoded = decoded.replace("\x00", "")
            output.append(shlex.quote(decoded))
            index = end + 1
            continue
        output.append(character)
        index += 1
    return "".join(output)


def executable(token: str) -> str:
    return Path(token).name.lower()


def _broad_path(token: str) -> bool:
    value = token.strip()
    if not value:
        return False
    broad_roots = {
        "",
        ".",
        "..",
        "/",
        "$PWD",
        "${PWD}",
        "$HOME",
        "${HOME}",
        "~",
    }
    if value in {
        "$PWD",
        "${PWD}",
        "$PWD/",
        "${PWD}/",
        "$HOME",
        "${HOME}",
        "$HOME/",
        "${HOME}/",
        "~",
        "~/",
    }:
        return True
    try:
        normalized = posixpath.normpath(value)
    except (TypeError, ValueError):
        normalized = value
    if normalized in broad_roots:
        return True
    if value.startswith("/") and value.rstrip("/") == "":
        return True
    if not any(marker in value for marker in ("*", "?", "[")):
        return False
    # A wildcard under a stable directory is focused (and therefore promptable),
    # while a wildcard rooted at the current/parent/home/top-level path is broad.
    wildcard_index = min(
        (index for marker in ("*", "?", "[") if (index := value.find(marker)) >= 0),
        default=len(value),
    )
    wildcard_parent = value[:wildcard_index].rstrip("/")
    try:
        wildcard_parent = posixpath.normpath(wildcard_parent)
    except (TypeError, ValueError):
        pass
    return wildcard_parent in broad_roots


def _substitution_bodies(command: str) -> list[str]:
    """Extract executable backtick and ``$(...)`` bodies, not quoted literals."""
    bodies: list[str] = []
    index = 0
    quote: str | None = None
    while index < len(command):
        character = command[index]
        if character == "\\" and quote != "'":
            index += 2
            continue
        if character in {"'", '"'}:
            if quote is None:
                quote = character
            elif quote == character:
                quote = None
            index += 1
            continue
        if quote == "'":
            index += 1
            continue
        if character == "`":
            end = index + 1
            while end < len(command):
                if command[end] == "\\":
                    end += 2
                    continue
                if command[end] == "`":
                    bodies.append(command[index + 1 : end])
                    index = end + 1
                    break
                end += 1
            else:
                return bodies
            continue
        if command.startswith(("$(", "<(", ">("), index):
            depth = 1
            end = index + 2
            inner_quote: str | None = None
            while end < len(command) and depth:
                item = command[end]
                if item == "\\" and inner_quote != "'":
                    end += 2
                    continue
                if item in {"'", '"'}:
                    if inner_quote is None:
                        inner_quote = item
                    elif inner_quote == item:
                        inner_quote = None
                elif inner_quote is None:
                    if item == "(":
                        depth += 1
                    elif item == ")":
                        depth -= 1
                end += 1
            if depth == 0:
                bodies.append(command[index + 2 : end - 1])
                index = end
                continue
        index += 1
    return bodies


def segments(tokens: list[str]) -> list[list[str]]:
    result: list[list[str]] = []
    current: list[str] = []
    for token in tokens:
        if _is_syntax_token(token, SHELL_OPERATORS):
            if current:
                result.append(current)
                current = []
        else:
            current.append(token)
    if current:
        result.append(current)
    return result


def _is_shell(token: str) -> bool:
    value = token.strip().lower()
    return executable(value) in SHELL_BASENAMES or value in {"$shell", "${shell}"}


def _skip_option_value(segment: list[str], index: int, options: set[str]) -> int:
    token = segment[index]
    if token in options and index + 1 < len(segment):
        return index + 2
    if any(token.startswith(f"{option}=") for option in options):
        return index + 1
    return index + 1


def _actual_command_index(segment: list[str]) -> int:
    """Find the command after bounded, common launcher wrappers.

    This is deliberately not an interpreter: it only consumes documented wrapper
    options and never attempts to reason about arbitrary Python/Node/etc. source.
    """
    index = 0
    for _ in range(32):
        while index < len(segment):
            token = segment[index]
            if not _is_quoted(token) and (
                ("=" in token and not token.startswith("=")) or token == "--env"
            ):
                index += 1
                continue
            break
        if index >= len(segment):
            return index
        base = executable(segment[index])
        if _is_syntax_token(segment[index], {"!"}):
            index += 1
            continue
        if _is_syntax_token(segment[index], SHELL_CONTROL_PREFIXES):
            # Control keywords are syntax, not commands. Strip the prefix so a
            # command used as an `if`/`while` condition is still inspected.
            index += 1
            continue
        if base == "command":
            index += 1
            query = False
            while index < len(segment):
                option = segment[index]
                if option == "--":
                    index += 1
                    break
                if not option.startswith("-"):
                    break
                # `command -v/-V` only queries command resolution and never
                # executes the named command.  Combined forms such as -pv are
                # treated the same way.
                if "v" in option[1:].lower():
                    query = True
                index += 1
            if query:
                return len(segment)
            continue
        if base == "exec":
            index += 1
            while index < len(segment) and segment[index].startswith("-"):
                index = _skip_option_value(segment, index, {"-a"})
            continue
        if base in {"nohup", "setsid"}:
            index += 1
            if index < len(segment) and segment[index] == "--":
                index += 1
            while index < len(segment) and segment[index].startswith("-"):
                index += 1
            continue
        if base == "env":
            index += 1
            while index < len(segment):
                token = segment[index]
                if token == "--":
                    index += 1
                    break
                if token in {"-S", "--split-string"} or token.startswith(
                    "--split-string="
                ):
                    # The split-string body is inspected by
                    # `_nested_shell_commands`; it is not an executable token.
                    return len(segment)
                if token.startswith("-"):
                    index = _skip_option_value(
                        segment,
                        index,
                        {"-u", "--unset", "-C", "--chdir"},
                    )
                    continue
                if "=" in token and not token.startswith("="):
                    index += 1
                    continue
                break
            continue
        if base == "nice":
            index += 1
            while index < len(segment) and segment[index].startswith("-"):
                index = _skip_option_value(segment, index, {"-n", "--adjustment"})
            continue
        if base == "time":
            index += 1
            while index < len(segment) and segment[index].startswith("-"):
                index = _skip_option_value(
                    segment, index, {"-o", "--output", "-f", "--format"}
                )
            continue
        if base == "timeout":
            index += 1
            while index < len(segment) and segment[index].startswith("-"):
                index = _skip_option_value(
                    segment,
                    index,
                    {"-k", "--kill-after", "-s", "--signal"},
                )
            if index < len(segment):
                index += 1  # duration
            continue
        if base == "stdbuf":
            index += 1
            value_options = {"-i", "--input", "-o", "--output", "-e", "--error"}
            while index < len(segment) and segment[index].startswith("-"):
                option = segment[index]
                if option in value_options:
                    index = _skip_option_value(segment, index, value_options)
                elif any(option.startswith(f"{value}=") for value in value_options) or (
                    len(option) > 2 and option[:2] in {"-i", "-o", "-e"}
                ):
                    index += 1
                else:
                    index += 1
            continue
        if base == "busybox":
            index += 1
            if index < len(segment) and segment[index] == "--":
                index += 1
            while index < len(segment) and segment[index].startswith("-"):
                index += 1
            continue
        if base == "xargs":
            index += 1
            value_options = {
                "-E",
                "-I",
                "-J",
                "-L",
                "-n",
                "-P",
                "-R",
                "-s",
                "-S",
                "-d",
                "--arg-file",
                "--delimiter",
                "--eof",
                "--max-args",
                "--max-procs",
                "--max-lines",
                "--replace",
                "--max-chars",
            }
            while index < len(segment):
                token = segment[index]
                if token == "--":
                    index += 1
                    break
                if not token.startswith("-"):
                    break
                index = _skip_option_value(segment, index, value_options)
            continue
        return index
    return index


def _nested_shell_commands(segment: list[str]) -> list[str]:
    """Extract bounded shell/wrapper payloads for recursive inspection."""
    nested: list[str] = []
    wrapper_bases = {
        "command",
        "exec",
        "nice",
        "nohup",
        "setsid",
        "time",
        "timeout",
        "stdbuf",
        "busybox",
        "env",
    }
    env_index = next(
        (
            index
            for index, token in enumerate(segment)
            if executable(token) == "env"
            and (index == 0 or executable(segment[0]) in wrapper_bases)
        ),
        None,
    )
    if env_index is not None:
        index = env_index + 1
        while index < len(segment):
            option = segment[index]
            if option in {"-S", "--split-string"}:
                if index + 1 < len(segment):
                    nested.append(segment[index + 1])
                break
            if option.startswith("--split-string="):
                nested.append(option.split("=", 1)[1])
                break
            if option in {"-u", "--unset", "-C", "--chdir"}:
                index += 2
                continue
            if option.startswith("-"):
                index += 1
                continue
            if "=" in option and not option.startswith("="):
                index += 1
                continue
            break
        if nested:
            return nested
    index = 0
    actual = _actual_command_index(segment)
    if actual < len(segment) and executable(segment[actual]) == "eval":
        if actual + 1 < len(segment):
            nested.append(" ".join(segment[actual + 1 :]))
        return nested
    if actual >= len(segment) or not _is_shell(segment[actual]):
        return nested
    for marker in ("<<<", "<<"):
        marker_index = next(
            (
                position
                for position, token in enumerate(segment)
                if _is_syntax_token(token, {marker})
            ),
            None,
        )
        if marker_index is not None:
            nested.append(" ".join(segment[marker_index + 1 :]))
            break
    index = actual + 1
    value_options = {
        "-o",
        "+o",
        "-O",
        "+O",
        "--rcfile",
        "--init-file",
    }
    while index < len(segment):
        option = segment[index]
        if option == "--":
            break
        if option == "-c" or (
            option.startswith("-") and not option.startswith("--") and "c" in option[1:]
        ):
            index += 1
            if index < len(segment):
                nested.append(segment[index])
            break
        if option.startswith(("-", "+")):
            index = _skip_option_value(segment, index, value_options)
            continue
        break
    return nested


def _dangerous_git(segment: list[str]) -> str | None:
    if not segment or executable(segment[0]) != "git":
        return None
    args = segment[1:]
    global_value_options = {
        "-C",
        "-c",
        "--git-dir",
        "--work-tree",
        "--namespace",
        "--exec-path",
    }
    index = 0
    inline_configs: list[str] = []
    while index < len(args):
        token = args[index]
        if token == "--":
            index += 1
            break
        if token in global_value_options:
            if token == "-c" and index + 1 < len(args):
                inline_configs.append(args[index + 1])
            index += 2
            continue
        # Git accepts the value for its short -C/-c options immediately after
        # the option letter (for example, ``-C.``).  Treat those forms like
        # their separated equivalents so a global option cannot hide a
        # destructive subcommand from this backstop.
        if token.startswith(("-C", "-c")) and token not in {"-C", "-c"}:
            if token.startswith("-c"):
                inline_configs.append(token[2:])
            index += 1
            continue
        if any(token.startswith(f"{option}=") for option in global_value_options):
            index += 1
            continue
        if token.startswith("-"):
            index += 1
            continue
        break
    for setting in inline_configs:
        key, separator, value = setting.partition("=")
        if not separator or not key.lower().startswith("alias."):
            continue
        alias_command = value.lstrip()
        reason = danger_reason(
            alias_command[1:]
            if alias_command.startswith("!")
            else f"git {alias_command}"
        )
        if reason:
            return "destructive inline git alias"
    args = args[index:]
    if not args:
        return None
    subcommand = args[0]
    rest = args[1:]
    if subcommand == "clean":
        # Git accepts combined short flags in either order (for example -fn and
        # -nfd).  A dry-run flag makes cleanup non-mutating even when -f is also
        # present, so inspect the normalized flag characters before looking for
        # force.  This keeps the backstop independent of execpolicy's literal
        # prefix matching.
        dry_run = any(
            arg == "--dry-run"
            or (arg.startswith("-") and not arg.startswith("--") and "n" in arg[1:])
            for arg in rest
        )
        if dry_run:
            return None
        if any(
            arg in {"-f", "-ff", "--force"}
            or (arg.startswith("-") and "f" in arg[1:] and not arg.startswith("--"))
            for arg in rest
        ):
            return "destructive git working-tree cleanup"
        return None
    if subcommand == "reset" and any(
        arg in {"--hard", "-H"} or arg.startswith("--hard=") for arg in rest
    ):
        return "destructive git hard reset"
    if subcommand in {"filter-branch", "filter-repo"}:
        return "irreversible git history rewriting"
    if subcommand == "reflog" and rest and rest[0] == "expire":
        return "destructive git reflog expiration"
    if subcommand == "branch":
        short_flags = "".join(
            arg[1:] for arg in rest if arg.startswith("-") and not arg.startswith("--")
        )
        deletes = "d" in short_flags.lower() or "--delete" in rest
        forces = "D" in short_flags or "f" in short_flags.lower() or "--force" in rest
        if deletes and forces:
            return "forced git branch deletion"
    if subcommand == "stash":
        action = next((arg for arg in rest if not arg.startswith("-")), None)
        if action in {"drop", "clear"}:
            return "destructive git stash removal"
    if subcommand == "checkout" and "--" in rest:
        targets = rest[rest.index("--") + 1 :]
        if not targets or any(
            _broad_path(target) or target in {":/", ":(top)"} for target in targets
        ):
            return "destructive git checkout"
    if subcommand == "restore":
        targets = [arg for arg in rest if not arg.startswith("-")]
        if not targets or any(
            _broad_path(target) or target in {":/", ":(top)"} for target in targets
        ):
            return "destructive git restore"
    if subcommand == "push" and any(
        arg in {"--force", "--force-with-lease", "-f"}
        or arg.startswith("--force-with-lease=")
        for arg in rest
    ):
        return "destructive remote git history rewrite"
    return None


def _inspect_segments(parts: list[list[str]]) -> str | None:
    """Inspect tokenized command segments without flattening quoted arguments."""
    for segment in parts:
        reason = _dangerous_segment(segment)
        if reason:
            return reason
        for nested in _nested_shell_commands(segment):
            reason = danger_reason(nested)
            if reason:
                return reason
    return None


def _dangerous_segment(segment: list[str]) -> str | None:
    if not segment:
        return None
    if _is_syntax_token(segment[0], {">", ">|"}):
        return "destructive shell truncation"
    index = _actual_command_index(segment)
    if index >= len(segment):
        return None
    base = executable(segment[index])
    args = segment[index + 1 :]
    if base == "rm":
        recursive = any(
            token == "--recursive"
            or (
                token.startswith("-")
                and not token.startswith("--")
                and "r" in token.lower()
            )
            for token in args
        )
        targets = [
            token for token in args if not token.startswith("-") or token == "--"
        ]
        broad_target = any(_broad_path(token) for token in targets)
        if recursive and broad_target:
            return "catastrophic recursive deletion"
    if base == "find" and any(marker in args for marker in ("-exec", "-execdir")):
        marker = next(marker for marker in ("-exec", "-execdir") if marker in args)
        nested = args[args.index(marker) + 1 :]
        if nested and nested[-1] == ";":
            nested = nested[:-1]
        nested_index = _actual_command_index(nested) if nested else 0
        # ``{}`` is a placeholder for every path selected by find.  A
        # recursive remove against it is therefore broad even though the
        # literal token itself is not ``.`` or ``/``.
        if (
            nested_index < len(nested)
            and executable(nested[nested_index]) == "rm"
            and any(
                token == "--recursive"
                or (
                    token.startswith("-")
                    and not token.startswith("--")
                    and "r" in token.lower()
                )
                for token in nested[nested_index + 1 :]
            )
            and "{}" in nested[nested_index + 1 :]
        ):
            return "catastrophic recursive find deletion"
        # Keep the quoted `sh -c` body as one argument. Flattening this list
        # would turn `"rm -rf /"` into `rm`, `-rf`, `/` and hide the payload.
        reason = _inspect_segments(segments(nested)) if nested else None
        if reason:
            return reason
    if (
        base == "find"
        and "-delete" in args
        and any(_broad_path(token) for token in args if token != "-delete")
    ):
        return "destructive recursive find deletion"
    if base.startswith("mkfs.") or base in {
        "dd",
        "cfdisk",
        "fdisk",
        "halt",
        "mkfs",
        "mkfs.ext4",
        "mkfs.xfs",
        "mkswap",
        "parted",
        "poweroff",
        "reboot",
        "runuser",
        "shred",
        "shutdown",
        "su",
        "sudo",
        "doas",
        "pkexec",
        "truncate",
        "wipefs",
        "sfdisk",
    }:
        return f"dangerous {base} command"
    if base == "systemctl" and any(
        token in {"halt", "poweroff", "reboot", "shutdown"} for token in args
    ):
        return "host power-state change"
    if base == "init" and any(token in {"0", "6"} for token in args):
        return "host power-state change"
    git_reason = _dangerous_git(segment[index:])
    if git_reason:
        return git_reason
    # `:` and `cat /dev/null` are common shell truncation idioms. Do not reject
    # ordinary build/test output redirection such as `pytest > test.log`.
    if base in {":", "true"} and any(
        _is_syntax_token(token, {">", ">|"}) for token in args
    ):
        return "destructive shell truncation"
    if (
        base == "cat"
        and "/dev/null" in args
        and any(_is_syntax_token(token, {">", ">|"}) for token in args)
    ):
        return "destructive shell truncation"
    return None


def _pipeline_fetch_to_shell(tokens: list[str]) -> str | None:
    def pipeline_command(part: list[str]) -> str:
        index = _actual_command_index(part)
        return executable(part[index]) if index < len(part) else ""

    operators = SHELL_OPERATORS
    for index, operator in enumerate(tokens):
        if not _is_syntax_token(operator, {"|", "|&"}):
            continue
        left_start = index
        while left_start and not _is_syntax_token(tokens[left_start - 1], operators):
            left_start -= 1
        right_end = index + 1
        while right_end < len(tokens) and not _is_syntax_token(
            tokens[right_end], operators
        ):
            right_end += 1
        left = tokens[left_start:index]
        right = tokens[index + 1 : right_end]
        if not left or not right:
            continue
        right_command = pipeline_command(right)
        if right_command not in SHELL_BASENAMES:
            continue
        if pipeline_command(left) in {"curl", "wget"}:
            return "network download piped to a shell"
        # A shell fed by generated text is dangerous when the source itself
        # contains a destructive command. Keep this bounded to shell input rather
        # than claiming to understand arbitrary generator/interpreter code.
        for source in left[1:]:
            if danger_reason(source):
                return "generated text piped to a shell"
    return None


def _is_fork_bomb(tokens: list[str]) -> bool:
    if len(tokens) < 2 or tokens[1] != "()":
        return False
    compact = "".join(tokens)
    return bool(
        re.search(r":\(\)\{.*:\|:&", compact)
        or re.search(
            r"(?P<fn>[A-Za-z_][A-Za-z0-9_]*)\(\)\{[^{}]*\b(?P=fn)\b[^{}]*\|[^{}]*\b(?P=fn)\b[^{}]*&",
            compact,
        )
    )


def danger_reason(command: str) -> str | None:
    """Return a stable denial reason, or ``None`` for safe/unparseable input."""
    for body in _substitution_bodies(command):
        reason = danger_reason(body)
        if reason:
            return reason
    tokens = shell_tokens(command)
    if not tokens:
        return None
    parts = segments(tokens)
    function_chunks: list[list[str]] = []
    current: list[str] = []
    for token in tokens:
        if _is_syntax_token(token, {";", "&&", "||"}):
            if current:
                function_chunks.append(current)
                current = []
        else:
            current.append(token)
    if current:
        function_chunks.append(current)
    if any(_is_fork_bomb(chunk) for chunk in function_chunks):
        return "fork bomb"
    pipeline_reason = _pipeline_fetch_to_shell(tokens)
    if pipeline_reason:
        return pipeline_reason
    return _inspect_segments(parts)


def main() -> None:
    event = sys.argv[1] if len(sys.argv) > 1 else ""
    if event != "PreToolUse":
        return
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        return
    command = command_text(payload)
    if command is None:
        return
    reason = danger_reason(command)
    if reason:
        emit(event, reason)


if __name__ == "__main__":
    main()
