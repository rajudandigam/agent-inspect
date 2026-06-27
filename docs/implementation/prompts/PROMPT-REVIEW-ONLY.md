# Codex prompt — review only

Read `AGENTS.md` first.

Review the current AgentInspect diff only. Do not edit files.

Run:

```bash
git status --short
git diff --stat
git diff --check
git diff
```

Compare the diff against:

- `docs/implementation/CURRENT-TASK.md`
- active execution-plan chunk
- `docs/implementation/V2-TO-V3-ARCHITECTURE-GUIDE.md`
- relevant proposal/RFC
- product boundaries in `ROADMAP-V2.1-TO-V3-FULL.md`

Review in this order:

1. breaking changes;
2. local-first/no-network guarantees;
3. privacy/redaction/capture defaults;
4. schema and trace compatibility;
5. package/public export boundaries;
6. adapter/report/eval correctness;
7. tests and fixtures;
8. docs accuracy;
9. performance/size;
10. scope creep.

Report:

- blockers;
- non-blockers;
- missing tests;
- suggested minimal fixes;
- whether the diff is ready for commit.

Do not modify, commit, push, version, tag, publish, or create a release.
