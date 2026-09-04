# Reinstall and cache recovery

This document records the installer transaction and recovery contract.

Use this guide before changing the Forge marketplace registration, upgrading or
restamping a version, or repairing the installed files. A loaded Codex session
can retain a versioned plugin root while the installer changes the cache.

> **Run recovery commands from a separate macOS Terminal window, not from
> Codex.** This document performs no actions automatically. The user-invoked
> installer command below performs the reinstall and its cache-purge reporting;
> the document itself never terminates processes, purges caches, or reinstalls.

## 1. Close Codex normally

1. Stop work in every Codex CLI terminal, then leave each CLI session with
   `exit` (or `Ctrl-D`). Close Codex integrations in editors as well.
2. Quit the Codex app from its menu. On this Mac the app-server host is the
   `Codex Proxy` application; the observed process names include `Codex Proxy`,
   `Codex Proxy Helper`, `codex`, and `codex-code-mode-host`. Names can differ
   by Codex release, so inspect before acting. [OpenAI documents restarting
   Codex when newly installed skills are not visible](https://developers.openai.com/codex/build-skills);
   the process steps below are local Forge guidance, not an upstream
   termination procedure.

From the separate Terminal, the exact app name observed locally can be asked to
quit normally:

```sh
osascript -e 'tell application "Codex Proxy" to quit'
```

## 2. Verify and, only if necessary, terminate remaining processes

First inspect. This command is read-only:

```sh
ps -axo pid=,ppid=,comm=,args= | grep -E '[c]odex|[C]odex Proxy'
```

If a stale Codex process remains after the normal quit, send `TERM` to the
specific PID printed by the inspection. Do not use `pkill`, `killall`, a
wildcard, or a broad name-based kill:

```sh
kill -TERM <stale-pid>
sleep 2
ps -p <stale-pid> -o pid=,ppid=,comm=,args=
```

Only when that same, individually inspected PID is still present, use the
escalation:

```sh
kill -KILL <stale-pid>
```

Repeat the same full read-only inspection and proceed only when it prints no
Codex CLI/app or `Codex Proxy` app-server process:

```sh
ps -axo pid=,ppid=,comm=,args= | grep -E '[c]odex|[C]odex Proxy'
```

Never kill the invoking shell, the current Codex session, or an unrelated
process merely because its path contains a similar word.

After the reinstall and checks below, relaunch Codex normally and create the
fresh thread; that is the app-server restart boundary for this procedure.

## 3. Upgrade or restamp from the source checkout

From the intended current Forge source checkout, after all sessions and the
app server are closed:

```sh
FORGE_CHECKOUT="/path/to/current/codex-forge"
test -f "$FORGE_CHECKOUT/install.mjs"
cd "$FORGE_CHECKOUT"
bun install --frozen-lockfile
bun install.mjs reinstall
```

The source checkout supplies the assets for the upgrade/restamp. Never use an
installed cache or `install-state.json` as upgrade source; an old state file
alongside a newer cache must not select a version.

The `reinstall` command runs the validated uninstall/purge, supported plugin
removal, exact Forge-cache cleanup, marketplace restamp, plugin add, installer
restamp, and doctor in strict sequence. It checks Codex process liveness before
the first mutation and immediately before every marketplace/plugin mutation.
When active Codex CLI, app, or app-server processes are found, the interactive
command lists them and asks for permission before closing them; use
`reinstall --yes` for the same shutdown boundary in non-interactive automation.
After verified shutdown, reinstall removes the exact Forge cache instead of
emitting the standalone cache-deferral warning. Any failure stops later steps.
`install --purge-cache` remains a diagnostic-safe installer operation whose own
cache deletion is deferred when cross-process ownership cannot be proven.

For inspection only, use:

```sh
bun install.mjs doctor --purge-cache
bun install.mjs doctor --json
```

`doctor --purge-cache` does **not** reinstall or delete caches; it reports the
diagnostic state and cache-retention limitation. Read
[the managed-file lifecycle](../../plugins/codex-forge/skills/forge-setup/references/managed-files.md)
before using `--replace`, `revert`, or uninstall commands.

## 4. External-terminal config verification

From the same external terminal and `FORGE_CHECKOUT`, run:

```sh
bun install.mjs doctor
```

For the V1 surface and config, inspect the doctor report and the installed
catalog (use the default path only when `CODEX_HOME` is unset):

```sh
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
bun install.mjs doctor --json
rg -n 'model_catalog_json|model_instructions_file|multi_agent_v2' \
  "$CODEX_HOME/config.toml"
node -e 'const fs=require("fs"); const p=process.env.CODEX_HOME+"/forge/model-catalog.json"; const c=JSON.parse(fs.readFileSync(p,"utf8")); const wanted=["gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]; if (!wanted.every((slug)=>c.models?.some((m)=>m.slug===slug && m.multi_agent_version==="v1" && m.use_responses_lite===false))) process.exit(1); console.log("Forge V1 catalog: ok")'
```

The expected evidence is a managed `model_catalog_json` pointing at
`$CODEX_HOME/forge/model-catalog.json`, no Forge setting that enables
`features.multi_agent_v2`, and the JSON `models` array containing the Forge
slugs `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna`, each with
`"multi_agent_version": "v1"` and `"use_responses_lite": false`. The final
`doctor` report should also show the current installed/source version and no
Codex CLI compatibility failure: the installed CLI must be version 0.153.1 or
newer, and missing or malformed `codex --version` output is unhealthy. The JSON
and human reports use the same compatibility decision.
unexpected upgrade or override findings. Hook trust remains a manual `/hooks`
check because the installer cannot inspect or grant it.

## 5. Fresh Codex thread checks

These checks run inside the relaunched Codex app and do not depend on shell
variables exported in the external terminal. Start a **fresh Codex thread**,
run `/hooks`, review the exact Forge hook commands, and explicitly trust them.

## 6. Fresh-thread runtime smoke checks

In that fresh thread, ask Codex to run one benign read-only tool call, for
example `pwd` or `git status --short`, and report the result without changing
files. Expected evidence: the call succeeds and the thread shows no
hook-failure event, hook exception, or rejected hook command. `/hooks` remains
the authoritative trust review.

Then run the V1 lifecycle smoke check with a read-only child:

1. Call `multi_agent_v1spawn_agent` for the registered `forge-direct` role
   with `fork_context=false` and a prompt to run `pwd` or `git status --short`
   only, then return its result.
2. Collect that target with `multi_agent_v1wait_agent`.
3. Close the completed target with `multi_agent_v1close_agent`.

The expected evidence is successful spawn, wait, and close events, no child
write, and no hook-failure event. `multi_agent_v1send_input` is available for
an active target when an explicit redirect is needed; it is not required for
this smoke check and must not be sent after close.
