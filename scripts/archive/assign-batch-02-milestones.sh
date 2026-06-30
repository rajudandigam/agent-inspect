#!/usr/bin/env bash
# Maintainer-only: assign OSS Activation Batch 2 milestone to batch 02 issues.
#
# IMPORTANT:
#   Create milestone "OSS Activation Batch 2" manually in GitHub UI first:
#     Repo → Issues → Milestones → New milestone
#   This script does NOT create the milestone automatically.
#   Update ISSUE_NUMBERS below after running create-live-issues-batch-02.sh.
#
# Usage:
#   chmod +x scripts/assign-batch-02-milestones.sh
#   DRY_RUN=1 ./scripts/assign-batch-02-milestones.sh
#   ./scripts/assign-batch-02-milestones.sh

set -euo pipefail

REPO="rajudandigam/agent-inspect"
MILESTONE="OSS Activation Batch 2"
DRY_RUN="${DRY_RUN:-0}"

# Replace with live issue numbers after batch 02 is created (001 → NNN, …, 013 → NNN).
ISSUE_NUMBERS=(
  # 001 first PR walkthrough
  # 002 contributor docs links
  # 003 install smoke test
  # 004 winston recipe
  # 005 MCP fixture
  # 006 vercel manual recipe
  # 007 github actions artifact
  # 008 phoenix import
  # 009 safe trace sharing
  # 010 log ingest cookbook
  # 011 stats fixture pack
  # 012 langchain persisted example
  # 013 vercel adapter design
)

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

if [[ ${#ISSUE_NUMBERS[@]} -eq 0 ]]; then
  echo "No issue numbers configured."
  echo ""
  echo "Steps:"
  echo "  1. Create milestone \"$MILESTONE\" in GitHub UI (Issues → Milestones)."
  echo "  2. Run scripts/create-live-issues-batch-02.sh to open issues."
  echo "  3. Edit ISSUE_NUMBERS in this script with the 13 issue numbers."
  echo "  4. Re-run this script."
  exit 0
fi

echo "Milestone: $MILESTONE"
echo "Repo: $REPO"
echo "Issues: ${ISSUE_NUMBERS[*]}"
echo ""

# Verify milestone exists (informational only — gh issue edit fails if missing)
if [[ "$DRY_RUN" != "1" ]]; then
  if ! gh api "repos/$REPO/milestones" --jq ".[].title" 2>/dev/null | grep -Fxq "$MILESTONE"; then
    echo "Warning: milestone \"$MILESTONE\" not found on $REPO." >&2
    echo "Create it manually: GitHub → Issues → Milestones → New milestone" >&2
    echo "Aborting to avoid partial assignment." >&2
    exit 1
  fi
fi

for num in "${ISSUE_NUMBERS[@]}"; do
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "gh issue edit \"$num\" --repo \"$REPO\" --milestone \"$MILESTONE\""
  else
    echo "--- Setting milestone on #$num"
    gh issue edit "$num" --repo "$REPO" --milestone "$MILESTONE"
  fi
done

if [[ "$DRY_RUN" == "1" ]]; then
  echo ""
  echo "Dry run complete. Create milestone in UI, set ISSUE_NUMBERS, re-run without DRY_RUN=1."
else
  echo ""
  echo "Done."
fi
