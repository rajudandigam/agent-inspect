Thanks for opening this proposal — it helped define the local observability CLI surface.

**Closing as completed:** `agent-inspect timeline` shipped in **v1.4.0** (see [CHANGELOG.md](../../CHANGELOG.md#140)). Implementation: `packages/cli/src/timeline.ts` with tests in `packages/cli/test/timeline.test.ts`.

The v3.x product continues to evolve session/timeline views (`agent-inspect session --timeline`), but the original proposal scope is satisfied.

If you see a **specific gap** in the current timeline workflow on v3.5.x, please open a focused follow-up with the command you ran, expected output, and AgentInspect version.

**Superseded by:** shipped CLI + [ROADMAP.md](../../ROADMAP.md) Released recently § v1.4.0
