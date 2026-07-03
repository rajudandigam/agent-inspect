import type { ReactNode } from "react";

import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsCardGrid } from "@/components/docs/DocsCardGrid";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { githubDoc, site } from "@/lib/site";

export function renderDocContent(slug: string): ReactNode {
  switch (slug) {
    case "":
      return <DocsHomeContent />;
    case "getting-started":
      return <GettingStartedContent />;
    case "concepts/local-first":
      return <LocalFirstContent />;
    case "concepts/trace-check-redact":
      return <TraceCheckRedactContent />;
    case "integrations":
      return <IntegrationsContent />;
    case "integrations/ai-sdk":
      return <AiSdkContent />;
    case "integrations/openai-agents":
      return <OpenAiAgentsContent />;
    case "integrations/langchain":
      return <LangChainContent />;
    case "cli":
      return <CliContent />;
    case "safe-sharing":
      return <SafeSharingContent />;
    case "ci":
      return <CiContent />;
    case "compare":
      return <CompareContent />;
    case "contributing":
      return <ContributingContent />;
    default:
      return null;
  }
}

function DocsHomeContent() {
  return (
    <>
      <h2 id="start-here">Start here</h2>
      <p>
        AgentInspect is local-first trace + check + redact for TypeScript AI
        agents. These pages are a starter shell. Canonical detail still lives in
        the repository docs on GitHub.
      </p>
      <DocsCardGrid
        cards={[
          {
            title: "First trace in 5 minutes",
            description: "Install, demo, inspect, check, and share-safe artifact.",
            href: "/docs/getting-started",
          },
          {
            title: "Concepts",
            description: "Local-first defaults and the trace/check/redact loop.",
            href: "/docs/concepts/local-first",
          },
        ]}
      />

      <h2 id="browse">Browse by topic</h2>
      <DocsCardGrid
        cards={[
          {
            title: "Integrations",
            description: "Manual, AI SDK, OpenAI Agents, LangChain, and more.",
            href: "/docs/integrations",
          },
          {
            title: "CLI",
            description: "High-level command groups for local workflows.",
            href: "/docs/cli",
          },
          {
            title: "Safe trace sharing",
            description: "Redact and verify before PRs and issues.",
            href: "/docs/safe-sharing",
          },
          {
            title: "CI",
            description: "Deterministic checks and redacted CI artifacts.",
            href: "/docs/ci",
          },
          {
            title: "Compare",
            description: "How AgentInspect relates to logs, hosted tools, and OTel.",
            href: "/docs/compare",
          },
          {
            title: "Contributing",
            description: "Good first contribution surfaces.",
            href: "/docs/contributing",
          },
        ]}
      />
    </>
  );
}

function GettingStartedContent() {
  return (
    <>
      <h2 id="install">Install</h2>
      <DocsCodeBlock code="npm install agent-inspect" />

      <h2 id="init">Init</h2>
      <DocsCodeBlock code="npx agent-inspect init --yes" />
      <p>
        Creates `agent-inspect.config.ts`, `.agent-inspect/`, and
        `examples/agent-inspect-demo.mjs`.
      </p>

      <h2 id="demo">Run deterministic demo</h2>
      <DocsCodeBlock code="node examples/agent-inspect-demo.mjs" />
      <DocsCallout tone="info" title="No API keys">
        The init demo is deterministic and works without provider credentials.
      </DocsCallout>

      <h2 id="inspect">List and view traces</h2>
      <DocsCodeBlock
        code={`npx agent-inspect list --dir .agent-inspect
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect`}
      />

      <h2 id="check">Check traces</h2>
      <DocsCodeBlock
        code="npx agent-inspect check .agent-inspect/*.jsonl --require-completed --detect-stalls"
      />

      <h2 id="share">Redact and verify safe</h2>
      <DocsCodeBlock
        code={`npx agent-inspect redact --profile share --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect`}
      />

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          <a href={githubDoc("FIRST-TRACE-IN-5-MINUTES.md")}>
            Full reference in GitHub docs
          </a>
        </li>
        <li>
          <a href="/docs/integrations">Pick an integration path</a>
        </li>
        <li>
          <a href="/docs/safe-sharing">Read the safe sharing guide</a>
        </li>
      </ul>
    </>
  );
}

