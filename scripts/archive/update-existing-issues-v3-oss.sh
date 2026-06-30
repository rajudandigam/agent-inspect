#!/usr/bin/env bash
# Refresh open GitHub issues for post-v3.5.x OSS roadmap.
#
# Usage:
#   DRY_RUN=1 ./scripts/update-existing-issues-v3-oss.sh   # print gh commands (default)
#   GH_APPLY=1 ./scripts/update-existing-issues-v3-oss.sh # apply edits
#
# Body files: .github/ISSUE_UPDATES_V3_OSS/bodies/*.md
# Metadata:   .github/ISSUE_UPDATES_V3_OSS/*-refresh-*.md

set -euo pipefail

REPO="${REPO:-rajudandigam/agent-inspect}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPDATES="$ROOT/.github/ISSUE_UPDATES_V3_OSS"
BODIES="$UPDATES/bodies"
DRY_RUN="${DRY_RUN:-1}"
if [[ "${GH_APPLY:-0}" == "1" ]]; then
  DRY_RUN=0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found." >&2
  exit 1
fi

milestone_number() {
  local title="$1"
  gh api "repos/${REPO}/milestones?state=all&per_page=100" \
    --jq ".[] | select(.title==\"${title}\") | .number" 2>/dev/null | head -1 || true
}

apply_update() {
  local num="$1"
  local title="$2"
  local body_file="$3"
  local labels_str="$4"
  local milestone_name="${5:-}"

  local -a cmd=(gh issue edit "$num" --repo "$REPO" --title "$title" --body-file "$body_file")
  local label
  local IFS=','
  read -ra label_arr <<< "$labels_str"
  for label in "${label_arr[@]}"; do
    label="${label#"${label%%[![:space:]]*}"}"
    label="${label%"${label##*[![:space:]]}"}"
    [[ -n "$label" ]] && cmd+=(--add-label "$label")
  done
  unset IFS

  if [[ -n "$milestone_name" ]]; then
    local ms_num
    ms_num="$(milestone_number "$milestone_name")"
    if [[ -n "$ms_num" ]]; then
      cmd+=(--milestone "$milestone_name")
    else
      echo "# NOTE: milestone '${milestone_name}' not found — set manually in GitHub UI"
    fi
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    printf '%q ' "${cmd[@]}"
    echo ""
    return 0
  fi

  echo "--- Updating #$num: $title"
  "${cmd[@]}"
}

echo "Repo: $REPO"
echo "Mode: $([[ "$DRY_RUN" == "1" ]] && echo DRY_RUN || echo APPLY)"
echo ""

# issue | title | body | labels (space-separated) | milestone
while IFS='|' read -r num title body_file labels milestone || [[ -n "${num:-}" ]]; do
  [[ -z "${num:-}" || "$num" == \#* ]] && continue
  body_path="$BODIES/$body_file"
  if [[ ! -f "$body_path" ]]; then
    echo "Error: missing body $body_path" >&2
    exit 1
  fi
  apply_update "$num" "$title" "$body_path" "$labels" "$milestone"
done <<'TABLE'
7|Add OpenInference export fixture (v3 schema)|007-body.md|good first issue,fixtures,exports,testing|Standards and Graduation
9|Add AgentInspect vs production observability comparison (v3)|009-body.md|documentation,roadmap,good first issue|OSS Hygiene
10|Add retry and circuit-breaker fixture pack|010-body.md|good first issue,fixtures,examples,testing|Examples and Fixtures
13|Decision metadata recipe (safe context, no chain-of-thought)|013-body.md|documentation,examples,roadmap-next|Examples and Fixtures
18|Add first PR walkthrough for new contributors (v3)|018-body.md|good first issue,documentation,community contribution|OSS Hygiene
19|Update contributor docs with live v3 issue links|019-body.md|good first issue,documentation,community contribution|OSS Hygiene
25|Add Phoenix/OpenInference import graduation guide|025-body.md|documentation,exports,roadmap-next,help wanted|Standards and Graduation
27|Add log ingest config cookbook (v3)|027-body.md|good first issue,documentation,logging|Examples and Fixtures
29|Add LangChain persisted trace example (v3)|029-body.md|documentation,examples,langchain,help wanted|Examples and Fixtures
TABLE

echo ""
echo "Done. Review .github/ISSUE_UPDATES_V3_OSS/ for rationale per issue."
