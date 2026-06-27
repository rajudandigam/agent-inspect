import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  inspectRun,
  maybeInspectRun,
  observe,
} from "agent-inspect";
import type { InspectRunOptions } from "agent-inspect";
import { isAgentInspectEnabled } from "agent-inspect/advanced";

export type HarnessDiagnosticSeverity = "warning" | "error";

export type HarnessDiagnosticCode =
  | "target_not_found"
  | "bootstrap_failed"
  | "resolve_failed"
  | "invoke_failed"
  | "shutdown_failed"
  | "cli_usage_error"
  | "fixture_read_failed"
  | "stdin_read_failed"
  | "expected_read_failed"
  | "expected_output_mismatch";

export interface HarnessDiagnosticError {
  name?: string;
  message: string;
  stack?: string;
}

export interface HarnessDiagnostic {
  code: HarnessDiagnosticCode;
  severity: HarnessDiagnosticSeverity;
  message: string;
  targetName?: string;
  timestamp: number;
  error?: HarnessDiagnosticError;
}

export type HarnessDiagnosticInput = Omit<HarnessDiagnostic, "timestamp"> & {
  timestamp?: number;
};

export interface FixtureRunnerContext<TApp = unknown> {
  readonly runnerName: string;
  readonly targetName: string;
  readonly app: TApp | undefined;
  addDiagnostic(diagnostic: HarnessDiagnosticInput): void;
  getDiagnostics(): readonly HarnessDiagnostic[];
}

export interface TargetDefinition<TApp, TTarget, TInput, TOutput> {
  /** Human-readable label for target listing. Experimental during v1.x. */
  description?: string;
  /** Safe, bounded metadata for local tooling and recipes. Experimental during v1.x. */
  metadata?: Record<string, unknown>;
  /** Resolve a framework-specific object or function from the bootstrapped app. */
  resolve(
    app: TApp,
    context: FixtureRunnerContext<TApp>,
  ): TTarget | Promise<TTarget>;
  /** Invoke the resolved target with fixture input. */
  invoke(
    target: TTarget,
    input: TInput,
    context: FixtureRunnerContext<TApp>,
  ): TOutput | Promise<TOutput>;
}

export type FixtureTargets<TApp = unknown> = Record<
  string,
  TargetDefinition<TApp, unknown, unknown, unknown>
>;

export type TargetInput<TDefinition> =
  TDefinition extends TargetDefinition<infer _TApp, infer _TTarget, infer TInput, infer _TOutput>
    ? TInput
    : never;

export type TargetOutput<TDefinition> =
  TDefinition extends TargetDefinition<infer _TApp, infer _TTarget, infer _TInput, infer TOutput>
    ? TOutput
    : never;

export type HarnessTraceMode = "off" | "run" | "run-if-enabled" | "observe";

export interface HarnessTraceOptions extends InspectRunOptions {
  /**
   * `run-if-enabled` uses `maybeInspectRun()` and is the default.
   * `observe` proxies resolved targets and traces `run` / `execute` / `invoke` methods when enabled.
   */
  mode?: HarnessTraceMode;
  runName?: string | ((targetName: string) => string);
}

export interface FixtureRunnerOptions<TApp, TTargets extends FixtureTargets<TApp>> {
  name?: string;
  targets: TTargets;
  trace?: HarnessTraceOptions;
  bootstrap?(
    context: FixtureRunnerContext<TApp>,
  ): TApp | Promise<TApp>;
  shutdown?(
    app: TApp | undefined,
    context: FixtureRunnerContext<TApp>,
  ): void | Promise<void>;
}

export interface FixtureRunOptions {
  trace?: HarnessTraceOptions;
}

export interface HarnessArgvIo {
  cwd?: string;
  stdin?(): string | Promise<string>;
  stdout?(chunk: string): void;
  stderr?(chunk: string): void;
}

export interface HarnessArgvResult {
  ok: boolean;
  exitCode: 0 | 1;
  targetName?: string;
  listed?: boolean;
  matchedExpected?: boolean;
  output?: unknown;
  error?: HarnessDiagnosticError;
  diagnostics: readonly HarnessDiagnostic[];
}

export interface HarnessTargetInfo {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface FixtureRunner<TApp, TTargets extends FixtureTargets<TApp>> {
  listTargets(): HarnessTargetInfo[];
  getDiagnostics(): readonly HarnessDiagnostic[];
  runTarget<TName extends Extract<keyof TTargets, string>>(
    targetName: TName,
    input: TargetInput<TTargets[TName]>,
    options?: FixtureRunOptions,
  ): Promise<TargetOutput<TTargets[TName]>>;
  runFromArgv(argv?: readonly string[], io?: HarnessArgvIo): Promise<HarnessArgvResult>;
}

export class HarnessError extends Error {
  readonly code: HarnessDiagnosticCode;
  readonly targetName?: string;

