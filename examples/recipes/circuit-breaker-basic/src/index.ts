import { runCircuits } from "@agent-inspect/circuit";

const events = Array.from({ length: 6 }, (_, index) => ({
  eventId: `e-${index}`,
  name: "tool:search",
  kind: "tool",
  attributes: { toolName: "search", arguments: { q: "same" } },
}));

const result = runCircuits(events, {
  rules: ["circuit.same-tool-repetition", "circuit.same-args-repetition"],
  sameToolRepetition: { maxRepeats: 3 },
  sameArgsRepetition: { maxRepeats: 2 },
});

console.log(JSON.stringify(result, null, 2));
