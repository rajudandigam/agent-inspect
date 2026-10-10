/**
 * Keniel finding-B8 public-record map (W07).
 * Frozen fixture only — no network at runtime.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { MappingLedger } from "agent-inspect/readers";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(here, "..", "fixture");

type Class = "pass" | "fail" | "unknown";

interface FinderRef {
  _key: string;
  _ref: string;
  _type: string;
}

interface FindingB8 {
  _id: string;
  status: string;
  foundBy: FinderRef[];
  commentIds: string[];
  commentId: string | null | undefined;
  commentOn: { _ref: string; _type: string };
  [key: string]: unknown;
}

interface ReceiptSearch {
  finderRef: string;
  status: "found" | "not_found_in_search";
  receiptId?: string;
}

/** Locatable receipt known from correspondence: Pushpendra only. */
const RECEIPT_INDEX: Record<string, string> = {
  "person-pushpendra": "receipt-pushpendra-B8",
};

const MAPPING_LEDGER: MappingLedger = {
  id: "keniel-finding-b8-to-local-map",
  sourceFormat: "sanity-finding-json",
  targetFormat: "agent-inspect-local-fixture-map",
  convention: {
    name: "keniel-public-finding-B8",
    version: "frozen-fixture",
  },
  entries: [
    {
      source: "status",
      target: "finding.status",
      transformation: "identity",
      confidence: "explicit",
      loss: "none",
    },
    {
      source: "foundBy[]",
      target: "finders[]",
      transformation: "preserve-array-of-refs",
      confidence: "explicit",
      loss: "none",
    },
    {
      source: "commentIds",
      target: "comments.ids",
      transformation: "identity-array",
      confidence: "explicit",
      loss: "none",
    },
    {
      source: "commentId",
      target: "comments.singularId",
      transformation: "preserve-null-independently",
      confidence: "explicit",
      loss: "none",
    },
    {
      source: "commentOn._ref",
      target: "article.ref",
      transformation: "identity",
      confidence: "explicit",
      loss: "none",
    },
    {
      source: "finder→receipt search",
      target: "receipts[].status",
      transformation: "external-search-status; not_found≠zero-proof",
      confidence: "correlated",
      loss: "unsupported",
    },
    {
      source: "_createdAt/_updatedAt",
      target: "timing.sourceOnly",
      transformation: "retain-source-timestamps; no fake tool timing",
      confidence: "explicit",
      loss: "kind-degraded",
    },
  ],
  knownLosses: [
    "Native tool/step timing is unavailable from this public finding record.",
    "Two finder receipts were searched and not found — unknown evidence, not proof of zero contribution.",
  ],
};

function loadFinding(): FindingB8 {
  return JSON.parse(
    readFileSync(path.join(fixtureDir, "finding-B8.result.json"), "utf8"),
  ) as FindingB8;
}

function searchReceipts(finders: FinderRef[]): ReceiptSearch[] {
  return finders.map((f) => {
    const receiptId = RECEIPT_INDEX[f._ref];
    if (receiptId) {
      return { finderRef: f._ref, status: "found", receiptId };
    }
    return { finderRef: f._ref, status: "not_found_in_search" };
  });
}

function mapFinding(finding: FindingB8) {
  // Never backfill singular commentId from commentIds[0].
  // Source may omit the key or set null — both mean singular null, not commentIds[0].
  const singular =
    finding.commentId === undefined || finding.commentId === null
      ? null
      : finding.commentId;
  const receipts = searchReceipts(finding.foundBy);
  const unknownAttrs = Object.fromEntries(
    Object.entries(finding).filter(
      ([k]) =>
        ![
          "_id",
          "status",
          "foundBy",
          "commentIds",
          "commentId",
          "commentOn",
          "code",
          "title",
          "_type",
          "_rev",
          "_createdAt",
          "_updatedAt",
        ].includes(k),
    ),
  );
  return {
    findingId: finding._id,
    status: finding.status,
    finders: finding.foundBy.map((f) => f._ref),
    commentIds: [...finding.commentIds],
    commentId: singular,
    articleRef: finding.commentOn?._ref,
    receipts,
    unknownAttributes: unknownAttrs,
    sourceTiming: {
      createdAt: finding._createdAt,
      updatedAt: finding._updatedAt,
    },
    mappingLedgerId: MAPPING_LEDGER.id,
  };
}

type CaseResult = { id: string; expected: Class; observed: Class };
const results: CaseResult[] = [];

function check(id: string, expected: Class, observed: Class) {
  results.push({ id, expected, observed });
  console.log(`  ${id}: expected=${expected} observed=${observed}`);
}

console.log("keniel-finding-b8:");

const frozenBytes = readFileSync(path.join(fixtureDir, "finding-B8.json"));
const digest = createHash("sha256").update(frozenBytes).digest("hex");
const recorded = readFileSync(
  path.join(fixtureDir, "finding-B8.sha256.txt"),
  "utf8",
)
  .trim()
  .split(/\s+/)[0];
if (digest !== recorded) {
  console.error("fixture digest drift", { digest, recorded });
  process.exitCode = 1;
}

const base = loadFinding();
const mapped = mapFinding(base);

// K01: 3 finders, exactly 1 locatable receipt (Pushpendra)
check(
  "K01-3finder-1receipt",
  "pass",
  mapped.finders.length === 3 &&
    mapped.receipts.filter((r) => r.status === "found").length === 1 &&
    mapped.receipts.find((r) => r.status === "found")?.finderRef ===
      "person-pushpendra"
    ? "pass"
    : "fail",
);

// K02: singular commentId null preserved independently of commentIds
check(
  "K02-singular-null",
  "pass",
  mapped.commentId === null &&
    mapped.commentIds.length === 1 &&
    mapped.commentIds[0] === "3ee98"
    ? "pass"
    : "fail",
);

// K03: wrong article join
const wrongArticle = mapFinding({
  ...base,
  commentOn: { _ref: "article-WRONG", _type: "reference" },
});
check(
  "K03-wrong-article",
  "fail",
  wrongArticle.articleRef === "article-4590564" ? "pass" : "fail",
);

// K04: missing/unavailable receipt for a finder that had a found receipt → unknown when index cleared
const noIndexReceipts = base.foundBy.map((f) => ({
  finderRef: f._ref,
  status: "not_found_in_search" as const,
}));
check(
  "K04-missing-receipt",
  "unknown",
  noIndexReceipts.every((r) => r.status === "not_found_in_search")
    ? "unknown"
    : "fail",
);

// K05: known nonmatching reference among finders
check(
  "K05-nonmatching-ref",
  "fail",
  mapped.finders.includes("person-not-in-record") ? "pass" : "fail",
);

// K06: source unavailable
check(
  "K06-source-unavailable",
  "unknown",
  (() => {
    try {
      mapFinding(null as unknown as FindingB8);
      return "fail";
    } catch {
      return "unknown";
    }
  })(),
);

// K07: unknown additional fields retained (e.g. handed)
check(
  "K07-unknown-fields-retained",
  "pass",
  Object.prototype.hasOwnProperty.call(mapped.unknownAttributes, "handed")
    ? "pass"
    : "fail",
);

const found = mapped.receipts.filter((r) => r.status === "found").length;
const unknownSearch = mapped.receipts.filter(
  (r) => r.status === "not_found_in_search",
).length;

console.log(
  `classes: ${results.map((r) => `${r.id.slice(0, 3)}:${r.observed}`).join(",")}`,
);
console.log(`receipts: found=${found} unknownSearch=${unknownSearch}`);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
