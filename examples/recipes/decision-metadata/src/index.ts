/**
 * Safe decision metadata: record WHICH routing decision was made and under
 * WHAT configuration (policy version, feature flags, chosen route) without
 * recording chain-of-thought, raw prompts, or model reasoning.
 */
import path from "node:path";

import { inspectRun, step } from "agent-inspect";

const silent = process.env.AGENT_INSPECT_SILENT === "true";
const traceDir = path.join(process.cwd(), ".agent-inspect-runs");

// Deterministic fake decision context, the kind a router would compute from
// config and request attributes. Safe: identifiers, versions, flags, scores.
const decisionContext = {
  decisionId: "dec-routing-0001",
  groupId: "grp-support-tickets",
  policyVersion: "routing-policy-v7",
  featureFlags: { fastLaneEnabled: true, betaSummarizer: false },
};

const routed = await inspectRun(
  "decision-metadata-recipe",
  async () => {
    const route = await step("choose-route", async () => {
      // The router picks a tier from bounded, structured signals only.
      const signals = { queueDepth: 3, priority: "standard", locale: "en" };
      const chosen = signals.queueDepth < 5 ? "fast-lane" : "deep-review";
      return { chosen, signals };
    }, {
      metadata: {
        policyVersion: decisionContext.policyVersion,
        candidateRoutes: ["fast-lane", "deep-review"],
      },
    });

    await step.tool("resolve-ticket", async () => ({ resolved: true }), {
      metadata: {
        routeChosen: route.chosen,
        routeReasonCode: "queue-depth-below-threshold",
      },
    });

    return route.chosen;
  },
  { silent, traceDir, metadata: decisionContext },
);

console.log("\nRoute chosen:", routed);
console.log("\nSafe fields recorded: decisionId, groupId, policyVersion,");
console.log("featureFlags, candidateRoutes, routeChosen, routeReasonCode.");
console.log("Not recorded: chain-of-thought, prompts, model reasoning.");
console.log("\nNext:");
console.log("  npx agent-inspect list --dir ./.agent-inspect-runs");
console.log("  npx agent-inspect view <run_id> --dir ./.agent-inspect-runs");
console.log("  npx agent-inspect report <run_id> --dir ./.agent-inspect-runs");
