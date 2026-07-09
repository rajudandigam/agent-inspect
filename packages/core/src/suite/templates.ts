import type { SuiteConfig } from "./types.js";

export const SUITE_TEMPLATE_IDS = [
  "customer-support-agent",
  "refund-agent",
  "sales-assistant",
  "browser-task-agent",
  "mcp-tool-agent",
  "workflow-agent",
  "rag-answer-agent",
  "human-approval-agent",
] as const;

export type SuiteTemplateId = (typeof SUITE_TEMPLATE_IDS)[number];

function baseTemplate(name: string, cases: SuiteConfig["cases"]): SuiteConfig {
  return {
    name,
    traces: "./.agent-inspect",
    cases,
    checks: {
      select: ["run.status", "outcome.status"],
      run: { maxDurationMs: 60_000 },
    },
    redactionProfile: "local",
    artifacts: { outputDir: ".agent-inspect/suite-runs" },
  };
}

const TEMPLATES: Record<SuiteTemplateId, SuiteConfig> = {
  "customer-support-agent": baseTemplate("customer-support-agent", [
    {
      id: "support-ticket",
      runId: "support-ticket",
      requireTools: ["searchDocs"],
      forbidTools: ["deleteAccount"],
      expectedObservations: ["answerReady"],
      maxDurationMs: 45_000,
    },
  ]),
  "refund-agent": baseTemplate("refund-agent", [
    {
      id: "refund-flow",
      runId: "refund-flow",
      requireTools: ["searchDocs"],
      forbidTools: ["deleteAccount"],
      expectedObservations: ["policyShown"],
      maxDurationMs: 30_000,
    },
  ]),
  "sales-assistant": baseTemplate("sales-assistant", [
    {
      id: "quote-request",
      runId: "quote-request",
      requireTools: ["lookupPricing"],
      maxDurationMs: 30_000,
    },
  ]),
  "browser-task-agent": baseTemplate("browser-task-agent", [
    {
      id: "browser-nav",
      runId: "browser-nav",
      requireTools: ["browserNavigate"],
      maxDurationMs: 120_000,
    },
  ]),
  "mcp-tool-agent": baseTemplate("mcp-tool-agent", [
    {
      id: "mcp-call",
      runId: "mcp-call",
      requireTools: ["mcp:tools/list"],
      maxDurationMs: 30_000,
    },
  ]),
  "workflow-agent": baseTemplate("workflow-agent", [
    {
      id: "workflow-handoff",
      runId: "workflow-handoff",
      requireTools: ["handoff"],
      maxDurationMs: 60_000,
    },
  ]),
  "rag-answer-agent": baseTemplate("rag-answer-agent", [
    {
      id: "rag-answer",
      runId: "rag-answer",
      requireTools: ["retrieve", "answer"],
      expectedObservations: ["citationShown"],
      maxDurationMs: 45_000,
    },
  ]),
  "human-approval-agent": baseTemplate("human-approval-agent", [
    {
      id: "approval-gate",
      runId: "approval-gate",
      expectedObservations: ["approvalRequested", "approvalGranted"],
      maxDurationMs: 60_000,
    },
  ]),
};

export function listSuiteTemplates(): SuiteTemplateId[] {
  return [...SUITE_TEMPLATE_IDS];
}

export function getSuiteTemplate(id: string): SuiteConfig | undefined {
  if (!(SUITE_TEMPLATE_IDS as readonly string[]).includes(id)) return undefined;
  return structuredClone(TEMPLATES[id as SuiteTemplateId]);
}

export function resolveSuiteTemplate(id: string): SuiteConfig {
  const template = getSuiteTemplate(id);
  if (template === undefined) {
    throw new Error(
      `Unknown suite template "${id}". Available: ${SUITE_TEMPLATE_IDS.join(", ")}`,
    );
  }
  return template;
}
