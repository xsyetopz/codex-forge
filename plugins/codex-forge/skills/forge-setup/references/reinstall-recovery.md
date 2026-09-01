# Reinstall and cache recovery

Use this procedure before changing the Forge marketplace registration,
upgrading or restamping a version, or repairing installed files.

> **Run recovery commands from a separate macOS Terminal window, not from
> Codex.** This reference performs no actions automatically. The user-invoked
> recovery entrypoint performs the fail-closed reinstall and exact Forge-cache
> cleanup.

## Close and verify Codex

1. Stop work in every Codex CLI terminal and leave each session with `exit` or
   `Ctrl-D`. Close editor integrations.
2. Quit the Codex app normally from its menu. On this Mac, observed local
   process names include `Codex Proxy`, `Codex Proxy Helper`, `codex`, and
   `codex-code-mode-host`. These are local observations, not an upstream
   termination guarantee.

```sh
osascript -e 'tell application "Codex Proxy" to quit'
ps -axo pid=,ppid=,comm=,args= | grep -E '[c]odex|[C]odex Proxy'
```

If a stale process remains, use only the individually inspected PID. Try
`TERM`, verify, and escalate to `KILL` only for that same PID. Never use
`pkill`, `killall`, wildcards, or a broad name-based kill, and never kill the
invoking shell or current Codex session.

```sh
kill -TERM <stale-pid>
sleep 2
ps -p <stale-pid> -o pid=,ppid=,comm=,args=
kill -KILL <stale-pid> # only if that exact PID is still present
```

Repeat the same full read-only inspection and proceed only when it prints no
Codex CLI/app or `Codex Proxy` app-server process:

```sh
ps -axo pid=,ppid=,comm=,args= | grep -E '[c]odex|[C]odex Proxy'
```

Never kill the invoking shell, the current Codex session, or an unrelated
process merely because its path contains a similar word.

## Upgrade or restamp from the source checkout

An upgrade or version restamp must use the intended current Forge source
checkout. It must not derive upgrade source from `install-state.json` or a
cached plugin root. In that checkout, verify that `install.mjs` is present and
run one of these commands:

```sh
FORGE_CHECKOUT="/path/to/current/codex-forge"
test -f "$FORGE_CHECKOUT/install.mjs"
cd "$FORGE_CHECKOUT"
unset PLUGIN_ROOT
bun install --frozen-lockfile
bun install.mjs reinstall
```

The source checkout supplies the assets being installed. An installed cached
root is never an upgrade source; an old state file alongside a newer cache is
therefore not allowed to select either version. The `reinstall` command runs
the validated uninstall/purge, supported plugin removal, exact Forge-cache
cleanup, marketplace restamp, plugin add, installer restamp, and doctor in
strict sequence. It checks Codex process liveness before the first mutation and
immediately before every marketplace/plugin mutation. Active Codex CLI, app,
and app-server processes are listed for confirmation before reinstall closes
them; use `reinstall --yes` for non-interactive automation. Verified shutdown
lets reinstall remove the exact Forge cache without the standalone deferral
warning. Any failure stops later steps. Installer-side `--purge-cache` remains
diagnostic-only because cross-process cache ownership cannot be proven.

## Same-version recovery and doctor

For same-version diagnostics only, resolve the installed plugin root from the
cached `forge-setup` skill package. This command is deliberately not an
upgrade/reinstall path:

```sh
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
INSTALLED_VERSION="$(node -e 'const fs=require("fs"); const p=process.env.CODEX_HOME+"/forge/install-state.json"; const s=JSON.parse(fs.readFileSync(p,"utf8")); if (!s.plugin_version) process.exit(1); process.stdout.write(s.plugin_version)')"
test -n "$INSTALLED_VERSION" || { echo 'Forge install state or plugin_version is missing' >&2; exit 1; }
CACHE_MATCHES="$(find "$CODEX_HOME/plugins/cache" -type f -path "*/codex-forge/$INSTALLED_VERSION/skills/forge-setup/references/reinstall-recovery.md")"
test -n "$CACHE_MATCHES" || { echo "no cached Forge root matches installed version $INSTALLED_VERSION" >&2; exit 1; }
test "$(printf '%s\n' "$CACHE_MATCHES" | wc -l | tr -d ' ')" -eq 1 || { echo "ambiguous cached Forge roots for installed version $INSTALLED_VERSION" >&2; exit 1; }
PLUGIN_ROOT="${CACHE_MATCHES%/skills/forge-setup/references/reinstall-recovery.md}"
test -f "$PLUGIN_ROOT/scripts/install.mjs" || { echo 'resolved Forge root has no installer' >&2; exit 1; }
test "$(node -e 'const fs=require("fs"); const p=process.argv[1]; const v=JSON.parse(fs.readFileSync(p+"/.codex-plugin/plugin.json","utf8")).version; process.stdout.write(v)' "$PLUGIN_ROOT")" = "$INSTALLED_VERSION" || { echo 'resolved Forge root version does not match install state' >&2; exit 1; }
export PLUGIN_ROOT
bun "$PLUGIN_ROOT/scripts/install.mjs" doctor --purge-cache
```

`doctor --purge-cache` is diagnostic only; it does not reinstall or delete.
Cache deletion remains deferred when cross-process ownership cannot be proven:

```sh
bun "$PLUGIN_ROOT/scripts/install.mjs" doctor --json
```

## External-terminal config verification

From the same external terminal and `FORGE_CHECKOUT`, inspect the installed
config and catalog:

For the V1 surface, this default-path-safe check must export the fallback path
before the Node process reads it:

```sh
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
rg -n 'model_catalog_json|model_instructions_file|multi_agent_v2' \
  "$CODEX_HOME/config.toml"
bun install.mjs doctor --json
node -e 'const fs=require("fs"); const p=process.env.CODEX_HOME+"/forge/model-catalog.json"; const c=JSON.parse(fs.readFileSync(p,"utf8")); const wanted=["gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]; if (!wanted.every((slug)=>c.models?.some((m)=>m.slug===slug && m.multi_agent_version==="v1" && m.use_responses_lite===false))) process.exit(1); console.log("Forge V1 catalog: ok")'
```

Expected: `model_catalog_json` points at `$CODEX_HOME/forge/model-catalog.json`,
`model_instructions_file` points at `$CODEX_HOME/forge/model-instructions.md`,
`features.multi_agent_v2` is not enabled, and the three Forge JSON model entries
have `"multi_agent_version": "v1"` and `"use_responses_lite": false`.

## Fresh Codex thread checks

These checks run inside the relaunched Codex app and do not depend on shell
variables exported in the external terminal. Start a fresh thread, run
`/hooks`, review the exact Forge hook commands, and explicitly trust them.

In the fresh thread, run one benign read-only tool call such as `pwd` or
`git status --short`; it must succeed with no hook-failure event, exception, or
rejected hook command. Then use a read-only `forge-direct` child for the V1
smoke check: call `multi_agent_v1spawn_agent` with `fork_context=false`, collect
it with `multi_agent_v1wait_agent`, and close it with
`multi_agent_v1close_agent`. Expect successful spawn/wait/close, no child write,
and no hook-failure event. `multi_agent_v1send_input` is available while a
target is active when redirection is required; do not send it after close.
