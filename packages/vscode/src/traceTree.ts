import * as vscode from "vscode";

import type { CliRunner } from "./cli.js";
import { parseTraceListJson } from "./cli.js";
import { discoverTraceDirs } from "./traceDirs.js";

export class TraceRunItem extends vscode.TreeItem {
  constructor(
    public readonly runId: string,
    public readonly traceDir: string,
    label: string,
    status: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "traceRun";
    this.description = status;
    this.tooltip = `${runId}\n${traceDir}`;
    this.iconPath =
      status === "error"
        ? new vscode.ThemeIcon("error")
        : status === "running"
          ? new vscode.ThemeIcon("sync~spin")
          : new vscode.ThemeIcon("pass");
  }
}

export class TraceDirItem extends vscode.TreeItem {
  constructor(public readonly traceDir: string, source: string) {
    super(traceDir, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "traceDir";
    this.description = source;
    this.iconPath = new vscode.ThemeIcon("folder");
  }
}

export class TraceTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(
    private readonly cli: CliRunner,
    private readonly getWorkspaceRoot: () => string | undefined,
  ) {}

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const root = this.getWorkspaceRoot();
    if (!root) {
      return [new vscode.TreeItem("Open a workspace folder to list traces")];
    }

    if (!element) {
      const dirs = await discoverTraceDirs(root);
      return dirs.map((dir) => new TraceDirItem(dir.path, dir.source));
    }

    if (element instanceof TraceDirItem) {
      const result = await this.cli.run(
        ["list", "--json", "--dir", element.traceDir, "--limit", "50"],
        root,
      );
      if (result.exitCode !== 0) {
        return [new vscode.TreeItem(`list failed: ${result.stderr.trim() || result.exitCode}`)];
      }
      const rows = parseTraceListJson(result.stdout);
      if (rows.length === 0) {
        return [new vscode.TreeItem("No runs found")];
      }
      return rows.map(
        (row) =>
          new TraceRunItem(
            row.runId,
            element.traceDir,
            row.name?.trim() ? row.name : row.runId,
            row.status,
          ),
      );
    }

    return [];
  }
}

export function getSelectedRun(
  treeView: vscode.TreeView<vscode.TreeItem>,
): TraceRunItem | undefined {
  const selection = treeView.selection[0];
  return selection instanceof TraceRunItem ? selection : undefined;
}
