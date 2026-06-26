import type { TuiTraceModel } from "./types.js";

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
