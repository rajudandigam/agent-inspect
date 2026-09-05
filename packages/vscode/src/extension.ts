import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import * as vscode from "vscode";

import type { CliRunner } from "./cli.js";
import { createCliRunner } from "./cli.js";
import {
  SAMPLE_TRACE_FILENAME,
  SAMPLE_TRACE_RUN_ID,
  buildSampleTrace,
} from "./sampleTrace.js";
import { findTraceHints, pickPrimaryTraceDir, discoverTraceDirs } from "./traceDirs.js";
import {
  TraceTreeProvider,
  getSelectedRun,
  type TraceRunItem,
} from "./traceTree.js";

const OUTPUT_CHANNEL = "AgentInspect";

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

async function primaryTraceDir(): Promise<string | undefined> {
  const root = workspaceRoot();
  if (!root) return undefined;
  const dirs = await discoverTraceDirs(root);
  return pickPrimaryTraceDir(dirs);
}

async function showCliOutput(
  title: string,
  runner: CliRunner,
  args: string[],
  cwd: string,
): Promise<void> {
  const channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL);
  channel.show(true);
  channel.appendLine(`$ agent-inspect ${args.join(" ")}`);
  const result = await runner.run(args, cwd);
  if (result.stdout.trim()) channel.append(result.stdout);
  if (result.stderr.trim()) channel.appendLine(result.stderr);
  if (result.exitCode !== 0) {
    void vscode.window.showErrorMessage(`${title} failed (exit ${result.exitCode})`);
  }
}

async function runForSelection(
  treeView: vscode.TreeView<vscode.TreeItem>,
  runner: CliRunner,
  buildArgs: (run: TraceRunItem) => string[],
  title: string,
): Promise<void> {
  const run = getSelectedRun(treeView);
  const root = workspaceRoot();
  if (!run || !root) {
    void vscode.window.showWarningMessage("Select a trace run first.");
    return;
  }
  await showCliOutput(title, runner, buildArgs(run), root);
}

export function activate(context: vscode.ExtensionContext): void {
  const runner = createCliRunner();
  const treeProvider = new TraceTreeProvider(runner, workspaceRoot);
  const treeView = vscode.window.createTreeView("agentInspect.traces", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand("agentInspect.refreshTraces", () => {
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand("agentInspect.openTraceDirectory", async () => {
      const dir = await primaryTraceDir();
      if (!dir) {
        void vscode.window.showWarningMessage("Open a workspace folder first.");
        return;
      }
      const uri = vscode.Uri.file(dir);
      await vscode.commands.executeCommand("revealFileInOS", uri);
    }),
    vscode.commands.registerCommand("agentInspect.runDoctor", async () => {
      const root = workspaceRoot();
      const dir = await primaryTraceDir();
      if (!root || !dir) {
        void vscode.window.showWarningMessage("Open a workspace folder first.");
        return;
      }
      await showCliOutput(
        "Doctor",
        runner,
        ["doctor", "--json", "--trace-dir", dir],
        root,
      );
    }),
    vscode.commands.registerCommand("agentInspect.viewTree", () =>
      runForSelection(
        treeView,
        runner,
        (run) => ["view", run.runId, "--dir", run.traceDir],
        "View tree",
      ),
    ),
    vscode.commands.registerCommand("agentInspect.viewTimeline", () =>
      runForSelection(
        treeView,
        runner,
        (run) => ["timeline", run.runId, "--dir", run.traceDir],
        "View timeline",
      ),
    ),
    vscode.commands.registerCommand("agentInspect.viewReport", () =>
      runForSelection(
        treeView,
        runner,
        (run) => ["report", run.runId, "--dir", run.traceDir],
        "View report",
      ),
    ),
    vscode.commands.registerCommand("agentInspect.viewCheck", () =>
      runForSelection(
        treeView,
        runner,
        (run) => ["check", run.runId, "--dir", run.traceDir],
        "View check",
      ),
    ),
    vscode.commands.registerCommand("agentInspect.verifySafe", async () => {
      const root = workspaceRoot();
      const dir = await primaryTraceDir();
      if (!root || !dir) {
        void vscode.window.showWarningMessage("Open a workspace folder first.");
        return;
      }
      await showCliOutput("Verify safe", runner, ["verify-safe", "--dir", dir], root);
    }),
    vscode.commands.registerCommand("agentInspect.openSampleTrace", async () => {
      // Onboarding: write a synthetic sample trace to a temp dir, open it in an
      // editor so the user sees the JSONL format, and render its tree via the CLI.
      const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-sample-"));
      const file = path.join(dir, SAMPLE_TRACE_FILENAME);
      await writeFile(file, buildSampleTrace(), "utf-8");
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
      await vscode.window.showTextDocument(document, { preview: false });
      await showCliOutput(
        "View sample tree",
        runner,
        ["view", SAMPLE_TRACE_RUN_ID, "--dir", dir],
        dir,
      );
    }),
    vscode.commands.registerCommand("agentInspect.openTraceFromEditor", async () => {
      const editor = vscode.window.activeTextEditor;
      const root = workspaceRoot();
      if (!editor || !root) return;
      const hints = findTraceHints(editor.document.getText());
      if (!hints.runId) {
        void vscode.window.showInformationMessage("No AgentInspect run id found in this file.");
        return;
      }
      const dir = hints.traceDir ?? (await primaryTraceDir()) ?? ".agent-inspect";
      await showCliOutput(
        "View tree",
        runner,
        ["view", hints.runId, "--dir", dir],
        root,
      );
    }),
  );
}

export function deactivate(): void {
  /* no-op */
}
