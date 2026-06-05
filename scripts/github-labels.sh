#!/usr/bin/env bash
# Maintainer-only: create or update GitHub labels for AgentInspect.
# DO NOT run from CI. Review labels, then run manually:
#   chmod +x scripts/github-labels.sh
#   ./scripts/github-labels.sh
#
# Requires: gh CLI authenticated with repo admin access
# Repo: rajudandigam/agent-inspect (override with GITHUB_REPOSITORY)

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-rajudandigam/agent-inspect}"

upsert_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$description" 2>/dev/null \
    || gh label edit "$name" --repo "$REPO" --color "$color" --description "$description"
}

echo "Upserting labels on $REPO ..."

upsert_label "good first issue" "0E8A16" "Safe for new contributors; docs, fixtures, examples"
upsert_label "help wanted" "008672" "Maintainers would appreciate community help"
upsert_label "community contribution" "5319E7" "Community-driven docs, examples, or outreach"
upsert_label "documentation" "0075CA" "Documentation improvements"
upsert_label "examples" "FBCA04" "Examples and recipes"
upsert_label "fixtures" "C5DEF5" "Canonical fixtures and validation"
upsert_label "bug" "D73A4A" "Incorrect behavior"
upsert_label "enhancement" "A2EEEF" "Scoped feature or improvement"
upsert_label "discussion" "D4C5F9" "Discussion / feedback (may link to Discussions)"
upsert_label "roadmap" "BFD4F2" "Roadmap-aligned work"
upsert_label "cli" "1D76DB" "CLI commands and output"
upsert_label "adapter" "006B75" "Optional framework adapters"
upsert_label "langchain" "0052CC" "LangChain.js adapter package"
upsert_label "logging" "E99695" "Structured log ingest and logging guidance"
upsert_label "pino" "5319E7" "pino JSON logging"
upsert_label "log4js" "5319E7" "log4js JSON layout logging"
upsert_label "nestjs" "5319E7" "NestJS structured logging"
upsert_label "testing" "BFDADC" "Tests and test infrastructure"
upsert_label "exports" "F9D0C4" "Local export formats (Markdown, OpenInference, OTLP JSON)"
upsert_label "security" "B60205" "Security, redaction, parsing safety"
upsert_label "redaction" "B60205" "Redaction behavior and policy"
upsert_label "package-compatibility" "EDEDED" "npm package exports and consumer compatibility"
upsert_label "maintainer-owned" "D93F0B" "Requires maintainer coordination before implementation"
upsert_label "roadmap-now" "FEF2C0" "Aligned with ROADMAP Now"
upsert_label "roadmap-next" "FEF2C0" "Aligned with ROADMAP Next"
upsert_label "roadmap-future" "FEF2C0" "Aligned with ROADMAP Future / exploratory"

echo "Done. Verify with: gh label list --repo $REPO"
