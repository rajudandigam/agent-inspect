#!/usr/bin/env bash
# Close GitHub issues superseded by v3.x implementation.
#
# Usage:
#   DRY_RUN=1 ./scripts/close-stale-issues-v3-oss.sh   # print commands (default)
#   GH_APPLY=1 ./scripts/close-stale-issues-v3-oss.sh  # comment + close
#
# Close notes: .github/ISSUE_CLOSE_NOTES_V3_OSS/

set -euo pipefail

REPO="${REPO:-rajudandigam/agent-inspect}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTES="$ROOT/.github/ISSUE_CLOSE_NOTES_V3_OSS"
DRY_RUN="${DRY_RUN:-1}"
if [[ "${GH_APPLY:-0}" == "1" ]]; then
  DRY_RUN=0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found." >&2
  exit 1
fi

close_issue() {
  local num="$1"
  local note_file="$2"
  if [[ ! -f "$note_file" ]]; then
    echo "Error: missing $note_file" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "gh issue comment $num --repo $REPO --body-file $note_file"
    echo "gh issue close $num --repo $REPO --reason completed"
    echo ""
    return 0
  fi

  echo "--- Closing #$num"
  gh issue comment "$num" --repo "$REPO" --body-file "$note_file"
  gh issue close "$num" --repo "$REPO" --reason completed
}

echo "Repo: $REPO"
echo "Mode: $([[ "$DRY_RUN" == "1" ]] && echo DRY_RUN || echo APPLY)"
echo ""

close_issue 11 "$NOTES/011-close-timeline-command-proposal.md"
close_issue 12 "$NOTES/012-close-stats-command-proposal.md"
close_issue 14 "$NOTES/014-close-langchain-streaming-design.md"
close_issue 23 "$NOTES/023-close-ai-sdk-manual-recipe.md"
close_issue 24 "$NOTES/024-close-github-actions-artifact-recipe.md"
close_issue 30 "$NOTES/030-close-ai-sdk-adapter-design.md"

echo "Done. Issue #28 is refreshed (not closed) — see #041 performance fixture pack draft."
