export interface LlmStreamState {
  chunkCount: number;
  firstChunkAt?: number;
  lastChunkAt?: number;
  streamedCharCount: number;
  previewChars: string;
  previewTruncated: boolean;
}

export function createLlmStreamState(): LlmStreamState {
  return {
    chunkCount: 0,
    streamedCharCount: 0,
    previewChars: "",
    previewTruncated: false,
  };
}

export function recordLlmStreamToken(
  state: LlmStreamState,
  token: string,
  now: number,
  maxPreviewChars: number,
): void {
  state.chunkCount += 1;
  if (state.firstChunkAt === undefined) {
    state.firstChunkAt = now;
  }
  state.lastChunkAt = now;

  if (typeof token === "string" && token.length > 0) {
    state.streamedCharCount += token.length;
    if (maxPreviewChars > 0) {
      const remaining = maxPreviewChars - state.previewChars.length;
      if (remaining > 0) {
        const slice = token.slice(0, remaining);
        state.previewChars += slice;
        if (token.length > remaining) {
          state.previewTruncated = true;
        }
      } else {
        state.previewTruncated = true;
      }
    }
  }
}

export function streamMetadataFromState(
  state: LlmStreamState | undefined,
  options: {
    capturePreview: boolean;
    maxPreviewChars: number;
  },
): Record<string, unknown> | undefined {
  if (!state || state.chunkCount === 0) {
    return undefined;
  }

  const out: Record<string, unknown> = {
    stream: true,
    chunkCount: state.chunkCount,
    streamedCharCount: state.streamedCharCount,
  };

  if (state.firstChunkAt !== undefined) {
    out.firstChunkAt = state.firstChunkAt;
  }
  if (state.lastChunkAt !== undefined) {
    out.lastChunkAt = state.lastChunkAt;
  }
  if (
    state.firstChunkAt !== undefined &&
    state.lastChunkAt !== undefined &&
    state.lastChunkAt >= state.firstChunkAt
  ) {
    out.streamDurationMs = state.lastChunkAt - state.firstChunkAt;
  }
  if (state.previewTruncated) {
    out.previewTruncated = true;
  }

  if (options.capturePreview && state.previewChars.length > 0) {
    const preview =
      state.previewChars.length <= options.maxPreviewChars
        ? state.previewChars
        : `${state.previewChars.slice(0, options.maxPreviewChars)}…`;
    out.streamPreview = preview;
    if (state.previewChars.length > options.maxPreviewChars) {
      out.previewTruncated = true;
    }
  }

  return out;
}
