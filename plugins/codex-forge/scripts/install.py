#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
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
from installer.files import file_sha, install_files, revert_files, uninstall_files


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def codex_home() -> Path:
    environment = os.environ
    return (
        Path.home() / ".codex"
        if "CODEX_HOME" not in environment
        else Path(environment["CODEX_HOME"]).expanduser().resolve()
    )


def plugin_root() -> Path:
    return Path(__file__).resolve().parents[1]


def plugin_manifest() -> dict:
    path = plugin_root() / ".codex-plugin" / "plugin.json"
    return json.loads(path.read_text())


def cached_installs(home: Path) -> list[Path]:
    name = plugin_manifest()["name"]
    return sorted(
        path
        for path in (home / "plugins" / "cache").glob(f"*/{name}/*")
        if path.is_dir()
    )


def purge_cached_installs(home: Path, *, keep_version: str | None) -> list[Path]:
    removed = []
    for path in cached_installs(home):
        if keep_version is not None and path.name == keep_version:
            continue
        shutil.rmtree(path)
        removed.append(path)
        for parent in (path.parent, path.parent.parent):
            try:
                parent.rmdir()
            except OSError:
                pass
    return removed


def plugin_selectors(config_path: Path, *, active_only: bool = False) -> list[str]:
    if not config_path.is_file():
        return []
    try:
        plugins = tomllib.loads(config_path.read_text()).get("plugins", {})
    except tomllib.TOMLDecodeError:
        return []
    if not isinstance(plugins, dict):
        return []
    name = plugin_manifest()["name"]
    selectors = []
    for selector, settings in plugins.items():
        if selector != name and not selector.startswith(f"{name}@"):
            continue
        if active_only and (
            not isinstance(settings, dict) or settings.get("enabled") is False
        ):
            continue
        selectors.append(selector)
    return sorted(selectors)


def remove_plugin_installations(home: Path, config_path: Path) -> bool:
    # Purge removes disabled registrations too; they are still installed
    # registration entries even though doctor does not treat them as active.
    selectors = plugin_selectors(config_path, active_only=False)
    if not selectors:
        return True
    executable = shutil.which("codex")
    if executable is None:
        return False
    environment = os.environ.copy()
    environment["CODEX_HOME"] = str(home)
    return all(
        subprocess.run(
            [executable, "plugin", "remove", selector, "--json"],
            env=environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        ).returncode
        == 0
        for selector in selectors
    )


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
    mappings = install_files(
        home,
        plugin_root(),
        backup,
        prior_state,
        force=args.replace,
    )
    new, created_tables = merge_config(old, home, plugin_root())
    config_path.write_text(new)
    state = {
        "plugin_version": plugin_manifest()["version"],
        "installed_at": time.time(),
        "backup": str(backup),
        "config_before_sha256": sha(old),
        "config_after_sha256": sha(new),
        "files": [item["target"] for item in mappings],
        "file_mappings": mappings,
        "created_tables": created_tables,
    }
    state_path.write_text(json.dumps(state, indent=2) + "\n")
    if args.purge_cache:
        purge_cached_installs(home, keep_version=state["plugin_version"])
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


def uninstall(args: argparse.Namespace) -> int:
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
    uninstall_files(home, state, force=args.purge)
    state_path.unlink(missing_ok=True)
    plugins_removed = True
    if args.purge:
        plugins_removed = remove_plugin_installations(home, config_path)
        purge_cached_installs(home, keep_version=None)
        shutil.rmtree(home / "forge", ignore_errors=True)
    print("[cf] uninstalled user-level Forge configuration")
    if not plugins_removed:
        print(
            "[cf] unable to remove installed Forge plugin registrations",
            file=sys.stderr,
        )
        return 1
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


