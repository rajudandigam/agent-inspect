import { describe, expect, it } from "vitest";

import {
  getCurrentContext,
  getCurrentCorrelationMetadata,
  getCurrentDepth,
  getCurrentRunId,
  getCurrentRunName,
  getCurrentStepId,
  getParentStepId,
  getTraceDirFromContext,
  hasActiveContext,
  isSilentContext,
  runWithContext,
  runWithStepContext,
} from "../src/context.js";

describe("context outside run", () => {
  it("reports no active run or step", () => {
    expect(getCurrentContext()).toBeUndefined();
    expect(getCurrentRunId()).toBeUndefined();
    expect(getCurrentRunName()).toBeUndefined();
    expect(getCurrentStepId()).toBeUndefined();
    expect(getParentStepId()).toBeUndefined();
    expect(getCurrentDepth()).toBe(0);
    expect(hasActiveContext()).toBe(false);
    expect(getTraceDirFromContext()).toBeUndefined();
    expect(isSilentContext()).toBe(false);
  });
});

describe("runWithContext", () => {
  const context = {
    runId: "run_test123",
    runName: "test-run",
    traceDir: "/tmp/traces",
    silent: false,
    metadata: { environment: "test" },
  };

  it("exposes run fields inside callback and clears after", async () => {
    expect(hasActiveContext()).toBe(false);

    await runWithContext(context, async () => {
      expect(hasActiveContext()).toBe(true);
      expect(getCurrentRunId()).toBe("run_test123");
      expect(getCurrentRunName()).toBe("test-run");
      expect(getTraceDirFromContext()).toBe("/tmp/traces");
      expect(isSilentContext()).toBe(false);
      expect(getCurrentStepId()).toBeUndefined();
      expect(getCurrentDepth()).toBe(0);
    });

    expect(hasActiveContext()).toBe(false);
    expect(getCurrentContext()).toBeUndefined();
  });

  it("honors silent: true", async () => {
    await runWithContext({ ...context, silent: true }, async () => {
      expect(isSilentContext()).toBe(true);
    });
  });

  it("preserves metadata reference on getCurrentContext", async () => {
    const meta = { environment: "test" };
    await runWithContext({ ...context, metadata: meta }, async () => {
      expect(getCurrentContext()?.metadata).toBe(meta);
    });
  });

  it("getCurrentCorrelationMetadata returns known keys from run metadata", async () => {
    await runWithContext(
      {
        ...context,
        metadata: {
          correlationId: "corr-ctx",
          requestId: "req-ctx",
          environment: "test",
        },
      },
      async () => {
        expect(getCurrentCorrelationMetadata()).toEqual({
          correlationId: "corr-ctx",
          requestId: "req-ctx",
        });
      },
    );
  });

  it("nested step context preserves metadata", async () => {
    const meta = { k: 1 };
    await runWithContext({ ...context, metadata: meta }, async () => {
      await runWithStepContext("step_x", async () => {
        expect(getCurrentContext()?.metadata).toBe(meta);
      });
    });
  });

  it("nested step context depth and step id", async () => {
    await runWithContext(context, async () => {
      await runWithStepContext("step_parent", async () => {
        expect(getCurrentStepId()).toBe("step_parent");
        expect(getParentStepId()).toBe("step_parent");
        expect(getCurrentDepth()).toBe(1);

        await runWithStepContext("step_child", async () => {
          expect(getCurrentStepId()).toBe("step_child");
          expect(getParentStepId()).toBe("step_child");
          expect(getCurrentDepth()).toBe(2);
        });

        expect(getCurrentStepId()).toBe("step_parent");
        expect(getCurrentDepth()).toBe(1);
      });

      expect(getCurrentStepId()).toBeUndefined();
      expect(getCurrentDepth()).toBe(0);
    });
  });

  it("isolates Promise.all sibling step contexts", async () => {
    await runWithContext(context, async () => {
      await runWithStepContext("step_parent", async () => {
        const results = await Promise.all([
          runWithStepContext("step_a", async () => {
            await new Promise<void>((resolve) => {
              setTimeout(resolve, 10);
            });
            return {
              stepId: getCurrentStepId(),
              depth: getCurrentDepth(),
            };
          }),
          runWithStepContext("step_b", async () => {
            await new Promise<void>((resolve) => {
              setTimeout(resolve, 5);
            });
            return {
              stepId: getCurrentStepId(),
              depth: getCurrentDepth(),
            };
          }),
        ]);

        expect(results).toContainEqual({ stepId: "step_a", depth: 2 });
        expect(results).toContainEqual({ stepId: "step_b", depth: 2 });

        expect(getCurrentStepId()).toBe("step_parent");
        expect(getCurrentDepth()).toBe(1);
      });
    });
  });

  it("isolates concurrent runs in Promise.all", async () => {
    const c1 = {
      runId: "run_1",
      runName: "r1",
      traceDir: "/t1",
      silent: false,
    };
    const c2 = {
      runId: "run_2",
      runName: "r2",
      traceDir: "/t2",
      silent: false,
    };

    const result = await Promise.all([
      runWithContext(c1, async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        return getCurrentRunId();
      }),
      runWithContext(c2, async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 5);
        });
        return getCurrentRunId();
      }),
    ]);

    expect(result.sort()).toEqual(["run_1", "run_2"]);
    expect(hasActiveContext()).toBe(false);
  });

  it("rejects with original error and clears context", async () => {
    const err = new Error("run boom");
    await expect(
      runWithContext(context, async () => {
        throw err;
      }),
    ).rejects.toBe(err);

    expect(hasActiveContext()).toBe(false);
  });

  it("rejects from runWithStepContext and restores parent", async () => {
    const err = new Error("step boom");
    await runWithContext(context, async () => {
      await expect(
        runWithStepContext("step_parent", async () => {
          await runWithStepContext("step_bad", async () => {
            throw err;
          });
        }),
      ).rejects.toBe(err);

      expect(getCurrentStepId()).toBeUndefined();
      expect(getCurrentDepth()).toBe(0);
    });
  });

  it("runWithStepContext outside run runs fn without context", async () => {
    const out = await runWithStepContext("orphan_step", async () => "ok");
    expect(out).toBe("ok");
    expect(hasActiveContext()).toBe(false);
  });

  it("supports sync callbacks for runWithContext", async () => {
    const v = await runWithContext(context, () => "sync-result");
    expect(v).toBe("sync-result");
  });

  it("supports sync callbacks for runWithStepContext inside run", async () => {
    await runWithContext(context, async () => {
      const v = await runWithStepContext("step_sync", () => "sync-step");
      expect(v).toBe("sync-step");
    });
  });
});
