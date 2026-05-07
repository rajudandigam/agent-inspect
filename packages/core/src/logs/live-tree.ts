import type { InspectEvent, InspectRunTree } from "../types/inspect-event.js";
import type { LogIngestConfig } from "../types/log-config.js";
import { mergeLogIngestConfig } from "./config.js";
import type { LogSourceFormat } from "./line-parser.js";
import { parseLogLine } from "./line-parser.js";
import { EventNormalizer } from "./normalizer.js";
import { Redactor } from "./redactor.js";
import { TreeBuilder } from "./tree-builder.js";
import type { ParserWarning } from "./warnings.js";

export interface LiveLogUpdate {
  events: InspectEvent[];
  trees: InspectRunTree[];
  warnings: ParserWarning[];
}

export interface LiveLogAccumulatorOptions {
  config: LogIngestConfig;
  format?: LogSourceFormat;
  file?: string;
}

export class LiveLogAccumulator {
  readonly #config: LogIngestConfig;
  readonly #format: LogSourceFormat;
  readonly #file?: string;

  readonly #normalizer: EventNormalizer;
  readonly #redactor: Redactor;
  readonly #treeBuilder: TreeBuilder;

  #events: InspectEvent[] = [];
  #warnings: ParserWarning[] = [];
  #trees: InspectRunTree[] = [];

  constructor(options: LiveLogAccumulatorOptions) {
    // Ensure defaults are applied consistently.
    this.#config = mergeLogIngestConfig(options.config, {});
    this.#format = options.format ?? "auto";
    this.#file = options.file;

    this.#normalizer = new EventNormalizer({ config: this.#config });
    this.#redactor = new Redactor({ rules: this.#config.redact });
    this.#treeBuilder = new TreeBuilder({ config: this.#config });
  }

  pushLine(line: string, lineNumber?: number): LiveLogUpdate {
    try {
      const parsed = parseLogLine(line, {
        format: this.#format,
        file: this.#file,
        line: lineNumber,
      });

      const normalized = this.#normalizer.normalizeAll(parsed.records);

      // Redact attributes after normalization, before storing.
      const redactedEvents = normalized.records.map((e) => ({
        ...e,
        attributes: e.attributes ? this.#redactor.redactRecord(e.attributes) : undefined,
      }));

      this.#events = [...this.#events, ...redactedEvents];
      this.#warnings = [...this.#warnings, ...parsed.warnings, ...normalized.warnings];
      this.#trees = this.#treeBuilder.build(this.#events);

      return {
        events: this.#events,
        trees: this.#trees,
        warnings: this.#warnings,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const warning: ParserWarning = {
        code: "UNKNOWN",
        message: `LiveLogAccumulator failed to process line (${msg})`,
        file: this.#file,
        line: lineNumber,
        raw: typeof line === "string" ? line.slice(0, 500) : undefined,
      };
      this.#warnings = [...this.#warnings, warning];
      return { events: this.#events, trees: this.#trees, warnings: this.#warnings };
    }
  }

  getEvents(): InspectEvent[] {
    return this.#events;
  }

  getTrees(): InspectRunTree[] {
    return this.#trees;
  }

  getWarnings(): ParserWarning[] {
    return this.#warnings;
  }

  reset(): void {
    this.#events = [];
    this.#trees = [];
    this.#warnings = [];
  }
}

