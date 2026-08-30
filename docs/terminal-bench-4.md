# Terminal-Bench 4.0 evaluation harness

This harness separates deterministic packaging and no-inference checks from
paid Harbor launches. The benchmark dataset is `terminal-bench/terminal-bench@4.0`.
The first environment probe is intentionally preserved as the first command:

```sh
codex --version
# codex-cli 0.151.0
```

## Portable Forge package

Build a package that projects all absolute-path Forge inputs into Harbor's
`CODEX_HOME` layout, including model instructions, compact prompt, model
catalog, rules, global `AGENTS.md`, developer instructions, role TOML files,
the complete plugin tree, skills, hooks, scripts, schemas, and MCP metadata:

```sh
bun plugins/codex-forge/scripts/benchmark/package.mjs \
  --source "$PWD" \
  --output "$PWD/benchmark-artifacts/terminal-bench-4.0/forge-package"
sh benchmark-artifacts/terminal-bench-4.0/forge-package/install-portable.sh
```

The generated `manifest.json` records SHA-256 digests and the fixed 17-cell
matrix. The portable installer is the only writer of the temporary benchmark
`CODEX_HOME`; it does not modify the user's installed Codex home.

The generated **local** matrix uses the checked-in [`ForgeCodex`](../benchmarks/harbor/forge_codex.py) Harbor adapter, because Harbor's
stock Codex adapter uploads only config and selected skills. `ForgeCodex`
uploads the complete package before delegating to the stock Codex execution
lifecycle. Harbor hosted workers do not receive this checkout path; publishing
the adapter/package to an accessible remote source would be an external write,
so hosted execution remains blocked until that transport is authorized.

## No-charge local preflight

This runs `codex --version`, installs the package into a temporary home, and
only invokes `codex exec --help`; it performs no inference and no Harbor job:

```sh
bun plugins/codex-forge/scripts/benchmark/preflight.mjs \
  benchmark-artifacts/terminal-bench-4.0/forge-package
```

## Hosted dry-run (command shape only; not authenticated)

Harbor's `--launch --dry-run` is the intended no-charge hosted validation. The
command shape below is not an authenticated validation. A prior stock-adapter
probe reached Harbor's authentication check; no hosted task/model validation was
completed because Harbor reported
`Not authenticated. Please run harbor auth login first.`
The generated local adapter and package paths are not remotely accessible to a
Harbor worker without publishing them, so this remains a source-transport
blocker rather than a claimed hosted result.

```sh
export FORGE_CHECKOUT="$PWD"
export FORGE_PACKAGE="$PWD/benchmark-artifacts/terminal-bench-4.0/forge-package"
uvx harbor run --launch --dry-run \
  -d terminal-bench/terminal-bench@4.0 \
  --agent "$FORGE_CHECKOUT/benchmarks/harbor/forge_codex.py:ForgeCodex" \
  --model gpt-5.6-sol \
  --ak config="$FORGE_PACKAGE/config.toml" \
  --ae CODEX_FORGE_PACKAGE="$FORGE_PACKAGE" \
  --ak reasoning_effort=xhigh --ak reasoning_summary=none \
  --n-tasks 330 --n-concurrent 8
```

This is a Harbor dry-run shape for a future remotely transported package; it
must not be described as a successful hosted run until the adapter/package are
made available to the worker and Harbor authentication is separately verified.

Observed no-charge dry-run evidence is limited to Harbor job IDs
`2026-08-30__16-15-28` (stock adapter probe) and `2026-08-30__16-33-29`
(Forge adapter/package shape); both stopped at Harbor's unauthenticated check.
Neither job authenticated, executed a task, or validates Forge behavior.

## Representative pilot and cost gate

The smallest representative hosted pilot is one task/trial for one selected
cell, for example Sol/xhigh:

```sh
uvx harbor run --launch --dry-run \
  -d terminal-bench/terminal-bench@4.0 \
  --agent "$FORGE_CHECKOUT/benchmarks/harbor/forge_codex.py:ForgeCodex" \
  --model gpt-5.6-sol \
  --ak config="$FORGE_PACKAGE/config.toml" \
  --ae CODEX_FORGE_PACKAGE="$FORGE_PACKAGE" \
  --ak reasoning_effort=xhigh --ak reasoning_summary=none \
  --n-tasks 1 --n-concurrent 1
```

The corresponding paid pilot changes only `--launch --dry-run` to `--launch`
and requires explicit authorization outside this workstream. Its maximum
benchmark charge is one Terminal-Bench trial's provider/account cost. The full
matrix is 5,610 trials, so its maximum inference charge is `5,610 ×` that
same per-trial accounting rate (plus any Harbor/provider fees); exact dollars
cannot be computed from this checkout without the authenticated account's
current pricing and token usage. No paid pilot or full launch was submitted.

The generated matrix is 17 cells and 5,610 trials:

```sh
export FORGE_CHECKOUT="$PWD"
export FORGE_PACKAGE="$PWD/benchmark-artifacts/terminal-bench-4.0/forge-package"
bun plugins/codex-forge/scripts/benchmark/launch-matrix.mjs \
  benchmark-artifacts/terminal-bench-4.0
```

The generated `local-matrix.sh` runs Harbor locally without `--launch`, while
retaining the explicit `FORGE_BENCHMARK_CONFIRM=I_AUTHORIZE_5610_PAID_TRIALS`
gate because local inference still consumes model quota. The generated
`dry-run-matrix.sh` is hosted validation shape only and performs no inference.

Before any Harbor run, perform the no-inference adapter setup smoke:

```sh
bun plugins/codex-forge/scripts/benchmark/adapter-smoke.mjs
```

The generated launcher refuses to run unless the caller sets
`FORGE_BENCHMARK_CONFIRM=I_AUTHORIZE_5610_PAID_TRIALS`. No paid launch is
authorized by this repository change.

For a no-charge hosted validation of all 17 cells, use the generated local
`dry-run-matrix.sh` only after the adapter/package has been made remotely
accessible. It retains Harbor's `--launch --dry-run` flag and does not queue
trials or require the paid confirmation variable.

## Effort interpretation

The matrix is deliberate acceptance input: Sol uses xhigh/high/medium/low/none;
Terra and Luna use max/xhigh/high/medium/low/none. This is a Codex 0.151.0
catalog experiment, not a claim that these aliases are public GPT-5.6 API model
IDs or that API effort validation implies Codex catalog acceptance. The local
preflight verifies Codex 0.151.0 startup/config loading and package references;
it does not make inference calls. Sol `max` is omitted because the user
specified that matrix, not because this harness inferred a model limitation.

Matrix cells:

| Model | Efforts | Cells | Trials |
| --- | --- | ---: | ---: |
| Sol | xhigh, high, medium, low, none | 5 | 1,650 |
| Terra | max, xhigh, high, medium, low, none | 6 | 1,980 |
| Luna | max, xhigh, high, medium, low, none | 6 | 1,980 |
| **Total** | | **17** | **5,610** |

Dollar cost remains provider/account dependent. The matrix fixes trial count;
actual inference cost must be obtained from Harbor/provider accounting after an
explicitly authorized pilot or full run.
