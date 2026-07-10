export const site = {
  name: "agent-inspect",
  title: "agent-inspect — Debug, regression-test, and safely share TypeScript AI-agent behavior locally",
  description:
    "Local trajectory evidence for TypeScript agents: execution trees, TraceContract checks, CI gates, verified-safe bundles, and optional customer-owned Studio. No account, no default upload, metadata-only by default.",
  keywords: [
    "TypeScript AI agents",
    "AI agent trajectory testing",
    "TypeScript agent debugging",
    "AI agent CI gates",
    "trace contracts",
    "safe trace bundles",
    "self-hosted agent trace viewer",
    "MCP trace debugging",
    "OpenInference TypeScript",
    "local-first observability",
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
