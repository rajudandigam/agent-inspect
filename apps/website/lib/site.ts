export const site = {
  name: "agent-inspect",
  title: "agent-inspect — Local-first AI agent tracing for TypeScript",
  description:
    "Trace, check, and redact TypeScript AI agent runs locally. No account, no upload, metadata-only by default. CLI-first debugging for AI SDK, OpenAI Agents, LangChain, CI, and real projects.",
  keywords: [
    "TypeScript AI agents",
    "AI agent tracing",
    "local-first observability",
    "agent debugging",
    "AI SDK tracing",
    "OpenAI Agents tracing",
    "LangChain tracing",
    "AI agent CI checks",
    "safe trace sharing",
  ],
  url: "https://agent-inspect.dev",
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
