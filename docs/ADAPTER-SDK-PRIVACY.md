# Adapter SDK privacy checklist

Use this checklist when authoring or reviewing a third-party adapter built with
`@agent-inspect/adapter-sdk`.

Adapter packages should stay local-first, metadata-only by default, and explicit
about any capture mode that can persist prompt, output, tool input, or tool
result content.

## Default capture

- Default to `metadata-only` capture.
- Do not persist full prompts, completions, tool inputs, tool outputs, request
  bodies, response bodies, or raw logs unless the user opts in.
- Keep preview or full capture modes explicit, documented, and easy to disable.
- Treat framework-specific metadata as user-controlled data. Review it before
  export or sharing.

## Persistence

- Write traces only to user-controlled local paths.
- Do not upload traces, logs, exports, or adapter diagnostics by default.
- Do not call external networks from adapter defaults or conformance examples.
- Keep framework SDK dependencies inside the optional adapter package. Do not add
  framework dependencies to the root `agent-inspect` package.
- Preserve application behavior if trace writing, flushing, or closing fails.

## Redaction and export review

- Document capture and redaction behavior in the adapter README.
- Use `redactionProfile: "share"` or `redactionProfile: "strict"` for artifacts
  intended for issues, PRs, external posts, or support threads.
- Review Markdown, HTML, JSON, JSONL, and screenshot outputs before sharing.
- Search exported artifacts for secrets, tokens, session IDs, customer IDs,
  internal hostnames, raw prompts, model outputs, tool payloads, and file paths.
- Prefer small synthetic examples over production traces when demonstrating an
  adapter.

## Conformance helper

`@agent-inspect/adapter-sdk` exposes `runPrivacyChecklist()` for adapter package
tests or release checks.

```ts
import { runPrivacyChecklist } from "@agent-inspect/adapter-sdk";

const result = runPrivacyChecklist({
  captureMode: "metadata-only",
  networkAllowed: false,
  uploadAllowed: false,
  redactionDocumented: true,
  frameworkDepsPackageScoped: true,
});

if (!result.ok) {
  throw new Error("Adapter privacy checklist failed");
}
```

The helper is a contract check, not a compliance guarantee. Adapter authors still
need to review the exact artifacts they share.

## Before proposing registry inclusion

- Confirm metadata-only is the default path.
- Confirm no upload or network behavior is enabled by default.
- Link the adapter README to this checklist and to
  [Safe trace sharing](./SAFE-TRACE-SHARING.md).
- Run conformance and privacy checks locally.
- Use the
  [extension submission template](./community/EXTENSION-SUBMISSION-TEMPLATE.md)
  to describe capture, persistence, redaction, validation, and maintainer contact
  details.
