import { redact } from "@agent-inspect/redact";

const source = {
  runId: "support-fixture",
  requestId: "req-fixture-123",
  userEmail: "person@example.test",
  metadata: {
    apiKey: "FIXTURE_TOKEN_REDACT_ME",
    answer: "Refunds are available within 30 days.",
  },
};

const result = redact(source, { profile: "share" });
const serialized = JSON.stringify(result.value, null, 2);

console.log("Redact share-safe file recipe complete");
console.log(`Profile: ${result.profile}`);
console.log(`Redacted: ${result.redacted}`);
console.log(`Findings: ${result.findings.length}`);
console.log(`Output contains placeholder: ${serialized.includes("[REDACTED]")}`);
console.log("");
console.log("CLI equivalent:");
console.log("  npx agent-inspect redact trace.jsonl --profile share --json");
