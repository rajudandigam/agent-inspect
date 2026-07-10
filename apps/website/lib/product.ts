/**
 * Public product metadata for the marketing site.
 * Keep in sync with root package.json + .changeset fixed group + docs/SUPPORT-LEVELS.md.
 */
export const product = {
  version: "6.7.2",
  publicPackageCount: 18,
  releaseStatus: "Technical launch candidate · external pilot evidence pending",
  v7Scheduled: false,
  trustLine:
    "No account · no default upload · metadata-only by default · optional customer-owned Studio",
  headline: "Debug, regression-test, and safely share AI-agent behavior locally",
  subheadline:
    "From one broken run to a deterministic contract, CI gate, and verified-safe bundle—without sending traces to AgentInspect.",
  fiveMinuteCommands: `npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
# copy <run-id> from list, then:
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect check <run-id> --dir .agent-inspect
npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share
npx agent-inspect verify-safe <run-id> --dir .agent-inspect`,
} as const;
