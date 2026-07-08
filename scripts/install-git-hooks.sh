#!/usr/bin/env bash
# Point this clone at versioned githooks/ (strips Cursor co-author trailers).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT/githooks"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "error: missing $HOOKS_DIR" >&2
  exit 1
fi

chmod +x "$HOOKS_DIR"/*
git -C "$ROOT" config core.hooksPath githooks

echo "Installed git hooks from $HOOKS_DIR"
echo "  core.hooksPath=$(git -C "$ROOT" config --get core.hooksPath)"
echo ""
echo "Also disable Cursor Settings → Agents → Attribution (commit + PR)."
