export const marketingRoutes = {
  caseStudyLangGraph: "/case-study/langgraph",
  localDebugging: "/use-cases/local-agent-debugging",
  trajectoryGates: "/use-cases/trajectory-gates",
  portableEvidence: "/use-cases/portable-evidence",
  noEgress: "/use-cases/no-egress",
  langgraphIntegration: "/integrations/langgraph",
} as const;

export const marketingAnchors = {
  problem: "#problem",
  path: "#five-minute-path",
  loop: "#product-loop",
  features: "#features",
  examples: "#code-examples",
  useCases: "#use-cases",
  compare: "#compare",
  faq: "#faq",
} as const;

export const docsRoutes = {
  home: "/docs",
  gettingStarted: "/docs/getting-started",
  localFirst: "/docs/concepts/local-first",
  traceCheckRedact: "/docs/concepts/trace-check-redact",
  integrations: "/docs/integrations",
  aiSdk: "/docs/integrations/ai-sdk",
  openaiAgents: "/docs/integrations/openai-agents",
  langchain: "/docs/integrations/langchain",
  langgraph: "/docs/integrations/langgraph",
  traceFacts: "/docs/trace-facts",
  contracts: "/docs/trace-contracts",
  testMatchers: "/docs/test-matchers",
  evidenceV2: "/docs/evidence-v2",
  codingAgentLoop: "/docs/coding-agent-loop",
  noEgress: "/docs/no-egress",
  decisionGuide: "/docs/decision-guide",
  cli: "/docs/cli",
  safeSharing: "/docs/safe-sharing",
  ci: "/docs/ci",
  compare: "/docs/compare",
  contributing: "/docs/contributing",
} as const;
