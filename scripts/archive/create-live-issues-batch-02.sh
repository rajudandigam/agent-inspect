#!/usr/bin/env bash
# Maintainer-only: create live GitHub issues from batch 02 body files.
#
# IMPORTANT — review before running:
#   Read every markdown file in .github/LIVE_ISSUE_BATCH_02/ for accuracy.
#   Confirm labels already exist on the repo (create manually in GitHub UI).
#   Do not run from CI. Do not bulk-open if >15 active good-first issues.
#
# Usage:
#   chmod +x scripts/create-live-issues-batch-02.sh
#   DRY_RUN=1 ./scripts/create-live-issues-batch-02.sh   # print commands only
#   ./scripts/create-live-issues-batch-02.sh             # create issues (manual)

set -euo pipefail

REPO="rajudandigam/agent-inspect"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BATCH="$ROOT/.github/LIVE_ISSUE_BATCH_02"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found. Install https://cli.github.com/" >&2
  exit 1
fi

if [[ "$DRY_RUN" != "1" ]]; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "Error: gh is not authenticated. Run: gh auth login" >&2
    exit 1
  fi
fi

create_issue() {
  local title="$1"
  local body_file="$2"
  shift 2

  if [[ ! -f "$body_file" ]]; then
    echo "Error: body file not found: $body_file" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "gh issue create \\"
    echo "  --repo \"$REPO\" \\"
    echo "  --title \"$title\" \\"
    echo "  --body-file \"$body_file\" \\"
    for arg in "$@"; do
      echo "  $arg \\"
    done
    echo ""
    return 0
  fi

  echo "--- Creating: $title"
  local url
  url=$(gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body-file "$body_file" \
    "$@")
  echo "Created: $url"
}

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY RUN — commands only (no issues will be created)"
  echo "Repo: $REPO"
  echo "Batch: $BATCH"
  echo ""
else
  echo "Creating 13 issues on $REPO from $BATCH"
  echo "Press Enter to continue or Ctrl+C to abort..."
  read -r _
fi

create_issue "Add first PR walkthrough for new contributors" \
  "$BATCH/001-add-first-pr-walkthrough.md" \
  --label "good first issue" --label "documentation" --label "community contribution"

create_issue "Update contributor docs with live issue links" \
  "$BATCH/002-update-contributor-docs-with-live-issue-links.md" \
  --label "good first issue" --label "documentation" --label "community contribution"

create_issue "Add clean install smoke-test guide" \
  "$BATCH/003-add-clean-install-smoke-test-guide.md" \
  --label "documentation" --label "testing" --label "package-compatibility"

create_issue "Add Winston structured logging recipe" \
  "$BATCH/004-add-winston-structured-logging-recipe.md" \
  --label "good first issue" --label "examples" --label "logging"

create_issue "Add MCP tool-call trace fixture" \
  "$BATCH/005-add-mcp-tool-call-trace-fixture.md" \
  --label "fixtures" --label "examples" --label "roadmap-next"

create_issue "Add Vercel AI SDK manual instrumentation recipe" \
  "$BATCH/006-add-vercel-ai-sdk-manual-instrumentation-recipe.md" \
  --label "examples" --label "adapter" --label "roadmap-next"

create_issue "Add GitHub Actions trace artifact recipe" \
  "$BATCH/007-add-github-actions-trace-artifact-recipe.md" \
  --label "examples" --label "testing" --label "roadmap-next"

create_issue "Add Phoenix/OpenInference import recipe" \
  "$BATCH/008-add-phoenix-openinference-import-recipe.md" \
  --label "exports" --label "documentation" --label "roadmap-next"

create_issue "Add safe trace sharing checklist" \
  "$BATCH/009-add-safe-trace-sharing-checklist.md" \
  --label "good first issue" --label "documentation" --label "security"

create_issue "Add log ingest config cookbook" \
  "$BATCH/010-add-log-ingest-config-cookbook.md" \
  --label "good first issue" --label "documentation" --label "logging"

create_issue "Add multi-run fixture pack for future stats command" \
  "$BATCH/011-add-multi-run-fixture-pack-for-stats.md" \
  --label "fixtures" --label "testing" --label "roadmap-next"

create_issue "Add LangChain persisted trace example" \
  "$BATCH/012-add-langchain-persisted-trace-example.md" \
  --label "examples" --label "langchain" --label "adapter"

create_issue "Add Vercel AI SDK adapter design note" \
  "$BATCH/013-add-vercel-ai-sdk-adapter-design-note.md" \
  --label "help wanted" --label "adapter" --label "roadmap-future"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run complete. Re-run without DRY_RUN=1 to create issues."
  echo "Then run DRY_RUN=1 scripts/assign-batch-02-milestones.sh to preview milestone assignment."
else
  echo ""
  echo "Done. Update GOOD-FIRST-ISSUES.md with live issue numbers."
  echo "Optional: scripts/assign-batch-02-milestones.sh (after creating milestone in GitHub UI)"
  echo "List open issues: gh issue list --repo $REPO"
fi
