#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys

from codegraph import resolve_command

CORE = {
    "rg": "ripgrep",
    "fd": "fd",
    "jq": "jq",
    "uv": "uv",
    "ast-grep": "ast-grep",
}
OPTIONAL = {
    "bat": "bat",
    "gh": "gh",
    "shellcheck": "shellcheck",
    "shfmt": "shfmt",
    "hyperfine": "hyperfine",
    "just": "just",
    "watchexec": "watchexec",
    "tokei": "tokei",
}


def run(cmd, timeout=180):
    return subprocess.run(
        cmd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
        check=False,
    )


def verify_brew_formula(pkg):
    if not shutil.which("brew"):
        return False
    p = run(["brew", "info", "--formula", pkg], 30)
    return p.returncode == 0


def install_native(command, package):
    if shutil.which(command):
        return True, "present"
    system = platform.system()
    if shutil.which("brew") and verify_brew_formula(package):
        p = run(["brew", "install", package])
        return shutil.which(command) is not None, p.stdout[-2000:]
    if system == "Windows" and shutil.which("scoop"):
        p = run(["scoop", "search", package], 30)
        if p.returncode == 0 and package.lower() in p.stdout.lower():
            p = run(["scoop", "install", package])
            return shutil.which(command) is not None, p.stdout[-2000:]
    # Linux system managers are used only when already privileged; never synthesize sudo.
    if (
        system == "Linux"
        and hasattr(os, "geteuid")
        and os.geteuid() == 0
        and shutil.which("apt-get")
        and shutil.which("apt-cache")
    ):
        apt_pkg = {"fd": "fd-find"}.get(command, package)
        q = run(["apt-cache", "show", apt_pkg], 30)
        if q.returncode == 0:
            p = run(["apt-get", "install", "-y", apt_pkg])
            if command == "fd" and not shutil.which("fd") and shutil.which("fdfind"):
                return True, "installed fd-find; binary is fdfind"
            return shutil.which(command) is not None, p.stdout[-2000:]
    return False, "no verified non-interactive provider available"


def install_codegraph():
    if shutil.which("codegraph"):
        return True, "present"
    attempts = []
    installers = [
        ("bun", ["bun", "add", "--global", "@colbymchenry/codegraph"]),
        ("pnpm", ["pnpm", "add", "--global", "@colbymchenry/codegraph"]),
        ("yarn", ["yarn", "global", "add", "@colbymchenry/codegraph"]),
        ("npm", ["npm", "install", "--global", "@colbymchenry/codegraph"]),
    ]
    for executable, command in installers:
        if not shutil.which(executable):
            continue
        result = run(command, 240)
        attempts.append(result.stdout[-2000:])
        if result.returncode == 0 and shutil.which("codegraph"):
            return True, result.stdout[-2000:]
    runner = resolve_command()
    if runner:
        return True, f"runner available: {' '.join(runner)}"
    return False, "\n".join(attempts) or "no Bun, pnpm, Yarn, or npm provider available"


def main():
    ap = argparse.ArgumentParser(
        description="Install verified CLI helpers used by Codex Forge."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    ins = sub.add_parser("install")
    ins.add_argument("tools", nargs="*")
    ins.add_argument("--full", action="store_true")
    sub.add_parser("doctor")
    a = ap.parse_args()
    if a.cmd == "doctor":
        names = list(CORE) + ["codegraph"] + list(OPTIONAL)
        for n in names:
            print(f"{n}: {shutil.which(n) or 'missing'}")
        return 0
    names = a.tools or list(CORE) + ["codegraph"]
    if a.full:
        names = list(CORE) + ["codegraph"] + list(OPTIONAL)
    bad = []
    for n in names:
        if n == "codegraph":
            ok, msg = install_codegraph()
        else:
            pkg = (CORE | OPTIONAL).get(n)
            if not pkg:
                print(f"unknown tool: {n}", file=sys.stderr)
                bad.append(n)
                continue
            ok, msg = install_native(n, pkg)
        print(f"{n}: {'ok' if ok else 'not installed'}")
        if not ok:
            print(msg.strip())
            bad.append(n)
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
