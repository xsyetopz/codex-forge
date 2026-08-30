# Recovery recipes must run in a separate terminal after every Codex session
# and the Codex app server have been closed. They delegate to install.mjs.

set shell := ["zsh", "-cu"]

default:
    @just --list

doctor:
    bun install.mjs doctor

doctor-json:
    bun install.mjs doctor --json

reinstall:
    @echo 'Run this from an external terminal only, after closing Codex CLI/app sessions and the Codex app server.'
    bun install.mjs reinstall
