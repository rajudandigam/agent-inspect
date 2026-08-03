/**
 * adpa-codebase-change-trace — local, read-only review trace for an
 * ADPA-style codebase change: RPAS intent -> Jest contract -> Skills.md
 * update -> codebase adjustment -> isolated validation -> full suite.
 *
 * AgentInspect sits BESIDE ADPA governance and Langfuse observability as
 * read-only local observability. Only safe references are recorded:
 * ledger entry ids and Langfuse trace ids as opaque strings. Never scoped
 * write tokens, secrets, prompts, or ledger contents.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { inspectRun, observeOutcome, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT !== "false";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");
const sessionId = "sess-adpa-change-demo";

// Deterministic fake workflow context. Safe fields only: identifiers,
// repo-relative file paths, and pass/fail summaries. writeTokenScope is
// deliberately recorded as "not captured" so reviewers can see the
// governance boundary was respected.
const workflowMetadata = {
  workflow: "adpa-codebase-change",
  sessionId,
  intent: {
    source: "rpas",
    id: "intent_123",
    summary: "change declared before implementation",
  },
  contract: {
    testFile: "__tests__/example.contract.test.ts",
    mode: "jest-first",
  },
  documentation: {
    skillsFile: "skills/Skills.md",
    updated: true,
  },
  implementation: {
    changedFiles: ["src/example.ts"],
  },
  validation: {
    isolatedContract: "passed",
    fullSuite: "passed",
  },
  governance: {
    mode: "read-only-reference",
    ledgerEntryId: "ledger_abc",
    // Key names containing "token" trip the share-safety gate by design,
    // so the boundary is stated under a neutral key instead of
    // writeTokenScope: "not captured".
    captureBoundary: "write tokens and ledger contents not captured",
  },
  observability: {
    langfuseTraceId: "optional-reference-only",
  },
};

await inspectRun(
  "adpa-codebase-change",
  async () => {
    await step(
      "intent:rpas-declared",
      async () => ({
        intentId: "intent_123",
        summary: "change declared before implementation",
      }),
      { metadata: { source: "rpas" } },
    );

    await step(
      "contract:jest-test-written",
      async () => ({
        testFile: "__tests__/example.contract.test.ts",
        mode: "jest-first",
      }),
      { metadata: { intentId: "intent_123" } },
    );

    await step("docs:skills-md-updated", async () => ({
      skillsFile: "skills/Skills.md",
      updated: true,
    }));

    await step(
      "implementation:codebase-adjustment",
      async () => ({ changedFiles: ["src/example.ts"] }),
      { metadata: { intentId: "intent_123" } },
    );

    await step("validation:isolated-contract", async () => ({
      status: "passed",
      tests: 1,
    }));
    await observeOutcome("isolatedContractPassed", {
      expectation: "New contract test passes in isolation",
      status: "passed",
      method: "custom",
      evidence: { runner: "jest", testFile: "__tests__/example.contract.test.ts" },
    });

    await step("validation:full-jest-suite", async () => ({
      status: "passed",
      suites: 12,
      failures: 0,
    }));
    await observeOutcome("fullSuitePassed", {
      expectation: "All Jest test contracts pass after the change",
      status: "passed",
      method: "custom",
      evidence: { runner: "jest", suites: 12, failures: 0 },
    });

    return "review-ready";
  },
  { silent, traceDir, metadata: workflowMetadata },
);

// Run ids are generated (run_xxx). Find the newest trace so the commands
// below are copy-paste ready.
let runId = "<run-id>";
let newest = -1;
for (const file of await readdir(traceDir)) {
  if (!file.endsWith(".jsonl")) continue;
  const info = await stat(path.join(traceDir, file));
  if (info.mtimeMs > newest) {
    newest = info.mtimeMs;
    runId = file.slice(0, -".jsonl".length);
  }
}

console.log("ADPA codebase-change trace written");
console.log("Trace directory: ./.agent-inspect-runs");
console.log(`Run id: ${runId}`);
console.log("");
console.log("Sequence: intent -> contract -> docs update -> code change");
console.log("          -> isolated validation -> full validation");
console.log("");
console.log("Governance and Langfuse fields are safe references only.");
console.log("Not captured: write tokens, secrets, prompts, ledger contents.");
console.log("");
console.log("Redacted review report:");
console.log(
  `  npx agent-inspect report ${runId} --dir ./.agent-inspect-runs --redaction-profile share -o ./review-report.md`,
);
console.log("Share-safe offline bundle (by run or by session):");
console.log(
  `  npx agent-inspect bundle ${runId} --dir ./.agent-inspect-runs --profile share --out ./bundle-out`,
);
console.log(
  `  npx agent-inspect bundle --session ${sessionId} --dir ./.agent-inspect-runs --profile share --out ./bundle-out`,
);
console.log("Search validation outcomes:");
console.log(
  "  npx agent-inspect search --dir ./.agent-inspect-runs --observation passed",
);
