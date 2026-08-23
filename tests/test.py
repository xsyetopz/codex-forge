#!/usr/bin/env python3
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import tomllib

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "plugins" / "codex-forge"


def run(cmd, **kw):
    return subprocess.run(
        cmd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
        **kw,
    )


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def hook(event, payload):
    p = subprocess.run(
        [sys.executable, str(P / "scripts" / "hook.py"), event],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=False,
    )
    return p.returncode, p.stdout.strip(), p.stderr


def main():
    manifest = json.loads((P / ".codex-plugin" / "plugin.json").read_text())
    json.loads((P / "hooks.json").read_text())
    mcp = json.loads((P / ".mcp.json").read_text())
    json.loads((ROOT / ".agents" / "plugins" / "marketplace.json").read_text())
    check(manifest.get("version") == "0.1.0-alpha.1", "plugin version")
    check(manifest.get("mcpServers") == "./.mcp.json", "MCP manifest path")
    check(
        mcp.get("mcpServers", {}).get("codegraph")
        == {
            "cwd": ".",
            "command": "python3",
            "args": ["./scripts/codegraph.py", "serve", "--mcp"],
        },
        "CodeGraph MCP fallback configuration",
    )
    base = (P / "assets" / "model-instructions.md").read_text()
    check("Promise.allSettled" in base, "batching guidance missing")
    check("Missing required fact: discover it" in base, "clarification guard missing")
    check("Stay silent during routine" in base, "narration guard missing")
    check("codegraph_explore" in base, "CodeGraph policy missing")
    check("Skills load natively" in base, "native skill-loading rule missing")
    tools_text = (P / "scripts" / "tools.py").read_text()
    check(
        "@colbymchenry/codegraph" in tools_text, "CodeGraph package installer missing"
    )
    check(
        tools_text.index('("bun",')
        < tools_text.index('("pnpm",')
        < tools_text.index('("yarn",')
        < tools_text.index('("npm",'),
        "CodeGraph package-manager preference changed",
    )
    launcher_path = P / "scripts" / "codegraph.py"
    spec = importlib.util.spec_from_file_location("forge_codegraph", launcher_path)
    if spec is None or spec.loader is None:
        raise AssertionError("launcher import failed")
    launcher = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(launcher)
    original_which = launcher.shutil.which
    try:
        cases = [
            ({"bun", "bunx", "pnpm", "pnpx", "yarn", "npx"}, ["bun", "x"]),
            ({"bunx", "pnpm", "yarn", "npx"}, ["bunx"]),
            ({"pnpm", "pnpx", "yarn", "npx"}, ["pnpm", "dlx"]),
            ({"pnpx", "yarn", "npx"}, ["pnpx"]),
            ({"yarn", "npx"}, ["yarn", "dlx"]),
            ({"npx"}, ["npx", "--yes"]),
        ]
        for available, expected_prefix in cases:
            launcher.shutil.which = lambda name, names=available: (
                f"/tools/{name}" if name in names else None
            )
            check(
                launcher.resolve_command()[: len(expected_prefix)] == expected_prefix,
                f"runner preference failed for {expected_prefix[0]}",
            )
    finally:
        launcher.shutil.which = original_which
    review = (P / "skills" / "forge-review" / "SKILL.md").read_text()
    check("inspect the full stated scope" in review, "audit continuation guard missing")
    check(not any(ROOT.rglob("*catalog*")), "catalog must not be distributed")
    skills = list((P / "skills").glob("*/SKILL.md"))
    check(len(skills) == 6, "skill surface must remain consolidated")
    for s in skills:
        txt = s.read_text()
        name = s.parent.name
        check(name.startswith("forge-"), f"bad skill prefix {name}")
        check(f"name: {name}" in txt, "frontmatter name mismatch")
        check(
            [line[3:] for line in txt.splitlines() if line.startswith("## ")]
            == ["Use this skill", "Rules", "Steps", "Resources", "Verify"],
            f"five-heading contract failed for {name}",
        )
        check("python3 scripts/check.py" in txt, f"checker missing for {name}")
        check("UNVERIFIED" in txt, f"evidence limit missing for {name}")
        for relative in (
            "references/index.md",
            "assets/contract.json",
            "evals/evals.json",
            "scripts/check.py",
        ):
            check((s.parent / relative).is_file(), f"missing {relative} for {name}")
        metadata = s.parent / "agents" / "openai.yaml"
        check(metadata.exists(), f"missing openai.yaml for {name}")
        metadata_text = metadata.read_text()
        check("display_name:" in metadata_text, f"missing display name for {name}")
        check(f"${name}" in metadata_text, f"default prompt doesn't select {name}")
    agents = list((P / "agents").glob("forge-*.toml"))
    check(len(agents) >= 9, "agent suite incomplete")
    for a in agents:
        d = tomllib.loads(a.read_text())
        check(d.get("name") == a.stem, "agent name mismatch")
        check(d.get("developer_instructions"), "blank agent instructions")
        check(d.get("service_tier") == "flex", "agent tier")
        check(d.get("agents", {}).get("enabled") is False, "child agents not disabled")
        check(d.get("agents", {}).get("max_depth") == 1, "child recursion not capped")
    r = (P / "assets" / "forge.rules").read_text()
    check('git","push' in r and 'decision="forbidden"' in r, "git push not forbidden")
    # Hook routing is advisory; hard command policy lives in forge.rules.
    _rc, out, _err = hook("SessionStart", {})
    check(
        "Code discovery:" in out and "codegraph_explore" in out,
        "session CodeGraph hint missing",
    )
    _rc, out, _err = hook(
        "PreToolUse",
        {"tool_name": "shell", "tool_input": {"command": ["grep", "-R", "Thing", "."]}},
    )
    check(
        "Use bounded `rg`" in out and "permissionDecision" not in out,
        "shell routing must be advisory",
    )
    _rc, out, _err = hook(
        "PreToolUse", {"tool_name": "spawn_agent", "tool_input": {"message": "x"}}
    )
    check('"permissionDecision": "deny"' in out, "generic spawn not denied")
    _rc, out, _err = hook(
        "PreToolUse",
        {
            "tool_name": "spawn_agent",
            "tool_input": {
                "message": "x",
                "model": "gpt-5.6-luna",
                "reasoning_effort": "high",
                "fork_turns": "none",
            },
        },
    )
    check(out == "", "valid cheap spawn unexpectedly denied")
    # Installer isolated CODEX_HOME.
    with tempfile.TemporaryDirectory() as td:
        home = Path(td) / "codex"
        home.mkdir()
        (home / "config.toml").write_text(
            'foo = "keep"\n\n[features]\nhooks = true\n\n[agents]\nenabled = true\n\n[agents.custom]\ndescription = "keep"\nconfig_file = "/tmp/custom.toml"\n\n[apps._default]\nextra = "keep"\n'
        )
        (home / "agents").mkdir()
        (home / "AGENTS.md").write_text("# Existing user instructions\n")
        preexisting_agent = home / "agents" / "forge-worker.toml"
        preexisting_agent.write_text("# preexisting file\n")
        env = os.environ.copy()
        env["CODEX_HOME"] = str(home)
        p = run(
            [sys.executable, str(ROOT / "install.py"), "install", "--no-tools"], env=env
        )
        check(p.returncode == 0, p.stdout)
        txt = (home / "config.toml").read_text()
        parsed = tomllib.loads(txt)
        check('foo = "keep"' in txt, "unrelated root lost")
        check(parsed["agents"]["enabled"] is True, "unrelated agents key lost")
        check(
            parsed["agents"]["custom"]["description"] == "keep",
            "custom agent registration lost",
        )
        check(
            parsed["apps"]["_default"]["extra"] == "keep", "unrelated app setting lost"
        )
        check("hooks = true" in txt, "unrelated feature lost")
        check('model = "gpt-5.6-sol"' in txt, "root model missing")
        check('approval_policy = "never"' in txt, "no-prompt default missing")
        check(
            "max_concurrent_threads_per_session = 3" in txt, "agent concurrency missing"
        )
        check("[agents.forge-worker]" in txt, "agent registration missing")
        check("[profiles." not in txt, "named profile created")
        check((home / "agents" / "forge-worker.toml").exists(), "agents not installed")
        check((home / "rules" / "forge.rules").exists(), "rules missing")
        check(
            (home / "AGENTS.md").read_text() == "# Existing user instructions\n",
            "Forge modified AGENTS.md",
        )
        state = json.loads((home / "forge" / "install-state.json").read_text())
        mappings = state.get("file_mappings", [])
        check(len(mappings) == 12, "hashed file mapping count")
        check(
            all(x.get("source_sha256") and x.get("installed_sha256") for x in mappings),
            "mapped file hashes missing",
        )
        overridden = home / "agents" / "forge-worker.toml"
        overridden.write_text("# local override\n")
        p = run(
            [sys.executable, str(ROOT / "install.py"), "install", "--no-tools"],
            env=env,
        )
        check(p.returncode == 0, p.stdout)
        check(overridden.read_text() == "# local override\n", "reinstall lost override")
        p = run([sys.executable, str(ROOT / "install.py"), "revert"], env=env)
        check(p.returncode == 0, p.stdout)
        check('name = "forge-worker"' in overridden.read_text(), "revert failed")
        p = run([sys.executable, str(ROOT / "install.py"), "doctor"], env=env)
        check(p.returncode in (0, 1), p.stdout)
        p = run([sys.executable, str(ROOT / "install.py"), "uninstall"], env=env)
        check(p.returncode == 0, p.stdout)
        txt = (home / "config.toml").read_text()
        check(
            txt
            == 'foo = "keep"\n\n[features]\nhooks = true\n\n[agents]\nenabled = true\n\n[agents.custom]\ndescription = "keep"\nconfig_file = "/tmp/custom.toml"\n\n[apps._default]\nextra = "keep"\n',
            "exact config restore failed",
        )
        check(
            preexisting_agent.read_text() == "# preexisting file\n",
            "preexisting mapped file was not restored",
        )
        check(
            (home / "AGENTS.md").read_text() == "# Existing user instructions\n",
            "exact AGENTS restore failed",
        )
    with tempfile.TemporaryDirectory() as td:
        home = Path(td) / "codex"
        home.mkdir()
        agents_path = home / "AGENTS.md"
        agents_path.write_text("# Original\n")
        env = os.environ.copy()
        env["CODEX_HOME"] = str(home)
        p = run(
            [sys.executable, str(ROOT / "install.py"), "install", "--no-tools"], env=env
        )
        check(p.returncode == 0, p.stdout)
        check(agents_path.read_text() == "# Original\n", "install modified AGENTS.md")
        agents_path.write_text("# Original\n# Later user edit\n")
        p = run([sys.executable, str(ROOT / "install.py"), "uninstall"], env=env)
        check(p.returncode == 0, p.stdout)
        check(
            agents_path.read_text() == "# Original\n# Later user edit\n",
            "uninstall modified AGENTS.md",
        )
    # No cf executable/wrapper.
    check(
        not (ROOT / "cf").exists() and not (ROOT / "bin").exists(),
        "cf wrapper binary present",
    )
    print("Codex Forge tests: OK")


if __name__ == "__main__":
    main()
