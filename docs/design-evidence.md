# Design evidence

This document records the external evidence used for current Forge design choices. It is not injected into every agent turn.

## Adopted principles

- Define observable acceptance criteria and implementation boundaries before mutation. Specifications capture intent and constraints; code and tests remain the executable result. Sources: [Spec Kit](https://github.com/github/spec-kit), [How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/), and [Structured-Prompt-Driven Development](https://martinfowler.com/articles/structured-prompt-driven/).
- Keep prompts reviewable and focused, but place enforceable state transitions in deterministic tools. The TDD-governance paper separates model proposals from validation and mutation authority and emphasizes bounded repair; it also reports that prompt-level enforcement remains incomplete. Source: [TDD Governance for Multi-Agent Code Generation via Prompt Engineering](https://arxiv.org/abs/2604.26615).
- Use graph-derived change impact to choose relevant tests, and treat regression rate as a first-class result. The cited TDAD evaluation reports improvements on two local models and a bounded SWE-bench sample; Forge adopts the mechanism, not a universal performance claim. Source: [TDAD: Test-Driven Agentic Development](https://arxiv.org/abs/2603.17973).
- Keep skill entrypoints concise and link conditional detail directly where a branch needs it. The portable specification defines progressive disclosure, focused one-level references, optional scripts and assets, a 500-line entrypoint recommendation, and the complete frontmatter field set. Sources: [Agent Skills specification](https://agentskills.io/specification) and [OpenAI Build skills](https://developers.openai.com/plugins/build/skills).
- Treat Codex hooks as deterministic lifecycle handlers with runtime-provided JSON input. Scope matchers to canonical tool aliases, cap model-visible context, and preserve manual hash-based trust review for plugin hooks. Source: [OpenAI Codex Hooks](https://learn.chatgpt.com/docs/hooks).
- Use Bun's built-in TOML and YAML parsers for repository runnables instead of adding runtime package dependencies. Sources: [Bun TOML.parse](https://bun.com/reference/bun/TOML/parse) and [Bun YAML](https://bun.com/docs/runtime/yaml).

## Boundaries

Research results are scoped to their reported models, repositories, and harnesses. Prompt structure does not prove behavioral enforcement, graph impact is not a substitute for repository tests, and no cited benchmark percentage is presented as a Forge performance guarantee.
