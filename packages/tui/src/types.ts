export interface TuiTraceNode {
  id: string;
  name: string;
  type?: string;
  status?: string;
  durationMs?: number;
  depth: number;
  parentId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  children: TuiTraceNode[];
}

export interface TuiTraceModel {
  runId: string;
  name?: string;
  status?: string;
  durationMs?: number;
  nodes: TuiTraceNode[];
  flatNodes: TuiTraceNode[];
}
