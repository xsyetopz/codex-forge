from __future__ import annotations

import hashlib
import shutil
import sys
from pathlib import Path


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def managed_file_pairs(home: Path, plugin_root: Path) -> list[tuple[Path, Path]]:
    forge, agents, rules = home / "forge", home / "agents", home / "rules"
    pairs = [
        (plugin_root / "assets" / name, forge / name)
        for name in ("model-instructions.md", "compact-prompt.md")
    ]
    pairs.extend(
        (source, agents / source.name)
        for source in sorted((plugin_root / "agents").glob("forge-*.toml"))
    )
    pairs.append((plugin_root / "assets" / "forge.rules", rules / "forge.rules"))
    return pairs


def install_files(
    home: Path,
    plugin_root: Path,
    backup: Path,
    prior_state: dict,
    *,
    force: bool = False,
) -> list[dict]:
    prior = {item["target"]: item for item in prior_state.get("file_mappings", [])}
    mappings = []
    for index, (source, target) in enumerate(managed_file_pairs(home, plugin_root)):
        target.parent.mkdir(parents=True, exist_ok=True)
        old = prior.get(str(target))
        overridden = bool(
            old and target.exists() and file_sha(target) != old.get("installed_sha256")
        )
        if old:
            previous_existed = old.get("previous_existed", False)
            previous_backup = old.get("previous_backup")
        else:
            previous_existed, previous_backup = target.exists(), None
            if previous_existed:
                saved = backup / "files" / f"{index:03d}-{target.name}"
                saved.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, saved)
                previous_backup = str(saved)
        if overridden and not force:
            print(f"[cf] preserving local override: {target}", file=sys.stderr)
        else:
            shutil.copy2(source, target)
        mappings.append(
            {
                "source": str(source.relative_to(plugin_root)),
                "target": str(target),
                "source_sha256": file_sha(source),
                "installed_sha256": (old or {}).get("installed_sha256")
                if overridden and not force
                else file_sha(target),
                "previous_existed": previous_existed,
                "previous_backup": previous_backup,
            }
        )
    return mappings


def uninstall_files(home: Path, state: dict, *, force: bool = False) -> None:
    mappings = state.get("file_mappings", [])
    if mappings:
        for item in mappings:
            target = Path(item["target"])
            if (
                not force
                and target.exists()
                and file_sha(target) != item.get("installed_sha256")
            ):
                print(f"[cf] preserving local override during uninstall: {target}")
                continue
            previous = item.get("previous_backup")
            if item.get("previous_existed") and previous and Path(previous).exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(previous, target)
            else:
                target.unlink(missing_ok=True)
        return
    for path in state.get("files", []):
        target = Path(path)
        if target.exists() and (
            target.name.startswith("forge-")
            or target.name
            in {"forge.rules", "model-instructions.md", "compact-prompt.md"}
        ):
            target.unlink()
    if (home / "agents").exists():
        for target in (home / "agents").glob("forge-*.toml"):
            target.unlink()


def revert_files(plugin_root: Path, mappings: list[dict]) -> int:
    for item in mappings:
        source, target = plugin_root / item["source"], Path(item["target"])
        if not source.is_file():
            raise FileNotFoundError(f"mapped source is missing: {source}")
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        item["source_sha256"] = file_sha(source)
        item["installed_sha256"] = file_sha(target)
    return len(mappings)
