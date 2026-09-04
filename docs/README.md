# Codex Forge documentation

This directory separates product contracts, upstream evidence, community
observations, and raw source captures. Product behavior is implemented by the
plugin, installer, configuration, and tests; documentation explains those
surfaces and records why they exist.

## Canonical routes

| Need | Read |
| --- | --- |
| Install, doctor, revert, or uninstall | [README](../README.md) and [managed-file lifecycle](../plugins/codex-forge/skills/forge-setup/references/managed-files.md) |
| Forge architecture and ownership | [architecture](architecture.md) |
| Exact Codex CLI 0.153.1 capability baseline | [Codex CLI 0.153.1 capability delta](evidence/codex-cli-0.153.1.md) and [0.152.0 source audit](evidence/codex-cli-0.152.0.md) |
| GPT-5.6 prompt and model-instruction rationale | [model instruction contract](evidence/model-instructions.md) |
| Local session observations | [session evidence](evidence/session-observations.md) |
| Reddit observations | [community evidence](evidence/community-observations.md) and immutable captures under [`reddit/`](reddit/) |
| External harness and academic prior art | [research synthesis](evidence/research-synthesis.md) |
| Failure shape to enforcing owner | [failure controls](reference/failure-controls.md) |
| Compaction behavior | [compaction](operations/compaction.md) |

## Evidence classes

- **Upstream source:** pinned source code, release notes, or official OpenAI
  documentation. These establish supported behavior for the named version.
- **Repository contract:** Forge code and tests. These establish Forge behavior.
- **Observation:** a local session or community report. These motivate a test or
  bounded hypothesis; they do not establish universal model behavior.
- **Prior art:** external engineering or research work. Transfer into Forge is
  explicitly labeled as an inference and validated locally.

Files under `docs/reddit/` are immutable source captures. Forge documentation
may cite or summarize them, while edits belong in the surrounding evidence
documents.