def doctor(args: argparse.Namespace) -> int:
    home = codex_home()
    config_path = home / "config.toml"
    state_path = home / "forge" / "install-state.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    source_version = plugin_manifest()["version"]
    if args.purge_cache:
        purge_cached_installs(home, keep_version=source_version)
    parsed_config = {}
    try:
        parsed_config = (
            tomllib.loads(config_path.read_text()) if config_path.exists() else {}
        )
        parsed = True
    except tomllib.TOMLDecodeError:
        parsed = False
    features = parsed_config.get("features", {})
    hooks_enabled = isinstance(features, dict) and features.get("hooks") is True
    checks = {
        "config": config_path.exists()
        and "codex-forge:root" in config_path.read_text(),
        "config_toml": parsed,
        "hooks_enabled": hooks_enabled,
        "plugin_registered": bool(plugin_selectors(config_path, active_only=True)),
        "model_instructions": (home / "forge" / "model-instructions.md").exists(),
        "compact_prompt": (home / "forge" / "compact-prompt.md").exists(),
        "rules": (home / "rules" / "forge.rules").exists(),
        "agent_roles": len(list((home / "agents").glob("forge-*.toml"))) >= 9,
    }
    mappings = state.get("file_mappings", [])
    overrides = []
    sources_changed = []
    for item in mappings:
        source = plugin_root() / item["source"]
        target = Path(item["target"])
        if not source.is_file() or file_sha(source) != item.get("source_sha256"):
            sources_changed.append(item["source"])
        if target.is_file() and file_sha(target) != item.get("installed_sha256"):
            overrides.append(item["target"])
    upgrade_available = bool(
        state and (state.get("plugin_version") != source_version or sources_changed)
    )
    cache_versions = [path.name for path in cached_installs(home)]
    stale_cache_versions = [
        version for version in cache_versions if version != source_version
    ]
    diagnosis = {
        "healthy": all(checks.values()) and not upgrade_available,
        "checks": checks,
        "source_version": source_version,
        "installed_version": state.get("plugin_version"),
        "upgrade_available": upgrade_available,
        "override_count": len(overrides),
        "cache_versions": cache_versions,
        "stale_cache_versions": stale_cache_versions,
        "plugin_selectors": plugin_selectors(config_path, active_only=True),
        "configured_plugin_selectors": plugin_selectors(config_path, active_only=False),
        # Codex owns hook trust and does not expose a trustworthy programmatic
        # signal here.  Installer health must not imply that the user reviewed
        # or trusted the exact command definitions.
        "hook_trust": {
            "status": "UNVERIFIED",
            "action": "manual /hooks review and trust required",
        },
    }
    if args.json:
        print(json.dumps(diagnosis, sort_keys=True))
        return 0 if diagnosis["healthy"] else 1
    for name, ok in checks.items():
        print(f"{name.replace('_', ' ')}: {'ok' if ok else 'missing'}")
    print(f"installed version: {diagnosis['installed_version'] or 'missing'}")
    print(f"source version: {source_version}")
    print(f"upgrade available: {'yes' if upgrade_available else 'no'}")
    print(f"local overrides: {len(overrides)}")
    print(f"stale cached installs: {len(stale_cache_versions)}")
    print(
        "hook trust: UNVERIFIED (manual /hooks review and trust required; "
        "installer cannot inspect or grant trust)"
    )
    if shutil.which("codex"):
        codex_result = subprocess.run(
            ["codex", "--version"],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=10,
            check=False,
        )
        print("codex:", codex_result.stdout.strip())
    else:
        print("codex: not found")
    return 0 if diagnosis["healthy"] else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Install Codex Forge into normal Codex user configuration."
    )
    commands = parser.add_subparsers(dest="cmd", required=True)
    install_parser = commands.add_parser("install")
    install_parser.add_argument("--no-tools", action="store_true")
    install_parser.add_argument(
        "--replace",
        "--force",
        action="store_true",
        help="replace locally overridden Forge-managed files",
    )
    install_parser.add_argument(
        "--purge-cache",
        action="store_true",
        help="remove cached Forge plugin versions other than the installed version",
    )
    uninstall_parser = commands.add_parser("uninstall")
    uninstall_parser.add_argument(
        "--purge",
        action="store_true",
        help="remove local overrides, backup history, and all cached Forge installs",
    )
    commands.add_parser("revert")
    doctor_parser = commands.add_parser("doctor")
    doctor_parser.add_argument("--json", action="store_true")
    doctor_parser.add_argument(
        "--purge-cache",
        action="store_true",
        help="remove cached Forge plugin versions other than the source version",
    )
    args = parser.parse_args()
    return {
        "install": install,
        "uninstall": uninstall,
        "revert": revert,
        "doctor": doctor,
    }[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
