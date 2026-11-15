/**
 * Joseph / F09B — Bezalel pilot ten-invariant map + mutation controls.
 * Foreign semantic-summary trajectory (9 ordinal events). Not native JSONL.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { openTraceFile } from "agent-inspect/readers";
import type { MappingLedger } from "agent-inspect/readers";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(here, "..", "fixture");
const trajectoryPath = path.join(fixtureDir, "trajectory.json");

interface BezalelEvent {
  event_id: string;
  sequence: number;
  actor_id: string;
  authority_id: string | null;
  event_kind: string;
  status: string;
  authority_decision: string;
  final_acceptance_or_rejection: string;
  caused_by_event_id: string | null;
  parent_or_causal_reference?: string[];
  remediation_of: null | {
    event_id: string;
    failed_candidate_event_id?: string;
    relationship_kind?: string;
  };
  consequential_mutation: {
    occurred: boolean;
    authority_surface_changed: boolean;
    authoritative_state_transition_count?: number;
    durable_retention_binding_count?: number;
    other_authority_mutation_count?: number;
    failed_r1_authority_role?: string;
  };
  verification_result: Record<string, unknown> | null;
  source_lineage_note?: string;
}

interface Trajectory {
  schema: string;
  ordering_model: { kind: string; timestamps: string; rule: string };
  source_lineage: {
    accepted_base_id: string;
    r2_parent_id: string;
    r2_is_source_child_of_r1: boolean;
  };
  events: BezalelEvent[];
  relationships: Array<{
    relationship_id: string;
    kind: string;
    from_event_id: string;
    to_event_id: string;
    explicit?: boolean;
  }>;
  explicit_non_claims: string[];
  invariants: Array<{ invariant_id: string; expected: boolean }>;
}

const MAPPING_LEDGER: MappingLedger = {
  id: "bezalel-pilot-v2-to-custom-invariants",
  sourceFormat: "bezalel-agentinspect-pilot.v2",
  targetFormat: "custom-invariant-matrix",
  convention: { name: "joseph-bezalel-pilot", version: "recovered-packet" },
  entries: [
    {
      source: "event_id/sequence",
      target: "custom.ordinal",
      transformation: "presentation-order-only",
      confidence: "explicit",
      loss: "none",
    },
    {
      source: "timestamps",
      target: "native.timing",
      transformation: "unsupported-intentionally-omitted",
      confidence: "explicit",
      loss: "unsupported",
    },
    {
      source: "remediation_of / relationships",
      target: "custom.causal",
      transformation: "explicit-only",
      confidence: "explicit",
      loss: "none",
    },
  ],
  knownLosses: [
    "Native AgentInspect JSONL readers do not import this foreign schema as TOOL/LLM runs.",
    "Timestamps intentionally omitted — no fabricated native timing.",
  ],
};

function load(): Trajectory {
  return JSON.parse(readFileSync(trajectoryPath, "utf8")) as Trajectory;
}

function byId(t: Trajectory, id: string): BezalelEvent {
  const e = t.events.find((x) => x.event_id === id);
  if (!e) throw new Error(`missing event ${id}`);
  return e;
}

type Support = "custom" | "native-unsupported" | "lossy";

function evaluateInvariants(t: Trajectory): Array<{
  id: string;
  expected: boolean;
  observed: boolean;
  support: Support;
}> {
  const evt010 = byId(t, "evt_010_r1_candidate_created");
  const evt020 = byId(t, "evt_020_r1_independent_audit_fail");
  const evt030 = byId(t, "evt_030_r2_remediation_candidate_created");
  const evt040 = byId(t, "evt_040_r2_independent_audit_pass");
  const evt050 = byId(t, "evt_050_owner_acceptance");
  const evt055 = byId(t, "evt_055_closure_preflight");
  const evt060 = byId(t, "evt_060_owner_triggers_bounded_closure");
  const evt070 = byId(t, "evt_070_durability_recovery_verification");
  const evt080 = byId(t, "evt_080_independent_closure_audit");

  const inv01 =
    evt010.status === "CANDIDATE_UNACCEPTED" &&
    evt010.authority_decision === "NONE" &&
    evt010.final_acceptance_or_rejection === "NO_ACCEPTANCE_DECISION";

  const inv02 =
    evt040.status === "VERIFICATION_PASSED" &&
    evt040.final_acceptance_or_rejection === "NO_ACCEPTANCE_DECISION" &&
    evt040.authority_decision === "NONE";

  // Failed R1 never gains accepted/canonical authority.
  const inv03 =
    evt020.verification_result?.verdict === "FAIL_MAJOR" &&
    evt060.consequential_mutation.failed_r1_authority_role === "NONE" &&
    !t.events.some(
      (e) =>
        e.event_kind === "authority.source_acceptance" &&
        (e.parent_or_causal_reference ?? []).includes(evt010.event_id) &&
        !(e.parent_or_causal_reference ?? []).includes(evt030.event_id),
    );

  const inv04 =
    evt030.remediation_of?.event_id === evt020.event_id &&
    t.source_lineage.r2_parent_id === t.source_lineage.accepted_base_id &&
    t.source_lineage.r2_is_source_child_of_r1 === false &&
    Boolean(evt030.source_lineage_note?.includes("src_accepted_base_0"));

  const inv05 =
    evt040.event_kind.startsWith("verification.") &&
    evt050.event_kind === "authority.source_acceptance" &&
    evt040.event_kind !== evt050.event_kind;

  const inv06 =
    evt055.consequential_mutation.occurred === false &&
    evt060.actor_id === "actor_owner" &&
    evt060.consequential_mutation.occurred === true &&
    evt060.caused_by_event_id === evt050.event_id;

  const inv07 =
    evt060.consequential_mutation.authoritative_state_transition_count === 1 &&
    evt060.consequential_mutation.durable_retention_binding_count === 1 &&
    evt060.consequential_mutation.other_authority_mutation_count === 0;

  // Presence alone is not enough: every remediation_of edge must agree with the
  // remediating event's remediation_of.event_id (from → remediator, to → failure).
  const remediationEdges = t.relationships.filter((r) => r.kind === "remediation_of");
  const remediationEndpointsAgree =
    remediationEdges.length > 0 &&
    remediationEdges.every((r) => {
      const from = t.events.find((e) => e.event_id === r.from_event_id);
      return from?.remediation_of?.event_id === r.to_event_id;
    });
  // Named R2 edge must itself agree; a decoy matching edge cannot substitute.
  const r2RemediationEdge = remediationEdges.find(
    (r) => r.relationship_id === "rel_r2_remediates_r1_failure",
  );
  const r2EndpointsAgree =
    r2RemediationEdge !== undefined &&
    r2RemediationEdge.from_event_id === evt030.event_id &&
    r2RemediationEdge.to_event_id === evt020.event_id &&
    r2RemediationEdge.explicit === true &&
    evt030.remediation_of?.event_id === evt020.event_id;
  const inv08 =
    t.ordering_model.timestamps === "intentionally_omitted" &&
    remediationEndpointsAgree &&
    r2EndpointsAgree &&
    t.explicit_non_claims.some((c) => /ordering establishes causality/i.test(c));

  const inv09 =
    evt070.final_acceptance_or_rejection !== "ACCEPTED" &&
    evt080.final_acceptance_or_rejection !== "ACCEPTED" &&
    evt070.event_kind.startsWith("verification.") &&
    evt080.event_kind.startsWith("verification.");

  const inv10 = t.explicit_non_claims.some((c) =>
    /replay/i.test(c),
  );

  return [
    { id: "INV-01", expected: true, observed: inv01, support: "custom" },
    { id: "INV-02", expected: true, observed: inv02, support: "custom" },
    { id: "INV-03", expected: true, observed: inv03, support: "custom" },
    { id: "INV-04", expected: true, observed: inv04, support: "custom" },
    { id: "INV-05", expected: true, observed: inv05, support: "custom" },
    { id: "INV-06", expected: true, observed: inv06, support: "custom" },
    { id: "INV-07", expected: true, observed: inv07, support: "custom" },
    { id: "INV-08", expected: true, observed: inv08, support: "custom" },
    { id: "INV-09", expected: true, observed: inv09, support: "custom" },
    { id: "INV-10", expected: true, observed: inv10, support: "custom" },
  ];
}

type Mutation = {
  id: string;
  expectedFail: string;
  apply: (t: Trajectory) => Trajectory;
};

const mutations: Mutation[] = [
  {
    id: "M-accept-candidate",
    expectedFail: "INV-01",
    apply: (t) => {
      const copy = structuredClone(t);
      const e = byId(copy, "evt_010_r1_candidate_created");
      e.status = "SOURCE_ACCEPTED";
      e.authority_decision = "ACCEPT";
      e.final_acceptance_or_rejection = "ACCEPTED";
      return copy;
    },
  },
  {
    id: "M-audit-as-authority",
    expectedFail: "INV-02",
    apply: (t) => {
      const copy = structuredClone(t);
      const e = byId(copy, "evt_040_r2_independent_audit_pass");
      e.final_acceptance_or_rejection = "ACCEPTED";
      e.authority_decision = "ACCEPT_R2_AS_PASS_CANDIDATE";
      return copy;
    },
  },
  {
    id: "M-r1-authority",
    expectedFail: "INV-03",
    apply: (t) => {
      const copy = structuredClone(t);
      byId(copy, "evt_060_owner_triggers_bounded_closure").consequential_mutation
        .failed_r1_authority_role = "CANONICAL";
      return copy;
    },
  },
  {
    id: "M-rewrite-lineage",
    expectedFail: "INV-04",
    apply: (t) => {
      const copy = structuredClone(t);
      copy.source_lineage.r2_is_source_child_of_r1 = true;
      byId(copy, "evt_030_r2_remediation_candidate_created").remediation_of = {
        event_id: "evt_010_r1_candidate_created",
      };
      return copy;
    },
  },
  {
    id: "M-collapse-acceptance",
    expectedFail: "INV-05",
    apply: (t) => {
      const copy = structuredClone(t);
      byId(copy, "evt_050_owner_acceptance").event_kind =
        "verification.independent_audit";
      return copy;
    },
  },
  {
    id: "M-preparer-mutates",
    expectedFail: "INV-06",
    apply: (t) => {
      const copy = structuredClone(t);
      byId(copy, "evt_055_closure_preflight").consequential_mutation.occurred = true;
      return copy;
    },
  },
  {
    id: "M-mutation-counts",
    expectedFail: "INV-07",
    apply: (t) => {
      const copy = structuredClone(t);
      byId(copy, "evt_060_owner_triggers_bounded_closure").consequential_mutation
        .authoritative_state_transition_count = 2;
      return copy;
    },
  },
  {
    id: "M-drop-relationship",
    expectedFail: "INV-08",
    apply: (t) => {
      const copy = structuredClone(t);
      copy.relationships = copy.relationships.filter(
        (r) => r.kind !== "remediation_of",
      );
      return copy;
    },
  },
  {
    // Relationship source only — event remediation_of fields unchanged.
    id: "M-rel-source-only",
    expectedFail: "INV-08",
    apply: (t) => {
      const copy = structuredClone(t);
      const edge = copy.relationships.find(
        (r) => r.relationship_id === "rel_r2_remediates_r1_failure",
      );
      if (!edge) throw new Error("missing remediation edge");
      edge.from_event_id = "evt_040_r2_independent_audit_pass";
      return copy;
    },
  },
  {
    // Relationship target only — event remediation_of fields unchanged.
    id: "M-rel-target-only",
    expectedFail: "INV-08",
    apply: (t) => {
      const copy = structuredClone(t);
      const edge = copy.relationships.find(
        (r) => r.relationship_id === "rel_r2_remediates_r1_failure",
      );
      if (!edge) throw new Error("missing remediation edge");
      edge.to_event_id = "evt_010_r1_candidate_created";
      return copy;
    },
  },
  {
    // Broken R2 edge cannot be hidden by another explicit remediation_of.
    id: "M-unrelated-remediation-hides",
    expectedFail: "INV-08",
    apply: (t) => {
      const copy = structuredClone(t);
      const edge = copy.relationships.find(
        (r) => r.relationship_id === "rel_r2_remediates_r1_failure",
      );
      if (!edge) throw new Error("missing remediation edge");
      edge.to_event_id = "evt_010_r1_candidate_created";
      copy.relationships.push({
        relationship_id: "rel_decoy_remediation",
        kind: "remediation_of",
        from_event_id: "evt_030_r2_remediation_candidate_created",
        to_event_id: "evt_020_r1_independent_audit_fail",
        explicit: true,
      });
      return copy;
    },
  },
  {
    id: "M-second-acceptance",
    expectedFail: "INV-09",
    apply: (t) => {
      const copy = structuredClone(t);
      byId(copy, "evt_070_durability_recovery_verification").final_acceptance_or_rejection =
        "ACCEPTED";
      return copy;
    },
  },
  {
    id: "M-fabricate-replay",
    expectedFail: "INV-10",
    apply: (t) => {
      const copy = structuredClone(t);
      copy.explicit_non_claims = copy.explicit_non_claims.filter(
        (c) => !/replay/i.test(c),
      );
      return copy;
    },
  },
];

console.log("bezalel-pilot-invariants:");
console.log(`  mappingLedger: ${MAPPING_LEDGER.id}`);
console.log("  native-jsonl: unsupported (foreign semantic-summary)");

const bytes = readFileSync(trajectoryPath);
const digest = createHash("sha256").update(bytes).digest("hex");
const recorded = readFileSync(
  path.join(fixtureDir, "trajectory.sha256.txt"),
  "utf8",
).trim();
if (digest !== recorded) {
  console.error("trajectory digest drift", { digest, recorded });
  process.exitCode = 1;
}

const base = load();
if (base.events.length !== 9) {
  throw new Error(`expected 9 ordinal events, got ${base.events.length}`);
}
if (base.ordering_model.timestamps !== "intentionally_omitted") {
  throw new Error("must not invent timestamps");
}

// Native reader must not silently accept the foreign schema as a successful run.
let nativeUnsupported = false;
try {
  const native = await openTraceFile(trajectoryPath);
  nativeUnsupported = native.events.length === 0 || native.format !== "agent-inspect";
} catch {
  nativeUnsupported = true;
}
console.log(
  `  native-openTraceFile: ${nativeUnsupported ? "unsupported/lossy" : "unexpected-success"}`,
);

const invResults = evaluateInvariants(base);
for (const row of invResults) {
  const status = row.observed === row.expected ? "PASS" : "FAIL";
  console.log(
    `  ${row.id}: expected=${row.expected} observed=${row.observed} ${status} support=${row.support}`,
  );
}

console.log("mutation-controls:");
const mutationResults: Array<{ id: string; expectedFail: string; failed: string[] }> =
  [];
for (const m of mutations) {
  const mutated = m.apply(base);
  const failed = evaluateInvariants(mutated)
    .filter((r) => r.observed !== r.expected)
    .map((r) => r.id);
  mutationResults.push({ id: m.id, expectedFail: m.expectedFail, failed });
  const ok = failed.includes(m.expectedFail);
  console.log(
    `  ${m.id}: expectFail=${m.expectedFail} failed=[${failed.join(",")}] ${ok ? "PASS" : "FAIL"}`,
  );
}

console.log(
  `classes: ${invResults.map((r) => `${r.id}:${r.observed === r.expected ? "pass" : "fail"}`).join(",")}`,
);

const invMismatch = invResults.filter((r) => r.observed !== r.expected);
const mutMismatch = mutationResults.filter(
  (m) => !m.failed.includes(m.expectedFail),
);
if (invMismatch.length || mutMismatch.length || !nativeUnsupported) {
  console.error("invariant or mutation mismatches", { invMismatch, mutMismatch });
  process.exitCode = 1;
}
