# Historical reference only. Do not use as active Codex instructions. See docs/implementation/README.md and ROADMAP-V1.8.1-TO-V3.md.

# AgentInspect v1.8 Codex Kit

This kit starts the v1.8 release train from the published v1.7.0 baseline and includes the corrective work identified by the post-release review.

## Install

Copy the files into the repository while preserving paths. Review and merge rather than overwriting newer repository evidence.

1. Add `docs/implementation/ROADMAP-V1.8-TO-V3.md`.
2. Add `docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md`.
3. Replace `docs/implementation/CURRENT-TASK.md` with the supplied file.
4. Reconcile `docs/implementation/RELEASE-TRAIN-STATE.md` with the supplied baseline and the actual `git rev-parse HEAD`.
5. Apply `AGENTS-AUTONOMOUS-ADDENDUM.md` to `AGENTS.md`.
6. Apply `CODEX-MAINTAINER-GUIDE-ADDENDUM.md` to the maintainer guide.
7. Start a fresh Codex thread with `PROMPT-AUTONOMOUS-V1.8.md`.

Codex may proceed continuously through validated chunks. It must pause once for the maintainer's manual first publication of `@agent-inspect/openai-agents@1.8.0`. Resume with `PROMPT-RESUME-AFTER-OPENAI-FIRST-PUBLISH.md`.

Do not copy this kit README into the published npm package.
