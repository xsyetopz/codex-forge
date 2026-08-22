from __future__ import annotations

import json
import re
from pathlib import Path

import tomllib

ROOT_KEYS = {
    "model",
    "model_reasoning_effort",
    "plan_mode_reasoning_effort",
    "model_reasoning_summary",
    "model_verbosity",
    "service_tier",
    "model_instructions_file",
    "experimental_compact_prompt_file",
    "developer_instructions",
    "include_collaboration_mode_instructions",
    "approval_policy",
    "approvals_reviewer",
    "sandbox_mode",
}
TABLE_KEYS = {
    "sandbox_workspace_write": {"network_access"},
    "agents": {
        "default_subagent_model",
        "default_subagent_reasoning_effort",
        "max_concurrent_threads_per_session",
        "max_depth",
    },
    "apps._default": {
        "default_tools_approval_mode",
        "destructive_enabled",
        "open_world_enabled",
    },
    "features": {
        "fast_mode",
        "personality",
        "prevent_idle_sleep",
        "local_thread_store_compression",
        "apply_patch_preserve_line_endings",
        "cwd_relative_turn_diffs",
        "unified_image_budget",
    },
    "features.token_budget": {"enabled"},
}


def quote(value: str) -> str:
    return json.dumps(str(value))


def parse_table_header(line: str) -> str | None:
    match = re.match(r"^\s*\[([^\[\]]+)\]\s*(?:#.*)?$", line)
    return match.group(1).strip() if match else None


def assignment_key(line: str) -> str | None:
    match = re.match(r"^\s*([A-Za-z0-9_.-]+)\s*=", line)
    return match.group(1) if match else None


def remove_keys(lines: list[str], keys: set[str]) -> list[str]:
    output: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if assignment_key(line) not in keys:
            output.append(line)
            index += 1
            continue
        marker = None
        if '"""' in line and line.count('"""') % 2 == 1:
            marker = '"""'
        elif "'''" in line and line.count("'''") % 2 == 1:
            marker = "'''"
        index += 1
        if marker:
            while index < len(lines):
                if marker in lines[index] and lines[index].count(marker) % 2 == 1:
                    index += 1
                    break
                index += 1
    return output


def split_sections(text: str) -> tuple[list[str], list[tuple[str, list[str]]]]:
    root: list[str] = []
    sections: list[tuple[str, list[str]]] = []
    current_name: str | None = None
    current: list[str] = []
    for line in text.splitlines(keepends=True):
        name = parse_table_header(line)
        if name is None:
            current.append(line)
            continue
        if current_name is None:
            root.extend(current)
        else:
            sections.append((current_name, current))
        current_name, current = name, [line]
    if current_name is None:
        root.extend(current)
    else:
        sections.append((current_name, current))
    return root, sections


def managed_block(scope: str, lines: list[str]) -> list[str]:
    return [
        f"# >>> codex-forge:{scope} >>>\n",
        *[line.rstrip("\n") + "\n" for line in lines],
        f"# <<< codex-forge:{scope} <<<\n",
    ]


def strip_managed(text: str) -> str:
    return re.sub(
        r"(?ms)^# >>> codex-forge:[^\n]+ >>>\n.*?^# <<< codex-forge:[^\n]+ <<<\n?",
        "",
        text,
    )


def fragments(home: Path, plugin_root: Path):
    forge = home / "forge"
    developer = (
        (plugin_root / "assets" / "developer-instructions.txt").read_text().strip()
    )
    root = [
        'model = "gpt-5.6-sol"',
        'model_reasoning_effort = "medium"',
        'plan_mode_reasoning_effort = "high"',
        'model_reasoning_summary = "none"',
        'model_verbosity = "low"',
        'service_tier = "flex"',
        f"model_instructions_file = {quote(str(forge / 'model-instructions.md'))}",
        f"experimental_compact_prompt_file = {quote(str(forge / 'compact-prompt.md'))}",
        f"developer_instructions = {quote(developer)}",
        "include_collaboration_mode_instructions = false",
        'approval_policy = "never"',
        'approvals_reviewer = "user"',
        'sandbox_mode = "workspace-write"',
    ]
    tables = {
        "sandbox_workspace_write": ["network_access = true"],
        "agents": [
            'default_subagent_model = "gpt-5.6-luna"',
            'default_subagent_reasoning_effort = "high"',
            "max_concurrent_threads_per_session = 3",
            "max_depth = 1",
        ],
        "apps._default": [
            'default_tools_approval_mode = "writes"',
            "destructive_enabled = false",
            "open_world_enabled = false",
        ],
        "features": [
            "fast_mode = false",
            "personality = false",
            "prevent_idle_sleep = true",
            "local_thread_store_compression = true",
            "apply_patch_preserve_line_endings = true",
            "cwd_relative_turn_diffs = true",
            "unified_image_budget = true",
        ],
        "features.token_budget": ["enabled = true"],
    }
    descriptions = json.loads(
        (plugin_root / "assets" / "agent-descriptions.json").read_text()
    )
    roles = []
    for source in sorted((plugin_root / "agents").glob("forge-*.toml")):
        role = source.stem
        roles.append(
            (
                f"agents.{role}",
                [
                    f"description = {quote(descriptions[role])}",
                    f"config_file = {quote(str((home / 'agents' / source.name).resolve()))}",
                ],
            )
        )
    return root, tables, roles


def merge_config(text: str, home: Path, plugin_root: Path) -> tuple[str, list[str]]:
    text = strip_managed(text)
    if text.strip():
        tomllib.loads(text)
    root_lines, sections = split_sections(text)
    desired_root, desired_tables, desired_roles = fragments(home, plugin_root)
    root_lines = remove_keys(root_lines, ROOT_KEYS)
    while root_lines and not root_lines[-1].strip():
        root_lines.pop()
    if root_lines:
        root_lines.append("\n")
    root_lines.extend(managed_block("root", desired_root))
    root_lines.append("\n")
    sections = [
        (name, lines)
        for name, lines in sections
        if not name.startswith("agents.forge-")
    ]
    created_tables = []
    for table, additions in desired_tables.items():
        for index, (name, lines) in enumerate(sections):
            if name == table:
                sections[index] = (
                    name,
                    lines[:1]
                    + managed_block(table, additions)
                    + remove_keys(lines[1:], TABLE_KEYS[table]),
                )
                break
        else:
            created_tables.append(table)
            sections.append(
                (table, managed_block(f"table:{table}", [f"[{table}]", *additions]))
            )
    for table, values in desired_roles:
        sections.append(
            (table, managed_block(f"role:{table}", [f"[{table}]", *values]))
        )
    output = "".join(root_lines)
    for _, lines in sections:
        if output and not output.endswith("\n\n"):
            output += "\n"
        output += "".join(lines)
    if not output.endswith("\n"):
        output += "\n"
    tomllib.loads(output)
    return output, created_tables
