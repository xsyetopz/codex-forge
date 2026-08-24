---
name: forge-deliver
description: Use this skill when implementing a bounded repository feature or fix, performing a structural refactor, or migrating a dependency. Route unknown root-cause diagnosis to debug and review-only work to review.
license: MIT
---

# Forge Delivery

## Workflow

1. Resolve repository instructions, source owners, callers, consumers, generated-source boundaries, and the narrowest observable success condition.
2. When requirements need an implementation-ready boundary, read [the specification workflow](references/specification.md).
3. For a move, extraction, consolidation, or topology change, read [the structural migration workflow](references/structural-migrations.md). For a package or API version change, read [the dependency migration workflow](references/dependency-migrations.md).
4. Implement through canonical sources and update both sides of every affected contract. Keep the patch within the requested outcome.
5. Validate the narrow behavior first, the affected boundary second, and the repository-required final gate once.
6. Report the observable result, changed paths, commands and exit statuses, and unavailable integration or external evidence.

## Gotchas

- Add an alias, fallback, forwarding wrapper, or compatibility shim only when a supported consumer requires it.
- Preserve the requested major version and verify current upstream guidance before changing a versioned API or dependency.
- Treat tests and generated artifacts as consumers unless repository evidence identifies them as source authority.
- Use `$forge-debug` for unknown causes, `$forge-review` for review-only work, `$forge-setup` for Forge installation, and `$forge-prompt-audit` for instruction ownership.
