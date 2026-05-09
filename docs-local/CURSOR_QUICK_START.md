# AgentInspect: Cursor Quick Start Card


**🚀 Get Started in 5 Minutes**


---


## Step 0: Project Setup (30 minutes)


### Prompt for Cursor:


```
Create a pnpm monorepo for the agent-inspect library with the following structure:


1. Root package.json:
  - name: "agent-inspect"
  - version: "0.1.0"
  - license: "MIT"
  - type: "module"
  - Include scripts: build, test, dev, lint
  - devDependencies: typescript ^5.6.0, vitest ^2.1.0, tsup ^8.3.0, @types/node ^22.0.0


2. pnpm-workspace.yaml:
  - packages: ["packages/*"]


3. packages/core/package.json:
  - name: "@agent-inspect/core" (internal)
  - dependencies: nanoid ^5.0.7, chalk ^5.3.0
  - exports: ESM + CJS via tsup


4. packages/cli/package.json:
  - name: "@agent-inspect/cli" (internal)
  - dependencies: commander ^12.1.0, @agent-inspect/core (workspace:*)
  - bin: { "agent-inspect": "./dist/index.js" }


5. Root tsconfig.json:
  - target: ES2022
  - module: ESNext
  - moduleResolution: bundler
  - strict: true
  - esModuleInterop: true


6. tsup.config.ts for packages/core:
  - entry: ["src/index.ts"]
  - format: ["esm", "cjs"]
  - dts: true
  - clean: true


7. vitest.config.ts:
  - test environment: node
  - coverage provider: v8


8. .gitignore:
  - node_modules/, dist/, coverage/, .DS_Store, *.log


9. LICENSE (MIT)


10. README.md with basic title and "Work in progress"


Use pnpm as package manager. Ensure all packages build successfully.
```


### After Cursor Generates:


```bash
pnpm install
pnpm build
git init
git add .
git commit -m "chore: initial project setup"
```


---


## Daily Workflow


### Each Morning:


1. **Read** the PRD section for today's step
2. **Copy** the Cursor prompt from CURSOR_IMPLEMENTATION_GUIDE.md
3. **Paste** into Cursor
4. **Review** generated code
5. **Write** tests
6. **Run** `pnpm test`
7. **Commit** with conventional commit message
8. **Move** to next step


---


## Quick Commands


```bash
# Build
pnpm build


# Test
pnpm test
pnpm test:watch
pnpm test:coverage


# Type Check
pnpm typecheck


# Clean
pnpm clean


# Publish (Day 10)
pnpm publish --dry-run
pnpm publish --access public
```


---


## Commit Messages


```bash
# Format
<type>(<scope>): <description>


# Examples
git commit -m "feat(core): add inspectRun() function"
git commit -m "test(step): add nested step tests"
git commit -m "docs(readme): add quickstart guide"
git commit -m "fix(storage): handle ENOENT gracefully"
```


---


## File Structure Reference


```
agent-inspect/
├── packages/
│   ├── core/src/
│   │   ├── types.ts         # Day 1
│   │   ├── utils.ts         # Day 2
│   │   ├── context.ts       # Day 2
│   │   ├── storage.ts       # Day 3
│   │   ├── terminal.ts      # Day 3
│   │   ├── inspect-run.ts   # Day 4
│   │   ├── step.ts          # Day 5
│   │   └── observe.ts       # Day 6
│   └── cli/src/
│       ├── index.ts         # Day 7
│       ├── list.ts          # Day 7
│       └── view.ts          # Day 7
└── examples/
   ├── 01-basic/            # Day 8
   ├── 02-nested-steps/     # Day 8
   ├── 03-parallel-steps/   # Day 8
   ├── 04-error-handling/   # Day 8
   └── 05-observe-wrapper/  # Day 8
```


---


## Success Checklist (Per Step)


- [ ] Code compiles
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Examples work (if applicable)
- [ ] Edge cases covered
- [ ] Error handling validated
- [ ] Committed to git


---


## Critical Rules


### 1. Never Break the Agent
```typescript
// ✅ Good
try {
 await instrumentationCode();
} catch (error) {
 console.warn('[AgentInspect]', error);
 // Continue - agent still works
}


// ❌ Bad
await instrumentationCode(); // Throws -> crashes agent
```


### 2. Always Clean Up Context
```typescript
// ✅ Good
try {
 enterStep(stepId);
 const result = await fn();
 return result;
} finally {
 exitStep(); // Always cleanup
}
```


### 3. Test Edge Cases
- ✅ Happy path
- ✅ Error scenarios
- ✅ Invalid inputs
- ✅ Concurrent execution
- ✅ Outside context


---


## When Stuck


1. **Re-read PRD section** - Am I over-engineering?
2. **Check implementation guide** - Did I follow the prompt?
3. **Look at test requirements** - What am I missing?
4. **Simplify** - Can this be simpler?


---


## Progress Tracker


### Week 1
- [ ] Day 1: Types ✅
- [ ] Day 2: Utils + Context ✅
- [ ] Day 3: Storage + Terminal ✅
- [ ] Day 4: inspectRun() ✅
- [ ] Day 5: step() + helpers ✅
- [ ] Day 6: observe() ✅
- [ ] Day 7: CLI ✅


### Week 2
- [ ] Day 8: Examples ✅
- [ ] Day 9: Documentation ✅
- [ ] Day 10: Publish ✅


---


## Verification Checklist (Day 10)


```bash
# Build
pnpm clean && pnpm build


# Test
pnpm test


# Type Check
pnpm typecheck


# Examples
cd examples/01-basic && pnpm start


# CLI
npx agent-inspect list


# Pack & Test Install
pnpm pack
npm install -g ./agent-inspect-0.1.0.tgz
agent-inspect list


# Publish
pnpm publish --access public
```


---


## Resources


- **PRD:** AGENT_INSPECT_PRD_FINAL.md
- **Guide:** CURSOR_IMPLEMENTATION_GUIDE.md
- **Summary:** IMPLEMENTATION_SUMMARY.md


---


**Ready? Open Cursor and start with Step 0! 🚀**





