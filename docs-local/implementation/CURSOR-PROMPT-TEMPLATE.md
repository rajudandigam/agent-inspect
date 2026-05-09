You are working on AgentInspect.

Before editing code, read:
1. docs/strategy/CANONICAL-POST-MVP-PLAN.md
2. docs/implementation/CURSOR-RULES.md
3. docs/roadmap/GO-NO-GO-GATES.md
4. docs/prd/<current-version>.md
5. docs/implementation/<current-guide>.md
6. Current source files related to this task

Task:
Implement only <phase-name>.

Constraints:
- Do not add dependencies unless the current guide explicitly allows it.
- Use ESM imports.
- Use node: prefix for built-ins.
- Use actual event names from storage.ts/tests.
- Do not silently infer parent-child relationships.
- Flat timeline by default for log-derived data.
- Add tests before or with implementation.
- Run pnpm build, typecheck, test, test:all, and pack:smoke.

Stop after this phase and report:
- files changed
- tests added
- commands run
- deviations from guide