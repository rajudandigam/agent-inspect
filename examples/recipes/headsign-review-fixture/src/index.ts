/**
 * meganemura/headsign review fixture (W13).
 * Synthetic transcripts only — never execute recorded shell commands.
 *
 * Documented next first-line / exit contract (pinned from headsign docs):
 *   ADVANCE|COMPLETE → exit 0
 *   RETRY|PENDING → exit 1
 *   ESCALATE|ABORT → exit 2
 *   config/usage → exit 3
 * status: exit 0 when state readable (incl. ESCALATED/ABORTED); exit 3 when unreadble.
 */
type Class = "pass" | "fail";

interface SyntheticNext {
  /** Labeled synthetic — not from a live CLI run. */
  synthetic: true;
  firstLine: string;
  exitCode: number;
  proseTail?: string;
}

interface ReviewRecord {
  requestedValidation: boolean;
  validationObservation?: SyntheticNext;
  stableResult?: "ok" | "retry" | "escalate" | "missing";
  retryOrEscalation?: "none" | "retry" | "escalate";
  finalPhaseClaimed: boolean;
}

/** Parse stable result from documented first line + exit (ignore prose). */
function stableFromNext(obs: SyntheticNext): ReviewRecord["stableResult"] {
  const token = obs.firstLine.trim().split(/\s+/)[0] ?? "";
  if (token === "COMPLETE" || token === "ADVANCE") {
    return obs.exitCode === 0 ? "ok" : "missing";
  }
  if (token === "RETRY" || token === "PENDING") {
    return obs.exitCode === 1 ? "retry" : "missing";
  }
  if (token === "ESCALATE" || token === "ABORT") {
    return obs.exitCode === 2 ? "escalate" : "missing";
  }
  return "missing";
}

function classify(record: ReviewRecord): Class {
  if (!record.requestedValidation) return "fail";
  if (!record.validationObservation) return "fail";
  const stable = stableFromNext(record.validationObservation);
  if (stable === "missing") return "fail";

  if (stable === "ok") {
    return record.finalPhaseClaimed && record.retryOrEscalation === "none"
      ? "pass"
      : "fail";
  }
  if (stable === "retry") {
    return record.retryOrEscalation === "retry" && !record.finalPhaseClaimed
      ? "pass"
      : "fail";
  }
  if (stable === "escalate") {
    return record.retryOrEscalation === "escalate" && !record.finalPhaseClaimed
      ? "pass"
      : "fail";
  }
  return "fail";
}

type CaseResult = { id: string; expected: Class; observed: Class };
const results: CaseResult[] = [];

function check(id: string, expected: Class, record: ReviewRecord) {
  const observed = classify(record);
  results.push({ id, expected, observed });
  console.log(`  ${id}: expected=${expected} observed=${observed}`);
}

console.log("headsign-review-fixture:");
console.log("  pin: meganemura/headsign docs contract (synthetic transcripts)");

check("H01-success-final", "pass", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "COMPLETE",
    exitCode: 0,
    proseTail: "--- phase: done --- ship it",
  },
  stableResult: "ok",
  retryOrEscalation: "none",
  finalPhaseClaimed: true,
});

check("H02-fail-retry", "pass", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "RETRY 1/3 lint",
    exitCode: 1,
    proseTail: "lint failed; try again",
  },
  retryOrEscalation: "retry",
  finalPhaseClaimed: false,
});

check("H03-fail-escalate", "pass", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "ESCALATE needs-human",
    exitCode: 2,
  },
  retryOrEscalation: "escalate",
  finalPhaseClaimed: false,
});

check("H04-requested-not-run", "fail", {
  requestedValidation: true,
  // validationObservation omitted — requested but not run
  retryOrEscalation: "none",
  finalPhaseClaimed: false,
});

check("H05-unjustified-final", "fail", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "RETRY 2/3 tests",
    exitCode: 1,
  },
  retryOrEscalation: "retry",
  finalPhaseClaimed: true, // unjustified final-phase claim after failure
});

check("H06-missing-result", "fail", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "",
    exitCode: 3,
  },
  retryOrEscalation: "none",
  finalPhaseClaimed: false,
});

// Irrelevant prose change must not change verdict vs H01.
check("H07-irrelevant-prose", "pass", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "COMPLETE",
    exitCode: 0,
    proseTail: "--- phase: done --- totally different incidental prose",
  },
  retryOrEscalation: "none",
  finalPhaseClaimed: true,
});

// Changing stable exit code must affect the declared decision vs H01.
check("H08-exit-change", "fail", {
  requestedValidation: true,
  validationObservation: {
    synthetic: true,
    firstLine: "COMPLETE",
    exitCode: 1, // inconsistent with COMPLETE→0 contract
  },
  retryOrEscalation: "none",
  finalPhaseClaimed: true,
});

console.log(
  `classes: ${results.map((r) => `${r.id.slice(0, 3)}:${r.observed}`).join(",")}`,
);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
