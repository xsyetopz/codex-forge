"""Harbor Codex adapter that uploads the complete portable Forge package."""

import json
from hashlib import sha256
from importlib import import_module
from pathlib import Path, PurePosixPath
from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:

    class Codex:
        _REMOTE_CODEX_HOME: str

        def _get_env(self, name: str) -> str | None: ...

        async def run(
            self,
            instruction: str,
            environment: "BaseEnvironment",
            context: "AgentContext",
        ) -> None: ...

    class BaseEnvironment(Protocol):
        async def upload_file(self, path: Path, remote: str) -> None: ...

    class AgentContext(Protocol):
        pass

else:
    Codex = import_module("harbor.agents.installed.codex").Codex
    BaseEnvironment = import_module("harbor.environments.base").BaseEnvironment
    AgentContext = import_module("harbor.models.agent.context").AgentContext


class ForgeCodex(Codex):
    """Codex adapter with deterministic Forge CODEX_HOME projection."""

    async def run(
        self, instruction: str, environment: BaseEnvironment, context: AgentContext
    ) -> None:
        package = self._get_env("CODEX_FORGE_PACKAGE")
        if not package:
            raise ValueError("CODEX_FORGE_PACKAGE is required for ForgeCodex")
        root = Path(package)
        if (
            not (root / "config.toml").is_file()
            or not (root / "manifest.json").is_file()
        ):
            raise ValueError(f"invalid portable Forge package: {root}")
        manifest = json.loads((root / "manifest.json").read_text())
        entries = manifest["uploaded_files"]
        declared = {item["path"]: item["sha256"] for item in entries}
        if len(declared) != len(entries):
            raise ValueError("portable package manifest contains duplicate paths")
        for relative in declared:
            path = PurePosixPath(relative)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError(f"manifest path escapes root: {relative}")
        actual_paths = set()
        for path in root.rglob("*"):
            if path.is_symlink():
                raise ValueError(f"symlink is not allowed in portable package: {path}")
            if not path.is_file() or path.name == "manifest.json":
                continue
            relative = path.relative_to(root).as_posix()
            if (
                PurePosixPath(relative).is_absolute()
                or ".." in PurePosixPath(relative).parts
            ):
                raise ValueError(f"package path escapes root: {relative}")
            actual_paths.add(relative)
            if declared.get(relative) != sha256(path.read_bytes()).hexdigest():
                raise ValueError(f"package digest mismatch: {relative}")
            await environment.upload_file(path, f"{self._REMOTE_CODEX_HOME}/{relative}")
        if actual_paths != set(declared):
            raise ValueError("portable package contains undeclared or missing files")
        await super().run(instruction, environment, context)