function LocalFirstContent() {
  return (
    <>
      <h2 id="what-local-first-means">What local-first means</h2>
      <ul>
        <li>Traces stay local by default</li>
        <li>No account required</li>
        <li>No upload by default</li>
        <li>No hosted dashboard required for the core loop</li>
      </ul>

      <h2 id="jsonl-on-disk">JSONL on disk</h2>
      <p>
        Runs are persisted as JSONL files you own, typically under
        `.agent-inspect/` or `AGENT_INSPECT_TRACE_DIR`. You can inspect, check,
        redact, and attach them like any other local artifact.
      </p>

      <h2 id="where-it-fits">Where it fits</h2>
      <p>
        Local debugging, CI artifacts, safe trace sharing, and adapter
        development. For production fleets and team dashboards, use hosted
        observability or OpenTelemetry — AgentInspect is complementary.
      </p>
      <p>
        <a href={githubDoc("ADOPTION.md")}>Full reference in GitHub docs</a>
      </p>
    </>
  );
}

function TraceCheckRedactContent() {
  return (
    <>
      <h2 id="trace">Trace what happened</h2>
      <p>
        Capture manual steps, framework adapters, logs, harness runs, and
        CI/test artifacts as an execution tree.
      </p>

      <h2 id="check">Check what should have happened</h2>
      <p>
        Run deterministic checks for completion, stalls, failures, and
        regressions in local or CI environments.
      </p>

      <h2 id="redact">Redact what must not leave your machine</h2>
      <p>
        Use redaction profiles and `verify-safe` before opening issues, reviewing
        PRs, or talking with design partners.
      </p>
      <DocsCallout tone="safety" title="Metadata-only by default">
        AgentInspect defaults to metadata-only capture. Do not assume prompts or
        outputs are present unless you opted into content capture.
      </DocsCallout>
      <p>
        <a href={githubDoc("TECHNICAL-GUIDE.md")}>
          Full reference in GitHub docs
        </a>
      </p>
    </>
  );
}

function IntegrationsContent() {
  return (
    <>
      <h2 id="paths">Integration paths</h2>
      <DocsCardGrid
        cards={[
          {
            title: "Manual instrumentation",
            description: "`inspectRun`, `step`, `step.tool`, `step.llm`, `observe`.",
            href: githubDoc("API.md"),
            external: true,
          },
          {
            title: "AI SDK",
            description: "Vercel AI SDK telemetry integration.",
            href: "/docs/integrations/ai-sdk",
          },
          {
            title: "OpenAI Agents",
            description: "Local processor for OpenAI Agents JS.",
            href: "/docs/integrations/openai-agents",
          },
          {
            title: "LangChain",
            description: "Callback handler with persisted local traces.",
            href: "/docs/integrations/langchain",
          },
          {
            title: "Logs",
            description: "Structured log ingest into local trees.",
            href: githubDoc("LOG-TO-TREE-QUICKSTART.md"),
            external: true,
          },
          {
            title: "Harness",
            description: "Fixture runner for real project integrations.",
            href: `${site.github}/tree/main/packages/harness`,
            external: true,
          },
          {
            title: "CI / tests",
            description: "Vitest/Jest reporters and CLI checks.",
            href: "/docs/ci",
          },
          {
            title: "Adapter SDK",
            description: "Build community adapters with conformance guidance.",
            href: `${site.github}/tree/main/packages/adapter-sdk`,
            external: true,
          },
        ]}
      />
    </>
  );
}

