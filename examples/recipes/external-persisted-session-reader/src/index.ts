/**
 * external-persisted-session-reader — normalize synthetic foreign session JSON.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildTraceFacts } from "agent-inspect/checks";
import { DEFAULT_TRACE_READERS, openTrace } from "agent-inspect/readers";

import { syntheticSessionReader } from "./session-reader.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, "..", "fixture", "session.json");

const read = await openTrace(
  { type: "file", path: fixturePath },
  { readers: [syntheticSessionReader, ...DEFAULT_TRACE_READERS] },
);

const facts = buildTraceFacts(read);

console.log("format:", read.format);
console.log("events:", read.events.length);
console.log("warnings:", read.warnings.map((w) => w.code).join(",") || "(none)");
console.log("unsupportedFields:", read.unsupportedFields.join(",") || "(none)");
console.log("finishedTools:", facts.summary.finishedToolNames.join(",") || "(none)");
console.log("ok");
