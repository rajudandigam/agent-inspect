import type { InspectKind } from "./inspect-event.js";

export interface LogEventMapping {
  kind?: InspectKind;
  name?: string;
  parent?: string;
  status?: "running" | "ok" | "error";
  startsRun?: boolean;
  endsRun?: boolean;
  startsStep?: boolean;
  endsStep?: boolean;
}

export type RedactionStrategy = "full" | "prefix" | "hash";

export type RedactionRule =
  | string
  | {
      key: string;
      strategy: RedactionStrategy;
      keep?: number;
    };

export interface LogIngestConfig {
  runIdKeys: string[];
  eventKey: string;
  timestampKey?: string;
  messageKey?: string;
  levelKey?: string;
  parentIdKey?: string;
  durationKey?: string;
  statusKey?: string;
  mappings?: Record<string, LogEventMapping>;
  redact?: RedactionRule[];
  heuristicWindowMs?: number;
}