function AiSdkContent() {
  return (
    <>
      <h2 id="install">Install</h2>
      <DocsCodeBlock code="npm install agent-inspect @agent-inspect/ai-sdk ai" />

      <h2 id="example">Example</h2>
      <DocsCodeBlock
        language="ts"
        code={`import { generateText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

await generateText({
  model: yourModel,
  prompt: "Hello",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: ".agent-inspect",
        runName: "support-agent",
        capture: "metadata-only",
      }),
    ],
  },
});`}
      />

      <h2 id="privacy">Privacy</h2>
      <ul>
        <li>Keep `recordInputs: false` and `recordOutputs: false` unless you accept content capture risk</li>
        <li>Default capture is `metadata-only`</li>
        <li>Traces write locally to `traceDir`</li>
      </ul>
      <p>
        <a href={githubDoc("AI-SDK-ADOPTION.md")}>
          Full reference in GitHub docs
        </a>
      </p>
    </>
  );
}

function OpenAiAgentsContent() {
  return (
    <>
      <h2 id="local-only">Local-only mode</h2>
      <p>
        Prefer `setTraceProcessors([agentInspect(...)])` when you want AgentInspect
        traces without OpenAI&apos;s default export pipeline. Using
        `addTraceProcessor` may leave the default export enabled.
      </p>

      <h2 id="example">Example</h2>
      <DocsCodeBlock
        language="ts"
        code={`import { setTraceProcessors } from "@openai/agents";
import { agentInspect } from "@agent-inspect/openai-agents";

setTraceProcessors([
  agentInspect({
    traceDir: ".agent-inspect",
    capture: "metadata-only",
  }),
]);`}
      />

      <h2 id="privacy">Privacy notes</h2>
      <DocsCallout tone="warning" title="Processor replacement is not full network isolation">
        Replacing processors does not by itself redact OpenAI SDK network traffic.
        Review OpenAI SDK settings separately.
      </DocsCallout>
      <p>
        <a href={githubDoc("OPENAI-AGENTS-LOCAL.md")}>
          Full reference in GitHub docs
        </a>
      </p>
    </>
  );
}

function LangChainContent() {
  return (
    <>
      <h2 id="install">Install</h2>
      <DocsCodeBlock code="npm install agent-inspect @agent-inspect/langchain @langchain/core" />

      <h2 id="example">Example</h2>
      <DocsCodeBlock
        language="ts"
        code={`import { AgentInspectCallback } from "@agent-inspect/langchain";

const handler = new AgentInspectCallback({
  traceDir: ".agent-inspect",
  runName: "my-chain",
  persist: true,
});

// Pass handler to your chain / runnable callbacks`}
      />

      <h2 id="privacy">Privacy</h2>
      <p>
        Keep `capture: &quot;metadata-only&quot;` for shareable examples. Review
        `preview` traces carefully because previews can include prompt or output
        fragments.
      </p>
      <p>
        <a href={githubDoc("ADAPTERS.md")}>Full reference in GitHub docs</a>
      </p>
    </>
  );
}

function CliContent() {
  return (
    <>
      <h2 id="overview">Overview</h2>
      <p>
        The CLI is local-first and read-only by default where possible. Exports
        write local files only. There is no upload and no vendor sink.
      </p>

      <h2 id="command-groups">Command groups</h2>
      <ul>
        <li>`init`, `doctor` — scaffold and diagnose local setup</li>
        <li>`list`, `view`, `report`, `what`, `timeline`, `stats`, `search` — inspect</li>
        <li>`check`, `eval` — deterministic quality gates</li>
        <li>`redact`, `scan`, `verify-safe` — safe sharing</li>
        <li>`export`, `artifacts`, `ci-summary` — local artifacts</li>
        <li>`diff`, `sessions`, `session` — compare and multi-run workflows</li>
        <li>`logs`, `tail`, `open`, `migrate` — ingest and compatibility</li>
      </ul>
      <p>
        <a href={githubDoc("CLI.md")}>Full reference in GitHub docs</a>
      </p>
    </>
  );
}

