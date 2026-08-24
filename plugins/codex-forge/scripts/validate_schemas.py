#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "jsonschema==4.25.1",
#   "PyYAML==6.0.2",
# ]
# ///
from __future__ import annotations

import json
from importlib import import_module
from pathlib import Path

jsonschema = import_module("jsonschema")
yaml = import_module("yaml")

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"


def load_json(path: Path):
    return json.loads(path.read_text())


def validate(instance, schema_name: str, label: str) -> None:
    schema = load_json(SCHEMAS / schema_name)
    validator = jsonschema.Draft7Validator(
        schema, format_checker=jsonschema.FormatChecker()
    )
    errors = sorted(validator.iter_errors(instance), key=lambda error: list(error.path))
    if errors:
        details = "\n".join(
            f"- {label}:{'.'.join(map(str, error.path)) or '$'}: {error.message}"
            for error in errors
        )
        raise SystemExit(f"Schema validation failed:\n{details}")


def main() -> None:
    validate(
        load_json(ROOT / "hooks" / "hooks.json"),
        "hooks.json",
        "hooks/hooks.json",
    )
    validate(
        load_json(ROOT / ".codex-plugin" / "plugin.json"),
        "plugin.json",
        "plugin.json",
    )
    metadata_files = sorted((ROOT / "skills").glob("*/agents/openai.yaml"))
    if not metadata_files:
        raise SystemExit("Schema validation failed: no skill metadata found")
    for path in metadata_files:
        validate(
            yaml.safe_load(path.read_text()),
            "skill.json",
            str(path.relative_to(ROOT)),
        )
    print(
        f"Schema validation passed: hooks, plugin manifest, {len(metadata_files)} skills"
    )


if __name__ == "__main__":
    main()
