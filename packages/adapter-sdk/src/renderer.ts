import type { InspectRunTree } from "agent-inspect/advanced";

export type RenderRedactionProfile = "local" | "share" | "strict";

export interface RenderSafetyOptions {
  redactionProfile?: RenderRedactionProfile;
  maxContentLength?: number;
  forbiddenRawStrings?: readonly string[];
}

export interface TraceRendererResult {
  content: string;
  contentType: string;
  warnings: string[];
}

export interface TraceRendererOptions extends RenderSafetyOptions {
  [key: string]: unknown;
}

export interface TraceRenderer {
  readonly format: string;
  render(tree: InspectRunTree, options?: TraceRendererOptions): TraceRendererResult;
}

export function defineRenderer(renderer: TraceRenderer): TraceRenderer {
  if (!renderer.format.trim()) throw new Error("renderer format is required");
  return renderer;
}

export function renderWithSafety(
  renderer: TraceRenderer,
  tree: InspectRunTree,
  options: TraceRendererOptions = {},
): TraceRendererResult {
  const rendered = renderer.render(tree, options);
  const warnings = [...rendered.warnings];
  const maxLen = options.maxContentLength ?? 500_000;

  if (rendered.content.length > maxLen) {
    warnings.push(
      `renderer.truncated: content exceeded maxContentLength (${maxLen}); output truncated`,
    );
    return {
      content: rendered.content.slice(0, maxLen),
      contentType: rendered.contentType,
      warnings,
    };
  }

  if (options.forbiddenRawStrings && options.forbiddenRawStrings.length > 0) {
    for (const raw of options.forbiddenRawStrings) {
      if (rendered.content.includes(raw)) {
        warnings.push(
          `renderer.forbidden-leak: output contains forbidden substring (${raw.length} chars)`,
        );
      }
    }
  }

  if (options.redactionProfile === "share" || options.redactionProfile === "strict") {
    warnings.push(
      `renderer.redaction-profile:${options.redactionProfile} — verify output before sharing`,
    );
  }

  return {
    content: rendered.content,
    contentType: rendered.contentType,
    warnings,
  };
}
