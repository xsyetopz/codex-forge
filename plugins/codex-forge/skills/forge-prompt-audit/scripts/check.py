import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
text = (root / "SKILL.md").read_text()
name = root.name
required = ["Use this skill", "Rules", "Steps", "Resources", "Verify"]
headings = re.findall(r"^## (.+)$", text, re.MULTILINE)
assert headings == required, f"heading contract: {headings}"
assert re.search(rf"^name: {re.escape(name)}$", text, re.MULTILINE)
assert "python3 scripts/check.py" in text
assert "UNVERIFIED" in text
for relative in (
    "references/index.md",
    "assets/contract.json",
    "evals/evals.json",
    "agents/openai.yaml",
):
    assert (root / relative).is_file(), f"missing {relative}"
json.loads((root / "assets/contract.json").read_text())
json.loads((root / "evals/evals.json").read_text())
metadata = (root / "agents" / "openai.yaml").read_text()
assert f"${name}" in metadata and "default_prompt:" in metadata
print(f"PASS: {name} package contract")
