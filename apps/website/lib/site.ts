export const site = {
  name: "agent-inspect",
  title:
    "agent-inspect — Local-first evidence for TypeScript AI agents",
  description:
    "Local evidence debugger and trajectory-test toolkit for TypeScript AI agents — framework-faithful execution trees, TraceFacts, TraceContract, Evidence v2, and read-only MCP without a collector or default upload.",
  keywords: [
    "TypeScript AI agents",
    "AI agent trajectory testing",
    "TypeScript agent debugging",
    "TraceFacts",
    "TraceContract",
    "Evidence v2",
    "LangGraph",
    "MCP coding-agent debug loop",
    "local-first observability",
    "AI agent CI gates",
    "share-checked evidence",
  ],
  url: "https://agentinspect.vercel.app",
  github: "https://github.com/rajudandigam/agent-inspect",
  githubDocs: "https://github.com/rajudandigam/agent-inspect/blob/main/docs",
  npm: "https://www.npmjs.com/package/agent-inspect",
  license: "MIT",
  installCommand: "npm install agent-inspect",
  badges: {
    npmVersion: "https://img.shields.io/npm/v/agent-inspect",
    npmDownloads: "https://img.shields.io/npm/dm/agent-inspect",
    githubStars: "https://img.shields.io/github/stars/rajudandigam/agent-inspect",
    githubLicense: "https://img.shields.io/github/license/rajudandigam/agent-inspect",
  },
} as const;

export function githubDoc(path: string): string {
  return `${site.githubDocs}/${path}`;
}