  constructor(
    code: HarnessDiagnosticCode,
    message: string,
    options?: { targetName?: string; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "HarnessError";
    this.code = code;
    this.targetName = options?.targetName;
  }
}

export class HarnessTargetNotFoundError extends HarnessError {
  constructor(targetName: string) {
    super("target_not_found", `Harness target "${targetName}" was not found.`, {
      targetName,
    });
    this.name = "HarnessTargetNotFoundError";
  }
}

export function defineTarget<TApp, TTarget, TInput, TOutput>(
  definition: TargetDefinition<TApp, TTarget, TInput, TOutput>,
): TargetDefinition<TApp, TTarget, TInput, TOutput> {
  return definition;
}

export function createFixtureRunner<
  TApp,
  const TTargets extends FixtureTargets<TApp>,
>(options: FixtureRunnerOptions<TApp, TTargets>): FixtureRunner<TApp, TTargets> {
  return new DefaultFixtureRunner(options);
}

class DefaultFixtureRunner<TApp, TTargets extends FixtureTargets<TApp>>
  implements FixtureRunner<TApp, TTargets>
{
  private readonly diagnostics: HarnessDiagnostic[] = [];
  private readonly runnerName: string;

  constructor(private readonly options: FixtureRunnerOptions<TApp, TTargets>) {
    this.runnerName = normalizeRunnerName(options.name);
  }

  listTargets(): HarnessTargetInfo[] {
    return Object.entries(this.options.targets)
      .map(([name, definition]) => {
        const info: HarnessTargetInfo = { name };
        if (definition.description !== undefined) info.description = definition.description;
        if (definition.metadata !== undefined) info.metadata = definition.metadata;
        return info;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getDiagnostics(): readonly HarnessDiagnostic[] {
    return [...this.diagnostics];
  }

  async runTarget<TName extends Extract<keyof TTargets, string>>(
    targetName: TName,
    input: TargetInput<TTargets[TName]>,
    options?: FixtureRunOptions,
  ): Promise<TargetOutput<TTargets[TName]>> {
    return await this.runTargetInternal(targetName, input, options) as TargetOutput<
      TTargets[TName]
    >;
  }

  async runFromArgv(
    argv: readonly string[] = process.argv.slice(2),
    io: HarnessArgvIo = {},
  ): Promise<HarnessArgvResult> {
    const parsed = this.parseArgv(argv);
    const stdout = io.stdout ?? ((chunk: string) => process.stdout.write(chunk));
    const stderr = io.stderr ?? ((chunk: string) => process.stderr.write(chunk));

    if (!parsed.ok) {
      return this.writeArgvFailure(parsed.message, "cli_usage_error", stdout, stderr);
    }

    if (parsed.list) {
      const result: HarnessArgvResult = {
        ok: true,
        exitCode: 0,
        listed: true,
        output: { targets: this.listTargets() },
        diagnostics: this.getDiagnostics(),
      };
      writeJsonLine(stdout, { targets: this.listTargets() });
      stderr(`agent-inspect harness: listed ${this.listTargets().length} target(s)\n`);
      return result;
    }

    if (parsed.targetName === undefined) {
      return this.writeArgvFailure(
        "Missing target name. Pass --list or a target name.",
        "cli_usage_error",
        stdout,
        stderr,
      );
    }

    if (parsed.fixturePath !== undefined && parsed.readStdin) {
      return this.writeArgvFailure(
        "Pass either --fixture or --stdin, not both.",
        "cli_usage_error",
        stdout,
        stderr,
        parsed.targetName,
      );
    }

    const cwd = io.cwd ?? process.cwd();
    const inputResult = await this.readInput(parsed, io, cwd);
    if (!inputResult.ok) {
      return this.writeArgvFailure(
        inputResult.message,
        inputResult.code,
        stdout,
        stderr,
        parsed.targetName,
        inputResult.error,
      );
    }

    try {
      const output = await this.runTargetInternal(parsed.targetName, inputResult.value, {
        trace: parsed.trace,
      });
      const expectedResult = await this.compareExpectedOutput(
        parsed,
        output,
        cwd,
      );
      if (!expectedResult.ok) {
        return this.writeArgvFailure(
          expectedResult.message,
          expectedResult.code,
          stdout,
          stderr,
          parsed.targetName,
          expectedResult.error,
          output,
          false,
        );
      }

      const matchedExpected = expectedResult.compared ? true : undefined;
      const result: HarnessArgvResult = {
        ok: true,
        exitCode: 0,
        targetName: parsed.targetName,
        output,
        diagnostics: this.getDiagnostics(),
        ...(matchedExpected !== undefined ? { matchedExpected } : {}),
      };
      writeJsonLine(stdout, {
        ok: true,
        target: parsed.targetName,
        output,
        ...(matchedExpected !== undefined ? { matchedExpected } : {}),
      });
      stderr(`agent-inspect harness: ok ${parsed.targetName}\n`);
      return result;
    } catch (error) {
      return this.writeArgvFailure(
        `Harness target "${parsed.targetName}" failed.`,
        "invoke_failed",
        stdout,
        stderr,
        parsed.targetName,
        error,
      );
    }
  }

  private async runTargetInternal(
    targetName: string,
    input: unknown,
    options?: FixtureRunOptions,
  ): Promise<unknown> {
    const definition = this.options.targets[targetName] as
      | TargetDefinition<TApp, unknown, unknown, unknown>
      | undefined;
    let app: TApp | undefined;
    const context = this.createContext(targetName, () => app);

    if (definition === undefined) {
      const error = new HarnessTargetNotFoundError(targetName);
      this.addDiagnostic({
        code: "target_not_found",
        severity: "error",
        message: error.message,
        targetName,
        error: serializeError(error),
      });
      throw error;
    }

    let primaryError: unknown;
    try {
      app = await this.bootstrap(context);
      const target = await this.resolveTarget(definition, app, context, targetName);
      return await this.invokeTarget(definition, target, input, context, targetName, options);
    } catch (error) {
      primaryError = error;
      throw error;
    } finally {
      await this.shutdown(app, context, targetName, primaryError);
    }
  }

  private createContext(
    targetName: string,
    getApp: () => TApp | undefined,
  ): FixtureRunnerContext<TApp> {
    return {
      runnerName: this.runnerName,
      targetName,
      get app() {
        return getApp();
      },
      addDiagnostic: (diagnostic) => this.addDiagnostic(diagnostic),
      getDiagnostics: () => this.getDiagnostics(),
    };
  }

  private addDiagnostic(input: HarnessDiagnosticInput): void {
    this.diagnostics.push({
      ...input,
      timestamp: input.timestamp ?? Date.now(),
    });
  }

  private parseArgv(argv: readonly string[]): ParsedArgv {
    const parsed: ParsedArgvSuccess = {
      ok: true,
      list: false,
      readStdin: false,
      trace: {},
    };
    const positional: string[] = [];

    for (let i = 0; i < argv.length; i += 1) {
      const arg = argv[i];
      switch (arg) {
        case "--list":
          parsed.list = true;
          break;
        case "--fixture": {
          const value = argv[i + 1];
          if (value === undefined) return usageError("--fixture requires a path.");
          parsed.fixturePath = value;
          i += 1;
          break;
        }
        case "--stdin":
          parsed.readStdin = true;
          break;
        case "--expected":
        case "--expected-output": {
          const value = argv[i + 1];
          if (value === undefined) return usageError(`${arg} requires a path.`);
          parsed.expectedPath = value;
          i += 1;
          break;
        }
        case "--trace":
          parsed.trace.mode = "run";
          break;
        case "--no-trace":
          parsed.trace.mode = "off";
          break;
        case "--trace-dir": {
          const value = argv[i + 1];
          if (value === undefined) return usageError("--trace-dir requires a path.");
          parsed.trace.traceDir = value;
          i += 1;
          break;
        }
        case "--trace-mode": {
          const value = argv[i + 1];
          if (!isHarnessTraceMode(value)) {
            return usageError(
              "--trace-mode must be one of: off, run, run-if-enabled, observe.",
            );
          }
          parsed.trace.mode = value;
          i += 1;
          break;
        }
        default:
          if (arg?.startsWith("--")) {
            return usageError(`Unknown harness option: ${arg}`);
          }
          if (arg !== undefined) positional.push(arg);
      }
    }

    if (positional.length > 1) {
      return usageError("Pass at most one target name.");
    }
    parsed.targetName = positional[0];
    return parsed;
  }

  private async readInput(
    parsed: ParsedArgvSuccess,
    io: HarnessArgvIo,
    cwd: string,
  ): Promise<InputReadResult> {
    if (parsed.fixturePath !== undefined) {
      try {
        return {
          ok: true,
          value: parseJsonPayload(
            await readFile(resolvePath(cwd, parsed.fixturePath), "utf8"),
            parsed.fixturePath,
          ),
        };
      } catch (error) {
        return {
          ok: false,
          code: "fixture_read_failed",
          message: `Failed to read fixture: ${parsed.fixturePath}`,
          error,
        };
      }
    }

    if (parsed.readStdin) {
      try {
        const raw = io.stdin === undefined ? await readProcessStdin() : await io.stdin();
        return { ok: true, value: parseJsonPayload(raw, "stdin") };
      } catch (error) {
        return {
          ok: false,
          code: "stdin_read_failed",
          message: "Failed to read JSON from stdin.",
          error,
        };
      }
    }

    return { ok: true, value: undefined };
  }

  private async compareExpectedOutput(
    parsed: ParsedArgvSuccess,
    output: unknown,
    cwd: string,
  ): Promise<ExpectedCompareResult> {
    if (parsed.expectedPath === undefined) {
      return { ok: true, compared: false };
    }

    let expected: unknown;
    try {
      expected = parseJsonPayload(
        await readFile(resolvePath(cwd, parsed.expectedPath), "utf8"),
        parsed.expectedPath,
      );
    } catch (error) {
      return {
        ok: false,
        compared: true,
        code: "expected_read_failed",
        message: `Failed to read expected output: ${parsed.expectedPath}`,
        error,
      };
    }

    if (stableJson(expected) !== stableJson(output)) {
      return {
        ok: false,
        compared: true,
        code: "expected_output_mismatch",
        message: `Expected output mismatch: ${parsed.expectedPath}`,
        error: new Error("Expected output mismatch."),
      };
    }

    return { ok: true, compared: true };
  }

  private writeArgvFailure(
    message: string,
    code: HarnessDiagnosticCode,
    stdout: (chunk: string) => void,
    stderr: (chunk: string) => void,
    targetName?: string,
    error?: unknown,
    output?: unknown,
    matchedExpected?: boolean,
  ): HarnessArgvResult {
    const diagnostic: HarnessDiagnosticInput = {
      code,
      severity: "error",
      message,
      ...(targetName !== undefined ? { targetName } : {}),
      ...(error !== undefined ? { error: serializeError(error) } : {}),
    };
    this.addDiagnostic(diagnostic);
    const result: HarnessArgvResult = {
      ok: false,
      exitCode: 1,
      ...(targetName !== undefined ? { targetName } : {}),
      ...(output !== undefined ? { output } : {}),
      ...(matchedExpected !== undefined ? { matchedExpected } : {}),
      ...(error !== undefined ? { error: serializeError(error) } : {}),
      diagnostics: this.getDiagnostics(),
    };
    writeJsonLine(stdout, {
      ok: false,
      ...(targetName !== undefined ? { target: targetName } : {}),
      ...(output !== undefined ? { output } : {}),
      ...(matchedExpected !== undefined ? { matchedExpected } : {}),
      ...(error !== undefined ? { error: serializeError(error) } : {}),
      diagnostics: this.getDiagnostics(),
    });
    stderr(`agent-inspect harness: ${message}\n`);
    return result;
  }

  private async bootstrap(context: FixtureRunnerContext<TApp>): Promise<TApp> {
    try {
      if (this.options.bootstrap === undefined) {
        return undefined as TApp;
      }
      return await this.options.bootstrap(context);
    } catch (error) {
      this.addDiagnostic({
        code: "bootstrap_failed",
        severity: "error",
        message: "Harness bootstrap failed.",
        targetName: context.targetName,
        error: serializeError(error),
      });
      throw new HarnessError("bootstrap_failed", "Harness bootstrap failed.", {
        targetName: context.targetName,
        cause: error,
      });
    }
  }

  private async resolveTarget<TOutput>(
    definition: TargetDefinition<TApp, unknown, unknown, TOutput>,
    app: TApp,
    context: FixtureRunnerContext<TApp>,
    targetName: string,
  ): Promise<unknown> {
    try {
      return await definition.resolve(app, context);
    } catch (error) {
      this.addDiagnostic({
        code: "resolve_failed",
        severity: "error",
        message: `Harness target "${targetName}" failed to resolve.`,
        targetName,
        error: serializeError(error),
      });
      throw new HarnessError(
        "resolve_failed",
        `Harness target "${targetName}" failed to resolve.`,
        { targetName, cause: error },
      );
    }
  }

  private async invokeTarget<TOutput>(
    definition: TargetDefinition<TApp, unknown, unknown, TOutput>,
    target: unknown,
    input: unknown,
    context: FixtureRunnerContext<TApp>,
    targetName: string,
    options: FixtureRunOptions | undefined,
  ): Promise<TOutput> {
    const trace = mergeTraceOptions(this.options.trace, options?.trace);
    const runName = resolveRunName(this.runnerName, targetName, trace.runName);
    const traceOptions = toInspectRunOptions(trace);
    const invoke = () => definition.invoke(target, input, context);

    try {
      switch (trace.mode ?? "run-if-enabled") {
        case "off":
          return await invoke();
        case "run":
          return await inspectRun(runName, invoke, {
            ...traceOptions,
            enabled: traceOptions.enabled ?? true,
          });
        case "observe": {
          const enabled =
            traceOptions.enabled ?? isAgentInspectEnabled(process.env.AGENT_INSPECT);
          const observedTarget = observe(target, {
            ...traceOptions,
            enabled,
          });
          return await definition.invoke(observedTarget, input, context);
        }
        case "run-if-enabled":
          return await maybeInspectRun(runName, invoke, traceOptions);
      }
    } catch (error) {
      this.addDiagnostic({
        code: "invoke_failed",
        severity: "error",
        message: `Harness target "${targetName}" failed during invocation.`,
        targetName,
        error: serializeError(error),
      });
      throw error;
    }
  }

  private async shutdown(
    app: TApp | undefined,
    context: FixtureRunnerContext<TApp>,
    targetName: string,
    primaryError: unknown,
  ): Promise<void> {
    if (this.options.shutdown === undefined) return;

    try {
      await this.options.shutdown(app, context);
    } catch (error) {
      this.addDiagnostic({
        code: "shutdown_failed",
        severity: "error",
        message: "Harness shutdown failed.",
        targetName,
        error: serializeError(error),
      });
      if (primaryError === undefined) {
        throw new HarnessError("shutdown_failed", "Harness shutdown failed.", {
          targetName,
          cause: error,
        });
      }
    }
  }
}

function normalizeRunnerName(name: string | undefined): string {
  const trimmed = name?.trim();
  return trimmed === undefined || trimmed === "" ? "agent-inspect-harness" : trimmed;
}

function resolveRunName(
  runnerName: string,
  targetName: string,
  configured: HarnessTraceOptions["runName"],
): string {
  if (typeof configured === "function") return configured(targetName);
  if (typeof configured === "string" && configured.trim() !== "") return configured.trim();
  return `${runnerName}:${targetName}`;
}

function mergeTraceOptions(
  base: HarnessTraceOptions | undefined,
  override: HarnessTraceOptions | undefined,
): HarnessTraceOptions {
  return { ...(base ?? {}), ...(override ?? {}) };
}

function toInspectRunOptions(options: HarnessTraceOptions): InspectRunOptions {
  const { mode: _mode, runName: _runName, ...inspectOptions } = options;
  return inspectOptions;
}

function serializeError(error: unknown): HarnessDiagnosticError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

type ParsedArgv = ParsedArgvSuccess | ParsedArgvError;

interface ParsedArgvSuccess {
  ok: true;
  list: boolean;
  readStdin: boolean;
  targetName?: string;
  fixturePath?: string;
  expectedPath?: string;
  trace: HarnessTraceOptions;
}

interface ParsedArgvError {
  ok: false;
  message: string;
}

type InputReadResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      code: "fixture_read_failed" | "stdin_read_failed";
      message: string;
      error: unknown;
    };

type ExpectedCompareResult =
  | { ok: true; compared: boolean }
  | {
      ok: false;
      compared: true;
      code: "expected_read_failed" | "expected_output_mismatch";
      message: string;
      error: unknown;
    };

function usageError(message: string): ParsedArgvError {
  return { ok: false, message };
}

function isHarnessTraceMode(value: unknown): value is HarnessTraceMode {
  return (
    value === "off" ||
    value === "run" ||
    value === "run-if-enabled" ||
    value === "observe"
  );
}

function resolvePath(cwd: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);
}

function parseJsonPayload(raw: string, source: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") {
    throw new Error(`Empty JSON payload from ${source}.`);
  }
  return JSON.parse(trimmed) as unknown;
}

async function readProcessStdin(): Promise<string> {
  process.stdin.setEncoding("utf8");
  let raw = "";
  for await (const chunk of process.stdin) {
    raw += chunk;
  }
  return raw;
}

function writeJsonLine(writer: (chunk: string) => void, value: unknown): void {
  writer(`${stableJson(value)}\n`);
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value)) ?? "null";
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item));
  }
  if (isPlainRecord(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJson(value[key]);
    }
    return sorted;
  }
  return value === undefined ? null : value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
