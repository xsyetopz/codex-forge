#!/usr/bin/env python3
from __future__ import annotations

import os
import shutil
import sys

PACKAGE = "@colbymchenry/codegraph"


def command_candidates() -> list[list[str]]:
    candidates: list[list[str]] = []
    if shutil.which("codegraph"):
        candidates.append(["codegraph"])
    if shutil.which("bun"):
        candidates.append(["bun", "x", PACKAGE])
    elif shutil.which("bunx"):
        candidates.append(["bunx", PACKAGE])
    if shutil.which("pnpm"):
        candidates.append(["pnpm", "dlx", PACKAGE])
    elif shutil.which("pnpx"):
        candidates.append(["pnpx", PACKAGE])
    if shutil.which("yarn"):
        candidates.append(["yarn", "dlx", PACKAGE])
    if shutil.which("npx"):
        candidates.append(["npx", "--yes", PACKAGE])
    return candidates


def resolve_command() -> list[str] | None:
    candidates = command_candidates()
    return candidates[0] if candidates else None


def main() -> int:
    command = resolve_command()
    if command is None:
        print(
            "CodeGraph CLI unavailable: install Bun, pnpm, Yarn, or npm/Node.js",
            file=sys.stderr,
        )
        return 127
    os.execvp(command[0], [*command, *sys.argv[1:]])
    return 127


if __name__ == "__main__":
    raise SystemExit(main())
