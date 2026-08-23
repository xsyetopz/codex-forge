#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

import tomllib

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from installer.config import merge_config, strip_managed
from installer.files import install_files, revert_files, uninstall_files

VERSION = 4


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def codex_home() -> Path:
    environment = __import__("os").environ
    return (
        Path.home() / ".codex"
        if "CODEX_HOME" not in environment
        else Path(environment["CODEX_HOME"]).expanduser().resolve()
    )


def plugin_root() -> Path:
    return Path(__file__).resolve().parents[1]


def next_backup(home: Path) -> Path:
    backup = home / "forge" / "backups" / time.strftime("%Y%m%d-%H%M%S")
    suffix = 0
    while backup.exists():
        suffix += 1
        backup = backup.with_name(backup.name + f"-{suffix}")
    return backup


def original_config(current: str, prior_state: dict) -> str:
    if prior_state and sha(current) == prior_state.get("config_after_sha256"):
        prior = Path(prior_state.get("backup", "")) / "config.toml"
        if prior.exists():
            return prior.read_text()
    if "codex-forge:" in current:
        print(
            "[cf] existing Forge config was modified; preserving non-Forge edits during reinstall",
            file=sys.stderr,
        )
        return strip_managed(current)
    return current


def install(args: argparse.Namespace) -> int:
    home = codex_home()
    home.mkdir(parents=True, exist_ok=True)
    config_path = home / "config.toml"
    current = config_path.read_text() if config_path.exists() else ""
    state_path = home / "forge" / "install-state.json"
    prior_state = json.loads(state_path.read_text()) if state_path.exists() else {}
    old = original_config(current, prior_state)
    try:
        if old.strip():
            tomllib.loads(old)
    except tomllib.TOMLDecodeError as error:
        print(f"[cf] refusing to modify invalid config.toml: {error}", file=sys.stderr)
        return 2
    backup = next_backup(home)
    backup.mkdir(parents=True, exist_ok=False)
    (backup / "config.toml").write_text(old)
    mappings = install_files(home, plugin_root(), backup, prior_state)
    new, created_tables = merge_config(old, home, plugin_root())
    config_path.write_text(new)
    state = {
        "version": VERSION,
        "installed_at": time.time(),
        "backup": str(backup),
        "config_before_sha256": sha(old),
        "config_after_sha256": sha(new),
        "files": [item["target"] for item in mappings],
        "file_mappings": mappings,
        "created_tables": created_tables,
    }
    state_path.write_text(json.dumps(state, indent=2) + "\n")
    if not args.no_tools:
        result = subprocess.run(
            [sys.executable, str(plugin_root() / "scripts" / "tools.py"), "install"],
            text=True,
            check=False,
        )
        if result.returncode:
            print(
                "[cf] Some CLI helpers could not be installed; Forge configuration is installed.",
                file=sys.stderr,
            )
    print(f"[cf] installed into {home}")
    print(f"[cf] backup: {backup}")
    return 0


def uninstall(_args: argparse.Namespace) -> int:
    home = codex_home()
    config_path = home / "config.toml"
    state_path = home / "forge" / "install-state.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    current = config_path.read_text() if config_path.exists() else ""
    backup = (
        Path(state.get("backup", "")) / "config.toml" if state.get("backup") else None
    )
    if (
        state
        and sha(current) == state.get("config_after_sha256")
        and backup
        and backup.exists()
    ):
        config_path.write_text(backup.read_text())
        print("[cf] restored pre-install config.toml")
    else:
        cleaned = strip_managed(current)
        if cleaned.strip():
            tomllib.loads(cleaned)
        config_path.write_text(cleaned.rstrip() + "\n" if cleaned.strip() else "")
        if backup and backup.exists():
            print(
                f"[cf] config changed since install; removed Forge-managed values. Original backup: {backup}"
            )
    uninstall_files(home, state)
    state_path.unlink(missing_ok=True)
    print("[cf] uninstalled user-level Forge configuration")
    return 0


def revert(_args: argparse.Namespace) -> int:
    state_path = codex_home() / "forge" / "install-state.json"
    if not state_path.exists():
        print("[cf] no Forge installation state found", file=sys.stderr)
        return 1
    state = json.loads(state_path.read_text())
    mappings = state.get("file_mappings", [])
    if not mappings:
        print(
            "[cf] installation predates hashed file mappings; reinstall first",
            file=sys.stderr,
        )
        return 2
    try:
        count = revert_files(plugin_root(), mappings)
    except FileNotFoundError as error:
        print(f"[cf] {error}", file=sys.stderr)
        return 2
    state_path.write_text(json.dumps(state, indent=2) + "\n")
    print(f"[cf] reverted {count} mapped files to plugin sources")
    return 0


def doctor(_args: argparse.Namespace) -> int:
    home = codex_home()
    config_path = home / "config.toml"
    try:
        parsed = bool(
            config_path.exists() and tomllib.loads(config_path.read_text()) is not None
        )
    except tomllib.TOMLDecodeError:
        parsed = False
    checks = [
        (
            "config",
            config_path.exists() and "codex-forge:root" in config_path.read_text(),
        ),
        ("config TOML", parsed),
        ("model instructions", (home / "forge" / "model-instructions.md").exists()),
        ("compact prompt", (home / "forge" / "compact-prompt.md").exists()),
        ("rules", (home / "rules" / "forge.rules").exists()),
        ("agent roles", len(list((home / "agents").glob("forge-*.toml"))) >= 9),
    ]
    for name, ok in checks:
        print(f"{name}: {'ok' if ok else 'missing'}")
    if shutil.which("codex"):
        result = subprocess.run(
            ["codex", "--version"],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=10,
            check=False,
        )
        print("codex:", result.stdout.strip())
    else:
        print("codex: not found")
    return 0 if all(ok for _, ok in checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Install Codex Forge into normal Codex user configuration."
    )
    commands = parser.add_subparsers(dest="cmd", required=True)
    install_parser = commands.add_parser("install")
    install_parser.add_argument("--no-tools", action="store_true")
    commands.add_parser("uninstall")
    commands.add_parser("revert")
    commands.add_parser("doctor")
    args = parser.parse_args()
    return {
        "install": install,
        "uninstall": uninstall,
        "revert": revert,
        "doctor": doctor,
    }[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
