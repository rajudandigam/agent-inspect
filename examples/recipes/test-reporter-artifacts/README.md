# Recipe: test-reporter-artifacts

## What this demonstrates

A local v1.8 test-reporter artifact workflow for:

1. Writing a fixture AgentInspect trace.
2. Creating an explicit test-to-trace association manifest.
3. Configuring Vitest and Jest reporters after their optional packages are published.
4. Keeping reporter artifacts structural and local.

## Why this matters

Test failures often need the trace run id and filename, not the entire trace body. The v1.8 reporter packages are designed around explicit associations, bounded success retention, non-fatal diagnostics, and structural artifacts that do not read trace contents.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/test-reporter-artifacts
pnpm install
pnpm start
```

After publication, a Vitest config can attach traces explicitly:

```ts
import { defineConfig } from "vitest/config";
import { createAgentInspectVitestReporter } from "@agent-inspect/vitest";

export default defineConfig({
  test: {
    reporters: [
      "default",
      createAgentInspectVitestReporter({
        artifactDir: ".agent-inspect/vitest-artifacts",
        associations: {
          "tests/reporter-artifact.test.ts::writes safe artifact": {
            runId: "reporter-artifact-fixture",
            traceFile: ".agent-inspect-runs/reporter-artifact-fixture.jsonl",
            artifactLabel: "fixture-agent",
          },
        },
      }),
    ],
  },
});
```

After publication, a Jest config can use the package as a custom reporter:

```js
module.exports = {
  reporters: [
    "default",
    [
      "@agent-inspect/jest",
      {
        artifactDir: ".agent-inspect/jest-artifacts",
        associations: {
          "tests/reporter-artifact.test.ts::writes safe artifact": {
            runId: "reporter-artifact-fixture",
            traceFile: ".agent-inspect-runs/reporter-artifact-fixture.jsonl",
            artifactLabel: "fixture-agent",
          },
        },
      },
    ],
  ],
};
```

## Expected output

See `expected-output.txt`.

## What to look for

- The recipe does not install Vitest or Jest. It documents config shape for the optional reporter packages.
- `@agent-inspect/vitest` and `@agent-inspect/jest` remain private/unpublished in this train until release readiness.
- Reporter artifacts carry bounded structural metadata: test identity, status, run id, trace file, and diagnostics.
- Reporters do not infer relationships by timestamp and do not embed raw trace contents.

## Notes and limitations

- This recipe is config-oriented until the optional reporter packages are published.
- No provider SDKs, test-runner dependencies, credentials, network access, hosted upload, GitHub API calls, or repository writes are required.
- Safe artifacts still need human review before broad sharing.
