#!/usr/bin/env bash
# Maintainer-only: create live GitHub issues from batch 01 body files.
#
# IMPORTANT — review before running:
#   Read every markdown file in .github/LIVE_ISSUE_BATCH_01/ for accuracy
#   after 1.1.0. Confirm labels already exist on the repo. Do not run from CI.
#
# Usage:
#   chmod +x scripts/create-live-issues-batch-01.sh
#   DRY_RUN=1 ./scripts/create-live-issues-batch-01.sh   # print commands only
#   ./scripts/create-live-issues-batch-01.sh             # create issues (manual)

set -euo pipefail

REPO="rajudandigam/agent-inspect"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BATCH="$ROOT/.github/LIVE_ISSUE_BATCH_01"
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
  echo "Creating 8 issues on $REPO from $BATCH"
  echo "Press Enter to continue or Ctrl+C to abort..."
  read -r _
fi

create_issue "Add OpenInference export fixture" \
  "$BATCH/001-add-openinference-export-fixture.md" \
  --label "good first issue" --label "fixtures" --label "exports" --label "testing"

create_issue "Improve diff CLI output examples" \
  "$BATCH/002-improve-diff-cli-output-examples.md" \
  --label "good first issue" --label "documentation" --label "cli" --label "examples"

create_issue "Add AgentInspect vs production observability comparison" \
  "$BATCH/003-add-agentinspect-vs-production-observability-comparison.md" \
  --label "good first issue" --label "documentation" --label "roadmap-now"

create_issue "Add tool failure + retry fixture" \
  "$BATCH/004-add-tool-failure-retry-fixture.md" \
  --label "good first issue" --label "fixtures" --label "examples"

create_issue "Timeline command proposal" \
  "$BATCH/005-timeline-command-proposal.md" \
  --label "help wanted" --label "cli" --label "roadmap-next"

create_issue "Stats command proposal" \
  "$BATCH/006-stats-command-proposal.md" \
  --label "help wanted" --label "cli" --label "roadmap-next"

create_issue "Decision metadata recipe" \
  "$BATCH/007-decision-metadata-recipe.md" \
  --label "examples" --label "documentation" --label "roadmap-next"

create_issue "Persisted LangChain streaming design" \
  "$BATCH/008-persisted-langchain-streaming-design.md" \
  --label "langchain" --label "adapter" --label "roadmap-next" --label "maintainer-owned"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run complete. Re-run without DRY_RUN=1 to create issues."
else
  echo ""
  echo "Done. Update GOOD-FIRST-ISSUES.md with live issue numbers."
  echo "List open issues: gh issue list --repo $REPO"
fi
