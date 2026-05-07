import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * v0.3 spike only (standalone, Node built-ins only).
 *
 * Goals:
 * - JSON logs are first-class (line-delimited JSON).
 * - log4js logs are best-effort: extract embedded valid JSON payloads only.
 * - Flat grouped timeline by default (no timestamp-only nesting).
 * - Confidence labels are mandatory.
 * - Redaction is visible in output.
 *
 * NOTE on LLM pairing:
 * For this spike we conservatively pair the known LLM start/completed event family
 * into a single display row when:
 * - both events map to the same display name
 * - they share the same runId
 * - the completed event has an explicit durationMs
 *
 * This is *not* general tree inference and does not create parent/child nesting.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readText(file) {
  return fs.readFileSync(path.join(__dirname, file), "utf8");
}

function safeJsonParse(line) {
  try {
    return { ok: true, value: JSON.parse(line) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function parseJsonLines(text, warnings) {
  const records = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    const parsed = safeJsonParse(line);
    if (!parsed.ok) {
      warnings.push({
        kind: "malformed-json-line",
        line: i + 1,
        message: parsed.error,
      });
      continue;
    }
    if (parsed.value && typeof parsed.value === "object") {
      records.push({ record: parsed.value, sourceLine: i + 1 });
    } else {
      warnings.push({
        kind: "non-object-json-line",
        line: i + 1,
        message: "JSON line is not an object",
      });
    }
  }
  return records;
}

function extractEmbeddedJsonPayload(line) {
  const idx = line.indexOf("{");
  if (idx < 0) return undefined;
  const candidate = line.slice(idx);
  const parsed = safeJsonParse(candidate);
  if (!parsed.ok) return undefined;
  if (!parsed.value || typeof parsed.value !== "object") return undefined;
  return parsed.value;
}

function parseLog4js(text, warnings) {
  const records = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    const payload = extractEmbeddedJsonPayload(line);
    if (!payload) {
      warnings.push({
        kind: "log4js-no-json-payload",
        line: i + 1,
        message: "No valid embedded JSON payload found",
      });
      continue;
    }
    records.push({ record: payload, sourceLine: i + 1 });
  }
  return records;
}

function loadConfig() {
  const raw = readText("agent-inspect.logs.json");
  const parsed = JSON.parse(raw);
  return parsed;
}

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeWildcardRegex(pattern) {
  // Support simple patterns like proactive.tool.* and *.error.
  // We implement "*" as "match any characters".
  const re = "^" + escapeRegExp(pattern).replace(/\\\*/g, ".*") + "$";
  return new RegExp(re);
}

function compileMappings(mappings) {
  const exact = new Map();
  const wildcards = [];

  for (const [pattern, rule] of Object.entries(mappings || {})) {
    if (pattern.includes("*")) {
      wildcards.push({
        pattern,
        regex: makeWildcardRegex(pattern),
        rule,
        // predictable: more specific patterns win (longer non-wildcard length)
        score: pattern.replace(/\*/g, "").length,
      });
    } else {
      exact.set(pattern, rule);
    }
  }

  wildcards.sort((a, b) => b.score - a.score || a.pattern.localeCompare(b.pattern));
  return { exact, wildcards };
}

function findMapping(compiled, eventName) {
  const exact = compiled.exact.get(eventName);
  if (exact) return { kind: exact.kind, name: exact.name, startsRun: exact.startsRun };
  for (const w of compiled.wildcards) {
    if (w.regex.test(eventName)) {
      return { kind: w.rule.kind, name: w.rule.name, startsRun: w.rule.startsRun };
    }
  }
  return undefined;
}

function redactRecord(record, redactRules) {
  if (!isPlainObject(record)) return record;
  const out = { ...record };

  for (const rule of redactRules || []) {
    if (typeof rule === "string") {
      if (rule in out) out[rule] = "[REDACTED]";
      continue;
    }
    if (!rule || typeof rule !== "object") continue;
    const key = rule.key;
    if (typeof key !== "string") continue;
    if (!(key in out)) continue;

    const value = out[key];
    if (rule.strategy === "prefix") {
      const keep = typeof rule.keep === "number" ? rule.keep : 8;
      const s = String(value);
      out[key] = s.length <= keep ? s : s.slice(0, keep) + "…";
    } else {
      out[key] = "[REDACTED]";
    }
  }

  return out;
}

function pickRunId(record, runIdKeys) {
  for (const k of runIdKeys || []) {
    const v = record?.[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function pickEventName(record, eventKey) {
  const v = record?.[eventKey];
  return typeof v === "string" && v.trim() ? v : undefined;
}

function pickTimestamp(record, timestampKey) {
  const v = record?.[timestampKey];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function formatDurationMs(durationMs) {
  const s = durationMs / 1000;
  return `${s.toFixed(2)}s`;
}

function ellipsizeId(v) {
  return typeof v === "string" ? v : undefined;
}

function fallbackDisplayName(kind, eventName) {
  const last = eventName.split(".").at(-1) || eventName;
  switch (kind) {
    case "RUN":
      return `run:${last}`;
    case "AGENT":
      return `agent:${last}`;
    case "TOOL":
      return `tool:${last}`;
    case "LLM":
      return `llm:${last}`;
    case "RESULT":
      return `result:${last}`;
    case "ERROR":
      return `error:${last}`;
    default:
      return last;
  }
}

function normalizeRecords(parsed, sourceType, config, compiledMappings, warnings) {
  const events = [];
  for (const { record: raw, sourceLine } of parsed) {
    const record = redactRecord(raw, config.redact);
    const runId = pickRunId(record, config.runIdKeys);
    if (!runId) {
      warnings.push({
        kind: "missing-run-id",
        line: sourceLine,
        message: `No run id found (keys: ${config.runIdKeys.join(", ")})`,
      });
      continue;
    }
    const eventName = pickEventName(record, config.eventKey);
    if (!eventName) {
      warnings.push({
        kind: "missing-event-name",
        line: sourceLine,
        message: `No event name found (key: ${config.eventKey})`,
      });
      continue;
    }
    const ts = pickTimestamp(record, config.timestampKey);
    if (ts === undefined) {
      warnings.push({
        kind: "missing-timestamp",
        line: sourceLine,
        message: `No timestamp found (key: ${config.timestampKey})`,
      });
    }

    const mapping = findMapping(compiledMappings, eventName);
    const kind = mapping?.kind || "LOG";
    const name = mapping?.name || fallbackDisplayName(kind, eventName);

    events.push({
      runId,
      eventName,
      kind,
      name,
      timestamp: ts ?? 0,
      durationMs: typeof record.durationMs === "number" ? record.durationMs : undefined,
      tokens: isPlainObject(record.tokens) ? record.tokens : undefined,
      record,
      source: { type: sourceType, line: sourceLine },
      startsRun: Boolean(mapping?.startsRun),
    });
  }
  return events;
}

function groupByRunId(events) {
  const byRun = new Map();
  for (const e of events) {
    if (!byRun.has(e.runId)) byRun.set(e.runId, []);
    byRun.get(e.runId).push(e);
  }
  for (const runEvents of byRun.values()) {
    runEvents.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }
  return byRun;
}

function renderRun(runId, runEvents) {
  const lines = [];
  lines.push(`Run decision=${runId}`);

  // Determine which event is the explicit run start (first event with startsRun=true).
  let explicitStartIndex = -1;
  for (let i = 0; i < runEvents.length; i++) {
    if (runEvents[i].startsRun) {
      explicitStartIndex = i;
      break;
    }
  }

  const rawEventCount = runEvents.length;
  let tools = 0;
  let llms = 0;
  let explicit = 0;
  let correlated = 0;

  // Flat timeline rendering with conservative LLM pairing.
  for (let i = 0; i < runEvents.length; i++) {
    const e = runEvents[i];

    // Conservative LLM start/completed pairing by same display name.
    if (e.kind === "LLM") {
      const next = runEvents[i + 1];
      if (
        next &&
        next.kind === "LLM" &&
        next.name === e.name &&
        typeof next.durationMs === "number" &&
        Number.isFinite(next.durationMs)
      ) {
        // Render one combined row.
        const isLastRow = i + 1 === runEvents.length - 1;
        const prefix = isLastRow ? "└─" : "├─";

        const model =
          typeof e.record.model === "string" ? ` model=${e.record.model}` : "";
        const dur = ` ✔ ${formatDurationMs(next.durationMs)}`;
        const tokens =
          isPlainObject(next.tokens) &&
          (typeof next.tokens.input === "number" ||
            typeof next.tokens.output === "number")
            ? ` tokens=${next.tokens.input ?? "?"}/${next.tokens.output ?? "?"}`
            : "";

        lines.push(`${prefix} ${e.name}${model}${dur}${tokens}`);
        const confidencePrefix = isLastRow ? "   " : "│  ";
        lines.push(
          `${confidencePrefix}confidence: correlated (same decisionId + paired completion)`,
        );

        llms += 1;
        correlated += 2; // count both raw events as correlated for summary breakdown

        // Skip the completion event.
        i += 1;
        continue;
      }
    }

    const isLast = i === runEvents.length - 1;
    const prefix = isLast ? "└─" : "├─";

    const parts = [];
    parts.push(e.name);

    if (e.name === "job:started") {
      const job = ellipsizeId(e.record.jobId);
      const user = ellipsizeId(e.record.userUuid);
      if (job) parts.push(`job=${job}`);
      if (user) parts.push(`user=${user}`);
    }

    if (e.name === "agent:started" && typeof e.record.trips === "number") {
      parts.push(`trips=${e.record.trips}`);
    }

    if (e.name === "tool:get_conversation_history") {
      const trip = ellipsizeId(e.record.tripUuid);
      if (trip) parts.push(`trip=${trip}`);
      if (typeof e.record.messageCount === "number") {
        parts.push(`msgs=${e.record.messageCount}`);
      }
    }

    if (e.kind === "LLM" && typeof e.record.model === "string") {
      parts.push(`model=${e.record.model}`);
    }

    if (e.name === "result:notification") {
      if (typeof e.record.shouldNotify === "boolean") {
        parts.push(`shouldNotify=${String(e.record.shouldNotify)}`);
      }
      if (typeof e.record.variant === "string") {
        parts.push(`variant=${e.record.variant}`);
      }
    }

    lines.push(`${prefix} ${parts.join(" ")}`);

    const confidencePrefix = isLast ? "   " : "│  ";
    if (i === explicitStartIndex) {
      lines.push(`${confidencePrefix}confidence: explicit`);
      explicit += 1;
    } else {
      lines.push(`${confidencePrefix}confidence: correlated (same decisionId)`);
      correlated += 1;
    }

    if (e.kind === "TOOL") tools += 1;
    if (e.kind === "LLM") llms += 1;
  }

  // Ensure explicit/correlated counts include all raw events.
  // If no startsRun marker existed, treat the first event as explicit for this spike.
  if (explicitStartIndex === -1 && runEvents.length > 0) {
    // Adjust counts: first correlated -> explicit.
    explicit = 1;
    correlated = rawEventCount - 1;
  } else {
    // In the LLM pairing branch we counted 2 correlated for the pair; elsewhere we counted 1 per event.
    // Ensure totals are consistent.
    const total = explicit + correlated;
    if (total !== rawEventCount) {
      correlated += rawEventCount - total;
    }
  }

  lines.push("");
  lines.push("Summary:");
  lines.push(`  Events: ${rawEventCount}`);
  lines.push(`  Tools: ${tools}`);
  lines.push(`  LLMs: ${llms}`);
  lines.push(`  Confidence: ${explicit} explicit, ${correlated} correlated`);
  lines.push("");
  lines.push("Note:");
  lines.push("  Flat timeline by default. Nesting only with explicit parentId.");

  return lines.join("\n");
}

function renderSample(title, sourceType, events, warnings) {
  const lines = [];
  lines.push(title);
  lines.push("");

  const byRun = groupByRunId(events);
  for (const [runId, runEvents] of byRun.entries()) {
    lines.push(renderRun(runId, runEvents));
    lines.push("");
  }

  // Warning summary by default.
  const warnCount = warnings.length;
  const byKind = new Map();
  for (const w of warnings) {
    byKind.set(w.kind, (byKind.get(w.kind) || 0) + 1);
  }

  lines.push("Warnings:");
  lines.push(`  Total: ${warnCount}`);
  if (warnCount > 0) {
    const kinds = [...byKind.entries()].sort((a, b) => b[1] - a[1]);
    for (const [k, n] of kinds) lines.push(`  - ${k}: ${n}`);
  }

  return lines.join("\n");
}

function main() {
  const config = loadConfig();
  const compiledMappings = compileMappings(config.mappings || {});

  // Default: parse sample-json.log and sample-log4js.log.
  const jsonWarnings = [];
  const jsonParsed = parseJsonLines(readText("sample-json.log"), jsonWarnings);
  const jsonEvents = normalizeRecords(
    jsonParsed,
    "json-log",
    config,
    compiledMappings,
    jsonWarnings,
  );

  console.log(renderSample("JSON log sample", "json-log", jsonEvents, jsonWarnings));
  console.log("");

  const log4jsWarnings = [];
  const log4jsParsed = parseLog4js(readText("sample-log4js.log"), log4jsWarnings);
  const log4jsEvents = normalizeRecords(
    log4jsParsed,
    "log4js",
    config,
    compiledMappings,
    log4jsWarnings,
  );

  console.log(
    renderSample("log4js log sample", "log4js", log4jsEvents, log4jsWarnings),
  );
}

main();

