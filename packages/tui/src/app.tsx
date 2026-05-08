import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";

import { mapInputToAction } from "./keymap.js";
import type { TuiTraceModel, TuiTraceNode } from "./types.js";

function collectVisible(
  roots: TuiTraceNode[],
  expanded: ReadonlySet<string>,
  out: TuiTraceNode[],
): void {
  for (const n of roots) {
    out.push(n);
    if (n.children.length > 0 && expanded.has(n.id)) {
      collectVisible(n.children, expanded, out);
    }
  }
}

/** Small traces: expand all branches. Larger traces: only root rows expanded (show first nesting level). */
export function initialExpandedSet(model: TuiTraceModel): Set<string> {
  const s = new Set<string>();
  const small = model.flatNodes.length <= 15;
  if (small) {
    for (const n of model.flatNodes) {
      if (n.children.length > 0) s.add(n.id);
    }
    return s;
  }
  for (const r of model.nodes) {
    if (r.children.length > 0) s.add(r.id);
  }
  return s;
}

function formatDur(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export interface TraceViewerAppProps {
  model: TuiTraceModel;
  onExit?: () => void;
}

export function TraceViewerApp(props: TraceViewerAppProps): React.ReactElement {
  const { model, onExit } = props;
  const { exit } = useApp();
  const [expanded, setExpanded] = useState(() => initialExpandedSet(model));
  const [sel, setSel] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const visible = useMemo(() => {
    const out: TuiTraceNode[] = [];
    collectVisible(model.nodes, expanded, out);
    return out;
  }, [model.nodes, expanded]);

  useEffect(() => {
    if (visible.length === 0) {
      setSel(0);
      return;
    }
    setSel((i) => Math.min(i, visible.length - 1));
  }, [visible.length]);

  const safeSel = visible.length === 0 ? 0 : Math.min(sel, visible.length - 1);
  const selected = visible[safeSel];

  useInput((input, key) => {
    const action = mapInputToAction(input, key);
    switch (action) {
      case "quit":
        onExit?.();
        exit();
        break;
      case "help":
        setShowHelp((h) => !h);
        break;
      case "details":
        setShowDetails((d) => !d);
        break;
      case "up":
        setSel((i) => Math.max(0, i - 1));
        break;
      case "down":
        setSel((i) => Math.min(Math.max(0, visible.length - 1), i + 1));
        break;
      case "expand": {
        const cur = visible.length === 0 ? undefined : visible[safeSel];
        if (cur?.children.length) {
          setExpanded((prev) => new Set(prev).add(cur.id));
        }
        break;
      }
      case "collapse": {
        const cur = visible.length === 0 ? undefined : visible[safeSel];
        if (cur && expanded.has(cur.id)) {
          setExpanded((prev) => {
            const n = new Set(prev);
            n.delete(cur.id);
            return n;
          });
        }
        break;
      }
      case "toggle": {
        const cur = visible.length === 0 ? undefined : visible[safeSel];
        if (cur?.children.length) {
          setExpanded((prev) => {
            const n = new Set(prev);
            if (n.has(cur.id)) n.delete(cur.id);
            else n.add(cur.id);
            return n;
          });
        }
        break;
      }
      default:
        break;
    }
  });

  const indent = (d: number) => "  ".repeat(d);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>AgentInspect Trace Viewer</Text>
        <Text>
          {model.name ?? "(unnamed)"} · {model.runId} · {model.status ?? "unknown"} ·{" "}
          {formatDur(model.durationMs)}
        </Text>
      </Box>

      {showHelp ? (
        <Box flexDirection="column" marginBottom={1} borderStyle="round" paddingX={1}>
          <Text bold>Keys</Text>
          <Text>↑/↓ or j/k — move · ←/→ or h/l — collapse/expand · space — toggle branch</Text>
          <Text>enter — expand · d — toggle details · ? — this help · q / Ctrl+C / esc — quit</Text>
        </Box>
      ) : null}

      <Box flexDirection="row">
        <Box flexDirection="column" width="55%">
          <Text dimColor>Execution tree</Text>
          {visible.length === 0 ? (
            <Text dimColor>No steps recorded</Text>
          ) : (
            visible.map((n, i) => {
              const branch =
                n.children.length === 0
                  ? "  "
                  : expanded.has(n.id)
                    ? "▼ "
                    : "▶ ";
              const row = `${indent(n.depth)}${branch}${n.name}`;
              const mark = i === safeSel ? "› " : "  ";
              const status = n.status ?? "?";
              const line = `${mark}${row} (${status})`;
              return (
                <Text key={n.id} inverse={i === safeSel}>
                  {line}
                </Text>
              );
            })
          )}
        </Box>

        {showDetails ? (
          <Box flexDirection="column" paddingLeft={2} width="45%">
            <Text dimColor>Details</Text>
            {selected ? (
              <>
                <Text>
                  <Text bold>name: </Text>
                  {selected.name}
                </Text>
                <Text>
                  <Text bold>type: </Text>
                  {selected.type ?? "-"}
                </Text>
                <Text>
                  <Text bold>status: </Text>
                  {selected.status ?? "-"}
                </Text>
                <Text>
                  <Text bold>duration: </Text>
                  {formatDur(selected.durationMs)}
                </Text>
                {selected.error ? (
                  <Text>
                    <Text bold>error: </Text>
                    {selected.error}
                  </Text>
                ) : null}
                {selected.metadata && Object.keys(selected.metadata).length > 0 ? (
                  <Text>
                    <Text bold>metadata: </Text>
                    {JSON.stringify(selected.metadata)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text dimColor>Select a step</Text>
            )}
          </Box>
        ) : null}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          ↑/↓ or j/k move · enter/space expand · h/l collapse/expand · d details · ? help · q quit
        </Text>
      </Box>
    </Box>
  );
}
