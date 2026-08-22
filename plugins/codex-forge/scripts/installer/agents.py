from __future__ import annotations

import re

START = "<!-- >>> codex-forge:codegraph >>>"
END = "<!-- <<< codex-forge:codegraph <<< -->"
BLOCK = re.compile(rf"(?ms)^{re.escape(START)}\n.*?^{re.escape(END)}\n?")


def strip_managed_agents(text: str) -> str:
    return BLOCK.sub("", text).rstrip()


def merge_agents(text: str, managed_section: str) -> str:
    existing = strip_managed_agents(text)
    section = managed_section.strip()
    return f"{existing}\n\n{section}\n" if existing else f"{section}\n"