function SafeSharingContent() {
  return (
    <>
      <h2 id="why">Why it matters</h2>
      <p>
        Traces are local files, but they may still contain sensitive metadata you
        attached, collected from logs, or included through optional preview
        settings. Do not share raw traces by default.
      </p>

      <h2 id="workflow">Workflow</h2>
      <DocsCodeBlock
        code={`npx agent-inspect redact --profile share --dir .agent-inspect
npx agent-inspect verify-safe --dir .agent-inspect`}
      />
      <ul>
        <li>Use `--profile share` for PR/issue attachments</li>
        <li>Use `--profile strict` for wider or public sharing</li>
        <li>Review the output file before attaching it</li>
      </ul>

      <h2 id="limits">Limits</h2>
      <DocsCallout tone="safety" title="Best-effort, not certification">
        Redaction profiles are key-based safeguards, not compliance-grade DLP or
        regulatory certifications.
      </DocsCallout>
      <p>
        <a href={githubDoc("SAFE-TRACE-SHARING.md")}>
          Full reference in GitHub docs
        </a>
      </p>
    </>
  );
}

function CiContent() {
  return (
    <>
      <h2 id="pattern">CI pattern</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
        <li>Install `agent-inspect` in CI</li>
        <li>Write traces locally during tests or fixtures</li>
        <li>Run deterministic checks</li>
        <li>Create redacted artifacts</li>
        <li>Upload with your CI platform (AgentInspect does not upload)</li>
      </ol>

      <h2 id="checks">Checks</h2>
      <DocsCodeBlock
        code="npx agent-inspect check .agent-inspect/*.jsonl --require-completed --detect-stalls"
      />

      <h2 id="artifacts">Artifacts</h2>
      <DocsCodeBlock
        code={`npx agent-inspect artifacts <run-id> --dir ./.agent-inspect \\
  --output-dir ./artifacts --github-summary "$GITHUB_STEP_SUMMARY"`}
      />
      <p>
        Prefer deterministic fixtures and redacted outputs for PR review.
      </p>
      <p>
        <a href={githubDoc("CI-ARTIFACTS.md")}>Full reference in GitHub docs</a>
      </p>
    </>
  );
}

function CompareContent() {
  return (
    <>
      <h2 id="positioning">Positioning</h2>
      <p>
        AgentInspect is for the local developer loop. Hosted observability
        platforms are for production fleets, team dashboards, and longer-lived
        eval workflows. OpenTelemetry is a platform observability foundation.
        They can complement each other.
      </p>

      <h2 id="table">Comparison</h2>
      <ul>
        <li>
          <strong>agent-inspect:</strong> local-first, no account, no upload by
          default, execution trees, CLI checks, safe redaction
        </li>
        <li>
          <strong>console.log:</strong> local and simple, but flat and manual
        </li>
        <li>
          <strong>Hosted observability:</strong> great for production monitoring
          and team collaboration; usually requires account/ingestion
        </li>
        <li>
          <strong>Raw OpenTelemetry:</strong> vendor-neutral and powerful;
          requires collector/backend/viewer decisions
        </li>
      </ul>
      <p>
        <a href={githubDoc("COMPARE.md")}>Full reference in GitHub docs</a>
      </p>
    </>
  );
}

function ContributingContent() {
  return (
    <>
      <h2 id="good-first">Good first contributions</h2>
      <ul>
        <li>Docs and examples</li>
        <li>Fixtures and recipes</li>
        <li>Community adapters</li>
        <li>VS Code / viewer polish</li>
        <li>Safe-sharing and CI guidance improvements</li>
      </ul>

      <h2 id="boundaries">Boundaries</h2>
      <p>
        Avoid core schema changes, new root/core dependencies, or network
        behavior changes unless a maintainer explicitly approves them.
      </p>
      <p>
        <a href={`${site.github}/issues`}>Browse GitHub issues</a>
        {" · "}
        <a href={githubDoc("community/CONTRIBUTING.md")}>
          Full reference in GitHub docs
        </a>
      </p>
    </>
  );
}
