/**
 * Synthetic foreign session TraceReader (vendor-neutral demo for 6.19).
 *
 * Maps `{ sessionId, events[] }` JSON into PersistedInspectEvent rows.
 * No network, no vendor SDK, no dynamic plugin loading.
 */
import {
  TraceReadError,
  type TraceFormatCandidate,
  type TraceInput,
  type TraceReadResult,
  type TraceReader,
} from "agent-inspect/readers";
import {
  isPersistedInspectEvent,
  persistedInspectEventsToRunTrees,
  type PersistedInspectEvent,
} from "agent-inspect/persisted";

export const SYNTHETIC_SESSION_FORMAT = "synthetic-session-json";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolveContent(input: TraceInput): Promise<string> {
  if (input.type === "string") return input.content;
  if (input.type === "buffer") return input.content.toString("utf8");
  if (input.type === "file") {
    const { readFile } = await import("node:fs/promises");
    return readFile(input.path, "utf8");
  }
  throw new TraceReadError(
    "unsupported_format",
    "Synthetic session reader requires file, string, or buffer input.",
  );
}

function mapKind(type: string): PersistedInspectEvent["kind"] {
  if (type.startsWith("model.")) return "LLM";
  if (type.startsWith("tool.")) return "TOOL";
  if (type.startsWith("agent.")) return "AGENT";
  return "LOGIC";
}

function mapStatus(status: unknown): PersistedInspectEvent["status"] | undefined {
  if (status === "ok" || status === "success") return "ok";
  if (status === "error" || status === "failed") return "error";
  if (status === "running") return "running";
  return undefined;
}

export const syntheticSessionReader: TraceReader = {
  format: SYNTHETIC_SESSION_FORMAT,
  name: "Synthetic session JSON",
  async detect(input): Promise<TraceFormatCandidate | undefined> {
    try {
      const content = await resolveContent(input);
      const parsed = JSON.parse(content) as unknown;
      if (!isRecord(parsed)) return undefined;
      if (typeof parsed.sessionId !== "string") return undefined;
      if (!Array.isArray(parsed.events)) return undefined;
      return {
        format: SYNTHETIC_SESSION_FORMAT,
        confidence: 0.88,
        readerName: "Synthetic session JSON",
        description: "Generic foreign session API document",
      };
    } catch {
      return undefined;
    }
  },
  async read(input): Promise<TraceReadResult> {
    let content: string;
    try {
      content = await resolveContent(input);
    } catch (error) {
      if (error instanceof TraceReadError) throw error;
      throw new TraceReadError("unsupported_format", "Unable to resolve synthetic session input.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new TraceReadError("invalid_input", "Synthetic session input is not valid JSON.", [
        {
          code: "synthetic_session_invalid_json",
          message: "JSON parse failed.",
          severity: "error",
        },
      ]);
    }

    if (!isRecord(parsed) || typeof parsed.sessionId !== "string" || !Array.isArray(parsed.events)) {
      throw new TraceReadError(
        "unsupported_format",
        "Synthetic session document requires sessionId and events[].",
      );
    }

    const sessionId = parsed.sessionId;
    const warnings: TraceReadResult["warnings"] = [];
    const unsupportedFields: string[] = [];
    const events: PersistedInspectEvent[] = [];
    const seenIds = new Set<string>();

    for (const [index, raw] of parsed.events.entries()) {
      const pathPrefix = `events[${index}]`;
      if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.type !== "string") {
        warnings.push({
          code: "synthetic_session_invalid_event",
          message: `Skipped malformed event at ${pathPrefix}.`,
          severity: "warning",
          field: pathPrefix,
        });
        unsupportedFields.push(pathPrefix);
        continue;
      }

      if (seenIds.has(raw.id)) {
        throw new TraceReadError("invalid_input", `Duplicate event id "${raw.id}".`, [
          {
            code: "synthetic_session_duplicate_event_id",
            message: `Duplicate event id "${raw.id}" is rejected deterministically.`,
            severity: "error",
            field: `${pathPrefix}.id`,
          },
        ]);
      }
      seenIds.add(raw.id);

      const supported =
        raw.type.startsWith("model.") ||
        raw.type.startsWith("tool.") ||
        raw.type.startsWith("agent.");
      if (!supported) {
        warnings.push({
          code: "synthetic_session_unsupported_event_type",
          message: `Unsupported event type "${raw.type}" omitted.`,
          severity: "warning",
          field: `${pathPrefix}.type`,
        });
        unsupportedFields.push(`${pathPrefix}.type`);
        continue;
      }

      const createdAt =
        typeof raw.createdAt === "string" && raw.createdAt.trim() !== ""
          ? raw.createdAt
          : "1970-01-01T00:00:00.000Z";
      const toolName = typeof raw.toolName === "string" ? raw.toolName : undefined;
      const name =
        typeof raw.name === "string" && raw.name.trim() !== ""
          ? raw.name
          : (toolName ?? raw.type);
      const status = mapStatus(raw.status);

      const event: PersistedInspectEvent = {
        schemaVersion: "0.2",
        eventId: raw.id,
        runId: sessionId,
        kind: mapKind(raw.type),
        name,
        timestamp: createdAt,
        confidence: "correlated",
        source: { type: "adapter", name: "synthetic-session-reader" },
        attributes: {
          sessionId,
          foreignEventType: raw.type,
          ...(toolName !== undefined ? { toolName } : {}),
        },
        ...(typeof raw.parentId === "string" ? { parentId: raw.parentId } : {}),
        ...(status !== undefined ? { status } : {}),
      };

      if (!isPersistedInspectEvent(event)) {
        throw new TraceReadError(
          "reader_failed",
          `Normalized event at ${pathPrefix} failed isPersistedInspectEvent.`,
        );
      }
      events.push(event);
    }

    return {
      format: SYNTHETIC_SESSION_FORMAT,
      events,
      runs: persistedInspectEventsToRunTrees(events, { skipInvalid: true }),
      warnings,
      unsupportedFields: unsupportedFields.sort((a, b) => a.localeCompare(b)),
      sourceFiles: input.type === "file" ? [input.path] : [],
    };
  },
};
