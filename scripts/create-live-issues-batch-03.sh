#!/usr/bin/env bash
# Create live GitHub issues from batch 03 body files (post-v3.5.x OSS activation).
#
# Usage:
#   DRY_RUN=1 ./scripts/create-live-issues-batch-03.sh   # print commands (default)
#   GH_APPLY=1 ./scripts/create-live-issues-batch-03.sh  # create issues (manual)
#
# Review all files in .github/LIVE_ISSUE_BATCH_03/ before applying.

set -euo pipefail

REPO="${REPO:-rajudandigam/agent-inspect}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BATCH="$ROOT/.github/LIVE_ISSUE_BATCH_03"
DRY_RUN="${DRY_RUN:-1}"
if [[ "${GH_APPLY:-0}" == "1" ]]; then
  DRY_RUN=0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found." >&2
  exit 1
fi

create_issue() {
  local title="$1"
  local body_file="$2"
  local milestone="${3:-}"
  shift 3

  if [[ ! -f "$body_file" ]]; then
    echo "Error: missing $body_file" >&2
    exit 1
  fi

  local -a extra=("$@")
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "gh issue create --repo \"$REPO\" --title \"$title\" --body-file \"$body_file\" \\"
    for arg in "${extra[@]}"; do echo "  $arg \\"; done
    if [[ -n "$milestone" ]]; then
      echo "  --milestone \"$milestone\" \\"
    fi
    echo ""
    return 0
  fi

  echo "--- Creating: $title"
  local -a cmd=(gh issue create --repo "$REPO" --title "$title" --body-file "$body_file")
  cmd+=("${extra[@]}")
  if [[ -n "$milestone" ]]; then
    cmd+=(--milestone "$milestone")
  fi
  "${cmd[@]}"
}

echo "Repo: $REPO"
echo "Mode: $([[ "$DRY_RUN" == "1" ]] && echo DRY_RUN || echo APPLY)"
echo ""

if [[ "$DRY_RUN" != "1" ]]; then
  echo "Creating 12 issues. Press Enter to continue or Ctrl+C to abort..."
  read -r _
fi

create_issue "Align public roadmap with current release" \
  "$BATCH/031-align-public-roadmap-with-current-release.md" \
  "OSS Hygiene" \
  --label "documentation" --label "roadmap" --label "maintainer-owned"

create_issue "Refresh GOOD-FIRST-ISSUES.md for v3" \
  "$BATCH/032-refresh-good-first-issues-for-v3.md" \
  "OSS Hygiene" \
  --label "documentation" --label "community contribution" --label "good first issue"

create_issue "Minimal adapter SDK third-party example" \
  "$BATCH/033-minimal-adapter-sdk-third-party-example.md" \
  "Adapter SDK Examples" \
  --label "examples" --label "help wanted" --label "adapter"

create_issue "Adapter SDK privacy checklist example" \
  "$BATCH/034-adapter-sdk-privacy-checklist-example.md" \
  "Adapter SDK Examples" \
  --label "documentation" --label "security" --label "adapter"

create_issue "Custom renderer example (adapter SDK)" \
  "$BATCH/035-custom-renderer-example.md" \
  "Adapter SDK Examples" \
  --label "examples" --label "help wanted" --label "adapter"

create_issue "Custom transform example (adapter SDK)" \
  "$BATCH/036-custom-transform-example.md" \
  "Adapter SDK Examples" \
  --label "examples" --label "help wanted" --label "adapter"

create_issue "Extension registry submission template" \
  "$BATCH/037-extension-registry-submission-template.md" \
  "Adapter SDK Examples" \
  --label "documentation" --label "community contribution" --label "good first issue" --label "adapter"

create_issue "VS Code extension onboarding screenshots/GIF" \
  "$BATCH/038-vscode-extension-onboarding-screenshots.md" \
  "UI and Performance Polish" \
  --label "documentation" --label "good first issue"

create_issue "VS Code: open sample trace command" \
  "$BATCH/039-vscode-open-sample-trace-command.md" \
  "UI and Performance Polish" \
  --label "enhancement" --label "help wanted"

create_issue "Improve doctor troubleshooting messages" \
  "$BATCH/040-improve-doctor-troubleshooting-messages.md" \
  "OSS Hygiene" \
  --label "cli" --label "good first issue"

create_issue "Performance fixture pack" \
  "$BATCH/041-performance-fixture-pack.md" \
  "UI and Performance Polish" \
  --label "fixtures" --label "testing" --label "help wanted"

create_issue "Streaming limitations examples (verify and expand)" \
  "$BATCH/042-streaming-limitations-examples.md" \
  "Examples and Fixtures" \
  --label "documentation" --label "examples" --label "langchain" --label "roadmap-next"

echo ""
echo "If --milestone fails, create milestones first:"
echo "  GH_APPLY=1 ./scripts/github-milestones-v3-oss.sh"
echo "Then re-run with milestone flags or set milestones in GitHub UI."
