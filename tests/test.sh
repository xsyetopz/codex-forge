#!/usr/bin/env sh
set -eu
python3 "$(dirname "$0")/test.py"
UV_CACHE_DIR="${TMPDIR:-/tmp}/codex-forge-uv-cache" \
  uv run "$(dirname "$0")/../plugins/codex-forge/scripts/validate_schemas.py"
