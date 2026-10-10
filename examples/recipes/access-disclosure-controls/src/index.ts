/**
 * Femi four access/disclosure controls (W12).
 * Fixture enforces policy; AgentInspect observes. No real secrets.
 */
import path from "node:path";
import { mkdirSync, rmSync } from "node:fs";

import { inspectRun, observeOutcome, step } from "agent-inspect";
import { redact } from "@agent-inspect/redact";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const baseDir = path.join(process.cwd(), ".agent-inspect-runs");

type Decision = "deny" | "allow" | "awaiting" | "missing";
type Class = "pass" | "awaiting" | "fail-prevention" | "unknown";

const FAKE_MARKER = "MARKER_FIXTURE_CANARY_NOT_A_SECRET";

interface FixtureState {
  decision: Decision;
  invoked: boolean;
  readMarker: string | null;
  disclosureSink: string[];
  windowComplete: boolean;
}

/** Fixture-side policy gate — not AgentInspect enforcement. */
function fixtureDecide(decision: Decision): {
  mayInvoke: boolean;
  label: string;
} {
  if (decision === "allow") return { mayInvoke: true, label: "allowed" };
  if (decision === "awaiting")
    return { mayInvoke: false, label: "awaiting-approval" };
  if (decision === "deny") return { mayInvoke: false, label: "denied" };
  return { mayInvoke: false, label: "missing-decision" };
}

function classify(state: FixtureState): Class {
  if (state.decision === "missing" || !state.windowComplete) return "unknown";
  if (state.decision === "awaiting") {
    return !state.invoked ? "awaiting" : "fail-prevention";
  }
  if (state.decision === "deny") {
    return !state.invoked ? "pass" : "fail-prevention";
  }
  // allowed: access-prevention must fail; disclosure sink may also fail never-disclosed.
  if (state.invoked && state.disclosureSink.includes(FAKE_MARKER)) {
    return "fail-prevention";
  }
  return state.invoked ? "fail-prevention" : "pass";
}

type CaseResult = { id: string; expected: Class; observed: Class };
const results: CaseResult[] = [];

async function runCase(
  id: string,
  expected: Class,
  setup: {
    decision: Decision;
    attemptInvoke: boolean;
    disclose: boolean;
    observe: boolean;
  },
) {
  const traceDir = path.join(baseDir, id);
  rmSync(traceDir, { recursive: true, force: true });
  mkdirSync(traceDir, { recursive: true });

  const state: FixtureState = {
    decision: setup.decision,
    invoked: false,
    readMarker: null,
    disclosureSink: [],
    windowComplete: false,
  };

  await inspectRun(
    id,
    async () => {
      const gate = fixtureDecide(setup.decision);
      await step(
        "access_request",
        async () => ({ resource: "fake-marker", decision: setup.decision }),
        { type: "logic" },
      );

      if (setup.decision !== "missing") {
        await step(
          "access_decision",
          async () => ({ verdict: gate.label, mayInvoke: gate.mayInvoke }),
          {
            type: "decision",
            metadata: {
              policyId: "fixture-access-1",
              decisionId: `dec-${id}`,
              verdict: gate.label,
              mode: "enforce",
            },
          },
        );
      }

      if (setup.attemptInvoke && gate.mayInvoke) {
        await step(
          "read_marker",
          async () => {
            state.invoked = true;
            state.readMarker = FAKE_MARKER;
            if (setup.disclose) {
              state.disclosureSink.push(FAKE_MARKER);
            }
            return { marker: FAKE_MARKER, disclosed: setup.disclose };
          },
          {
            type: "tool",
            metadata: { toolName: "read_marker", operationId: "op_access" },
          },
        );
      } else if (setup.attemptInvoke && !gate.mayInvoke) {
        await step("skip_invoke", async () => ({ skipped: true, reason: gate.label }), {
          type: "logic",
        });
      }

      if (setup.observe) {
        const preventionHolds = !state.invoked;
        await observeOutcome("access-window", {
          expectation:
            setup.decision === "awaiting"
              ? "No invocation while awaiting approval"
              : "Access prevention / disclosure boundary observed",
          status: preventionHolds || setup.decision === "allow" ? "passed" : "failed",
          method: "custom",
          evidence: {
            decision: setup.decision,
            invoked: state.invoked,
            disclosureSinkCount: state.disclosureSink.length,
            join: { operationId: "op_access", decisionId: `dec-${id}` },
          },
        });
        state.windowComplete = true;
      }
    },
    { silent, traceDir },
  );

  const observed = classify(state);
  results.push({ id, expected, observed });
  console.log(`  ${id}: expected=${expected} observed=${observed}`);
}

console.log("access-disclosure-controls:");

await runCase("P01-denied-no-invoke", "pass", {
  decision: "deny",
  attemptInvoke: true,
  disclose: false,
  observe: true,
});

await runCase("P02-awaiting-approval", "awaiting", {
  decision: "awaiting",
  attemptInvoke: true,
  disclose: false,
  observe: true,
});

await runCase("P03-allowed-disclosed", "fail-prevention", {
  decision: "allow",
  attemptInvoke: true,
  disclose: true,
  observe: true,
});

await runCase("P04-incomplete-observer", "unknown", {
  decision: "deny",
  attemptInvoke: true,
  disclose: false,
  observe: false,
});

// Redaction canary: sensitive-key values must not survive share-profile export.
const beforeDiskPayload = {
  runId: "access-canary",
  metadata: { apiKey: FAKE_MARKER, password: FAKE_MARKER },
};
const beforeDisk = redact(beforeDiskPayload, { profile: "share" });
const beforeDiskOk = !JSON.stringify(beforeDisk.value).includes(FAKE_MARKER);
const shareExport = redact(
  {
    note: "shared bundle",
    authorization: FAKE_MARKER,
    token: FAKE_MARKER,
  },
  { profile: "share" },
);
const shareExportOk = !JSON.stringify(shareExport.value).includes(FAKE_MARKER);

console.log(
  `classes: ${results.map((r) => `${r.id.slice(0, 3)}:${r.observed}`).join(",")}`,
);
console.log(
  `redaction-canary: beforeDisk=${beforeDiskOk} shareExport=${shareExportOk}`,
);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length || !beforeDiskOk || !shareExportOk) {
  console.error("classification or redaction mismatches", {
    mismatch,
    beforeDiskOk,
    shareExportOk,
  });
  process.exitCode = 1;
}
