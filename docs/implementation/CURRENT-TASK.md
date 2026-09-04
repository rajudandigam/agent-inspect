# Current task

```yaml
executionMode: maintainer-reviewed
namedTrain: agentinspect-feedback-integrity-v6.17.5-to-v6.22
currentTrain: v6.17.8-queue-health
trainStatus: in-progress
currentChunk: 6178-await-consolidate
nextAction: "Wait #297/#306 consolidate; #307 rebase for 6.18; VS Code scope on #295; Patrick reply on #331"
canonicalRoadmap: docs/implementation/ROADMAP.md
activePlan: docs/implementation/active/6178-622-QUEUE.md
pendingManualGate: ""
```

## Published baseline

**6.17.7**. Persisted schema **1.0**.

## External gates

- Jan retest email: **sent** (maintainer)
- Patrick refusal-evidence model ask: **sent** (maintainer); recipe #331 still blocked on reply

## Active — v6.17.8 queue health

1. Landed #314 demo:verify fail-closed tests
2. Landed #296/#305/#294/#302/#303 + dependency-review + SECURITY.md via #337
3. #297+#306 remain contributor-consolidate
4. #307 → 6.18; #315 → 6.20; #142 → Menno/#115 hold; #295 → VS Code scope triage
