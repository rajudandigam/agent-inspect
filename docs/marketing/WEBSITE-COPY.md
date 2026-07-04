# AgentInspect Website Copy

Exact copy used by the marketing site (aligned with repo docs as of v3.5.x).

## Hero

**Eyebrow:** Local-first trace + check + redact

**Headline:** Debug TypeScript AI agents locally

**Subheadline:** Trace what happened, check what should have happened, and redact what must not leave your machine. No account. No upload. Metadata-only by default.

**Primary command:** `npm install agent-inspect`

**Primary CTA:** Copy install command

**Secondary CTAs:** First trace in 5 minutes · View on GitHub

**Trust badges:** Open source · MIT license · TypeScript · Local-first

## Problem

**Headline:** console.log was not built for agents

**Intro:** Agent runs are nested, parallel, tool-heavy, and privacy-sensitive. Flat logs tell you something happened. They rarely show what happened in order, where it branched, or what is safe to share.

**Cards:**

- Flat logs hide nested decisions
- Parallel tool calls get interleaved
- Hosted dashboards slow the local loop
- Raw traces can leak customer data

## Five-minute path

**Headline:** One trace, one check, one safe artifact

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect check .agent-inspect/*.jsonl --require-completed --detect-stalls
npx agent-inspect redact --profile share --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect
```

**Note:** The deterministic starter path should work without API keys.

## Product loop

**Headline:** The local agent debugging loop

- **Capture** — Capture manual steps, AI SDK telemetry, OpenAI Agents traces, LangChain callbacks, logs, harness runs, and CI/test artifacts.
- **Inspect** — Read local JSONL as trees, timelines, reports, terminal output, viewer artifacts, or editor-friendly traces.
- **Check** — Turn expectations into deterministic checks for completion, stalls, failures, regressions, and CI review.
- **Redact** — Create share-safe artifacts before opening issues, reviewing PRs, or talking with design partners.

## Features

1. Local JSONL traces
2. Execution trees
3. Metadata-only by default
4. Framework adapters
5. CI checks and reporters
6. Redaction profiles
7. Viewer, TUI, and VS Code surfaces
8. OpenTelemetry and OpenInference export path

## Code examples

Tabs: Manual · AI SDK · CLI · Harness

(See site components for full snippets; APIs verified against repo docs.)

## Use cases

- Debug a wrong tool call locally
- Attach a safe trace to a PR
- Catch stalled agent runs in CI
- Compare before/after agent behavior
- Build a community adapter
- Review traces in VS Code without a hosted dashboard

## Comparison

Columns: agent-inspect · console.log · Hosted observability platforms · Raw OpenTelemetry

Caption: Use AgentInspect for the local developer loop. Use hosted platforms or OpenTelemetry for production observability. They can complement each other.

## What it is not

**Headline:** Local-first by design. Not a hidden platform.

- Not a hosted SaaS dashboard
- Not a production APM replacement
- Not an eval dataset platform
- Not a prompt registry
- Not a hidden uploader
- Not a chain-of-thought recorder
- Not a replay engine

## Open-source trust

MIT license · Local JSONL files · Metadata-only default · Redaction profiles · verify-safe before sharing · GitHub issues and discussions · npm package · Technical guide · Safe trace sharing docs

## FAQ

See site FAQ component for full Q&A.

Docs live at https://agentinspect.vercel.app/docs/ (canonical GitHub docs remain the full reference during migration).

## Footer

Links to docs, GitHub, npm, MIT license, and safe-sharing guidance.

## Live URLs

- Website: https://agentinspect.vercel.app/
- Docs: https://agentinspect.vercel.app/docs/
