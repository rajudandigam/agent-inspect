#!/usr/bin/env bash
# Maintainer-only: create live GitHub issues from batch 01 body files.
# DO NOT run from CI. Review issue bodies first, then run manually:
#   chmod +x scripts/create-live-issues-batch-01.sh
#   ./scripts/create-live-issues-batch-01.sh
#
# Requires: gh CLI authenticated with issue create permission
# Repo: rajudandigam/agent-inspect (override with GITHUB_REPOSITORY)

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-rajudandigam/agent-inspect}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BATCH="$ROOT/.github/LIVE_ISSUE_BATCH_01"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found. Install https://cli.github.com/" >&2
  exit 1
fi

echo "Creating issues on $REPO from $BATCH"
echo "Press Enter to continue or Ctrl+C to abort..."
read -r _

create_issue() {
  local title="$1"
  shift
  local body_file="$1"
  shift
  echo "--- Creating: $title"
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body-file "$body_file" \
    "$@"
}

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

echo ""
echo "Done. Update GOOD-FIRST-ISSUES.md with live issue numbers."
echo "List open issues: gh issue list --repo $REPO"
