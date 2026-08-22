<!-- >>> codex-forge:codegraph >>>
## CodeGraph

Use CodeGraph for callers, callees, impact, call paths, and cross-module flow; use `rg` for literal/local lookup.

1. Run `codegraph status . --json`; if indexed, run `codegraph sync .`.
2. Query with `codegraph explore --path . <question>`, `node`, `callers`, `callees`, `impact`, or `affected`.
3. If the binary is missing, use the plugin `scripts/codegraph.py` launcher; it tries Bun, pnpm, Yarn, then npx.

Use CodeGraph MCP only after equivalent CLI execution is unavailable or fails.
Don't run `codegraph init` without explicit authorization; verify decisive graph edges in source.
<!-- <<< codex-forge:codegraph <<< -->
