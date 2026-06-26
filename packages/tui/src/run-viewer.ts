import { loadTraceForTui } from "./trace-loader.js";

export interface RunTraceViewerOptions {
  runId: string;
  dir?: string;
}

const TTY_MSG =
  "TUI requires an interactive terminal. Use agent-inspect view without --tui for plain output.";

export async function runTraceViewer(options: RunTraceViewerOptions): Promise<void> {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    throw new Error(TTY_MSG);
  }

  const model = await loadTraceForTui({
    runId: options.runId,
    dir: options.dir,
  });
  const [{ default: React }, { render }, { TraceViewerApp }] = await Promise.all([
    import("react"),
    import("ink"),
    import("./app.js"),
  ]);

  const { waitUntilExit } = render(
    React.createElement(TraceViewerApp, { model }),
  );
  await waitUntilExit();
}
