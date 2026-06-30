# Historical reference only. Do not use as active Codex instructions. See docs/implementation/README.md and ROADMAP-V1.8.1-TO-V3.md.

# Autonomous v1.8 Codex Prompt

```text
Read AGENTS.md first.

The maintainer explicitly authorizes autonomous execution of the complete v1.8.0 release train defined in:

- docs/implementation/ROADMAP-V1.8-TO-V3.md
- docs/implementation/release-trains/V1.8.0-EXECUTION-PLAN.md
- docs/implementation/CURRENT-TASK.md

This authorization permits one validated commit and fast-forward push to the existing main branch per completed chunk, state/task updates, and continuation to the next chunk without routine maintainer confirmation.

It does not authorize force pushes, destructive Git operations, bypassing CI, local npm publication, credentials, hidden network behavior, schema 1.0, a third persisted format, root/core framework dependencies, public breaking changes, or unrelated edits.

Start with:

git status --short
git branch --show-current
git log -5 --oneline
git diff --check
git pull --ff-only origin main
git rev-parse HEAD

Require a clean main branch. Reconcile actual Git/package/npm state with RELEASE-TRAIN-STATE.md. Verify:

npm view agent-inspect version
npm view @agent-inspect/ai-sdk version
npm view @agent-inspect/langchain version
npm view @agent-inspect/tui version

Execute CURRENT-TASK.md, then continue through every ordered chunk in V1.8.0-EXECUTION-PLAN.md.

For each chunk:

1. report starting commit, exact scope, out-of-scope items, expected files, focused tests, compatibility risks, and security risks;
2. inspect only directly relevant RFC/source/tests after the planning reset;
3. implement behavior and focused tests together;
4. run focused tests during iteration;
5. run the chunk gate once when stable;
6. run git diff --check;
7. review the complete diff for correctness, safety, compatibility, package boundaries, lifecycle/concurrency, and scope;
8. update RELEASE-TRAIN-STATE.md and CURRENT-TASK.md;
9. commit using the execution-plan message;
10. push main without force;
11. verify required CI;
12. continue immediately to the next chunk.

Mandatory corrective behavior before check work:

- AI SDK lifecycle rows must preserve one logical run/step/tool identity through canonical readers and trees;
- adapter fixtures must exercise readTrace/openTrace, tree, what/report, diff, and later check paths;
- overlapping AI SDK calls must not share mutable lifecycle state;
- provider failure, interrupted streaming, callback disorder, unsafe values, writer failure, flush, and close must be covered;
- preview/redaction options must work or be explicitly deprecated, never silently ignored;
- optional public packages must pass packed clean-install ESM/CJS/types/runtime smoke;
- OpenAI Agents must implement the official local processor without auto-install or upload;
- LangGraph support must have executable no-network fixtures;
- conformance must validate behavior, not only a JSON matrix.

Mandatory v1.8 behavior:

- pure deterministic check engine on normalized input;
- evidence-bearing result for every failure;
- run/tool/LLM/structure/safety/baseline rules;
- built CLI exit codes 0 pass, 1 failed rules, 2 invalid arguments/config, 3 unreadable trace, 4 unsupported format;
- no YAML dependency, LLM call, network call, GitHub App, OAuth, automatic PR comment, or repository-write integration;
- redaction and safety before artifact rendering;
- Vitest and Jest integrations remain separate and never mask original failures.

Do not weaken tests, snapshots, coverage, size limits, compatibility smoke, safety defaults, or package boundaries. Do not fabricate adoption evidence.

At chunk 20 run the complete release gate exactly as written and produce release-readiness evidence.

At chunk 21 prepare and validate the packed @agent-inspect/openai-agents@1.8.0 package, including package metadata, ESM/CJS/types, clean install, no-network behavior, and tarball contents. Then stop before npm publication and provide the exact manual first-publication checklist. Do not publish it yourself.

Resume only after the maintainer confirms:

npm view @agent-inspect/openai-agents@1.8.0 version

returns 1.8.0.

After the resume prompt, finish Changesets release automation for the remaining packages, merge only a green and correct Version Packages PR, verify all npm versions/dist-tags/tarballs/tags/releases, update state/readiness/task documents, commit, push, and stop with the final release report.

Stop earlier only for unrelated worktree changes, material roadmap conflict, public breaking/schema/dependency/network decisions, unresolved validation failure, branch protection/credentials, partial publication, or inconsistent registry state. Preserve all completed work and report the smallest required maintainer action.
```
