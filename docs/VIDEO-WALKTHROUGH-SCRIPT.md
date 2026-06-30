# Video walkthrough script (~5–7 minutes)

Use with [assets/demos/RECORDING.md](./assets/demos/RECORDING.md). Synthetic fixtures only — no API keys.

## 0:00 — Hook

"AgentInspect turns TypeScript agent runs into local execution trees you can check in CI — without sending traces to the cloud."

## 0:30 — Install

```bash
npm install agent-inspect
npx agent-inspect init --framework custom --yes
```

Show `.agent-inspect/` and `agent-inspect.config.ts`.

## 1:00 — First trace

Run the generated demo or `examples/starters/custom-observe`.

```bash
npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
```

B-roll: [quickstart.gif](./assets/demos/quickstart.gif) if not recording live.

## 2:00 — Framework path

Switch to `examples/starters/ai-sdk` or mention adapter docs ([AI-SDK-ADOPTION.md](./AI-SDK-ADOPTION.md)).

## 2:45 — Checks in CI

```bash
npx agent-inspect check .agent-inspect/*.jsonl --require-completed
npx agent-inspect eval <run-id> --dir .agent-inspect
```

## 3:30 — Redact before share

```bash
npx agent-inspect redact trace.jsonl --profile share
```

## 4:00 — Report / viewer

```bash
npx agent-inspect report <run-id> --dir .agent-inspect
# or: npx agent-inspect serve --dir .agent-inspect
```

## 4:30 — VS Code (optional)

"In v3.3 we added a read-only VS Code extension in the repo — develop with F5 from `packages/vscode`. Marketplace publish is a separate step."

## 5:00 — Boundaries

Not a hosted dashboard. Complements LangSmith/Langfuse/OTel. See [COMPARE.md](./COMPARE.md).

## 5:30 — CTA

"Pick a starter in `examples/starters/`, run `doctor` if stuck, open an issue with a redacted trace."
