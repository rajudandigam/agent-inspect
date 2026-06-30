#!/usr/bin/env bash
# Create or verify v3 OSS contribution milestones on GitHub.
#
# Usage:
#   DRY_RUN=1 ./scripts/github-milestones-v3-oss.sh   # print only (default)
#   GH_APPLY=1 ./scripts/github-milestones-v3-oss.sh  # create missing milestones
#
# Requires: gh CLI authenticated with repo scope.

set -euo pipefail

REPO="${REPO:-rajudandigam/agent-inspect}"
DRY_RUN="${DRY_RUN:-1}"
if [[ "${GH_APPLY:-0}" == "1" ]]; then
  DRY_RUN=0
fi

MILESTONES=(
  "OSS Hygiene|Contributor docs, onboarding, roadmap alignment, doctor messages"
  "Examples and Fixtures|Recipes, fixtures, cookbooks, streaming docs"
  "Adapter SDK Examples|Third-party adapter examples, privacy checklist, transforms/renderers"
  "UI and Performance Polish|VS Code docs, performance fixtures, viewer polish"
  "Standards and Graduation|OpenInference/OTLP fixtures, Phoenix import guides, export conformance"
)

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found." >&2
  exit 1
fi

existing_titles() {
  gh api "repos/${REPO}/milestones?state=all&per_page=100" --jq '.[].title' 2>/dev/null || true
}

EXISTING="$(existing_titles)"

create_milestone() {
  local title="$1"
  local description="$2"
  if echo "$EXISTING" | grep -Fxq "$title"; then
    echo "[milestones] exists: $title"
    return 0
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "gh api --method POST repos/${REPO}/milestones -f title=\"${title}\" -f description=\"${description}\""
    return 0
  fi
  gh api --method POST "repos/${REPO}/milestones" \
    -f title="$title" \
    -f description="$description" \
    -f state="open" >/dev/null
  echo "[milestones] created: $title"
}

echo "Repo: $REPO"
echo "Mode: $([[ "$DRY_RUN" == "1" ]] && echo DRY_RUN || echo APPLY)"
echo ""

for entry in "${MILESTONES[@]}"; do
  title="${entry%%|*}"
  desc="${entry#*|}"
  create_milestone "$title" "$desc"
done

echo ""
echo "Manual fallback (GitHub UI): Issues → Milestones → New milestone"
echo "Create titles: OSS Hygiene, Examples and Fixtures, Adapter SDK Examples,"
echo "UI and Performance Polish, Standards and Graduation"
