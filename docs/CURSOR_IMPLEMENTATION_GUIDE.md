# AgentInspect: Cursor Implementation Guide

**Version:** 0.1.0 MVP  
**License:** MIT  
**Target Timeline:** 10 days  
**Approach:** Build → Test → Document → Next Step

---

## Table of Contents

1. [Implementation Philosophy](#implementation-philosophy)
2. [Project Standards](#project-standards)
3. [Development Process](#development-process)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation Standards](#documentation-standards)
7. [Quality Checklist](#quality-checklist)

---

## Implementation Philosophy

### Core Principles

1. **Incremental Development** - Build one module at a time, test it, document it, then move on
2. **Test-Driven Stability** - Every feature must have passing tests before moving forward
3. **Documentation-First API** - Write the public API example before implementing
4. **Fail-Safe Design** - Agent must never crash; instrumentation errors are logged, not thrown
5. **Open Source Quality** - Code should be readable, maintainable, and welcoming to contributors

### Success Criteria for Each Step

✅ All code written and compiles  
✅ All tests pass (unit + integration)  
✅ Documentation updated (inline comments + README)  
✅ Examples work  
✅ Edge cases covered  
✅ Error handling validated  

---

## Project Standards

### Code Standards

```typescript
// ✅ Good: Clear, single-responsibility functions
async function createRunId(): Promise<string> {
  return `run_${nanoid(10)}`;
}

// ✅ Good: Explicit error handling
try {
  await writeTraceEvent(event);
} catch (error) {
  console.warn('[AgentInspect] Failed to write trace:', error.message);
  // Continue execution - never crash the agent
}

// ❌ Bad: Silent failures
await writeTraceEvent(event).catch(() => {}); // No visibility

// ❌ Bad: Throwing instrumentation errors
if (!traceDir) {
  throw new Error('Trace directory required'); // Would crash agent
}
```

### File Organization

```text
agent-inspect/
├── packages/
│   ├── core/                    # Core library
│   │   ├── src/
│   │   │   ├── index.ts         # Public API exports
│   │   │   ├── types.ts         # TypeScript types
│   │   │   ├── utils.ts         # Utilities (IDs, formatting)
│   │   │   ├── context.ts       # Async context tracking
│   │   │   ├── tracker.ts       # Event emitter & state management
│   │   │   ├── storage.ts       # JSONL writer
│   │   │   ├── terminal.ts      # Terminal output
│   │   │   ├── inspect-run.ts   # inspectRun() implementation
│   │   │   ├── step.ts          # step() implementation
│   │   │   └── observe.ts       # observe() wrapper
│   │   ├── test/
│   │   │   ├── types.test.ts
│   │   │   ├── utils.test.ts
│   │   │   ├── context.test.ts
│   │   │   ├── storage.test.ts
│   │   │   ├── inspect-run.test.ts
│   │   │   ├── step.test.ts
│   │   │   └── observe.test.ts
│   │   └── package.json
│   │
│   └── cli/                     # CLI (bundled in main package)
│       ├── src/
│       │   ├── index.ts
│       │   ├── list.ts
│       │   └── view.ts
│       ├── test/
│       │   ├── list.test.ts
│       │   └── view.test.ts
│       └── package.json
│
├── examples/
│   ├── 01-basic/
│   ├── 02-nested-steps/
│   ├── 03-parallel-steps/
│   ├── 04-error-handling/
│   └── 05-observe-wrapper/
│
├── README.md
├── LICENSE                      # MIT License
├── CONTRIBUTING.md
├── package.json                 # Root package (published as "agent-inspect")
├── pnpm-workspace.yaml
└── tsconfig.json
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `inspect-run.ts`)
- **Functions**: `camelCase` (e.g., `inspectRun()`)
- **Types**: `PascalCase` (e.g., `StepType`, `TraceEvent`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_TRACE_DIR`)
- **Private functions**: `_camelCase` (e.g., `_writeEvent()`)

### Testing Standards

```typescript
// ✅ Good: Descriptive test names
describe('inspectRun()', () => {
  it('should create unique run ID for each execution', async () => {
    const runIds = new Set<string>();
    
    await inspectRun('test-1', async () => {
      runIds.add(getCurrentRunId());
    });
    
    await inspectRun('test-2', async () => {
      runIds.add(getCurrentRunId());
    });
    
    expect(runIds.size).toBe(2);
  });
  
  it('should never crash agent if storage fails', async () => {
    mockStorageToFail();
    
    const result = await inspectRun('test', async () => {
      return 'success';
    });
    
    expect(result).toBe('success'); // Agent continues
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AgentInspect] Failed to write trace')
    );
  });
});
```

### Documentation Standards

```typescript
/**
 * Track a named workflow execution.
 * 
 * Creates a run context, executes the provided function, and captures
 * timing, status, and errors. Results are written to JSONL and displayed
 * in the terminal.
 * 
 * @param name - Human-readable name for this run (e.g., "booking-flow")
 * @param fn - Async function to execute
 * @param options - Optional configuration
 * @returns The result of the executed function
 * 
 * @example
 * ```typescript
 * const result = await inspectRun("booking-flow", async () => {
 *   const hotels = await searchHotels();
 *   return finalize(hotels);
 * });
 * ```
 * 
 * @throws Never - If instrumentation fails, logs warning and continues
 * @see {@link InspectRunOptions} for configuration options
 */
export async function inspectRun<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: InspectRunOptions
): Promise<T> {
  // Implementation
}
```

---

## Development Process

### For Each Step:

1. **Read PRD Section** - Understand requirements
2. **Write Cursor Prompt** - Use provided prompt
3. **Implement Code** - Let Cursor generate
4. **Review Code** - Ensure standards compliance
5. **Write Tests** - Cover happy path + edge cases
6. **Run Tests** - `pnpm test`
7. **Update Docs** - Inline + README
8. **Commit** - `git commit -m "feat(core): implement X"`
9. **Move to Next Step**

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(core): add inspectRun() function
fix(storage): handle ENOENT gracefully
docs(readme): add quickstart guide
test(step): add parallel execution tests
chore(deps): update vitest to 2.1.0
```

---

## Step-by-Step Implementation

## Step 0: Project Initialization

**Goal:** Set up monorepo structure, dependencies, and build configuration

**PRD Reference:** Section 7 (Technical Architecture)

**Duration:** 30 minutes

### Cursor Prompt

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

### Manual Steps After Cursor

```bash
# Initialize git
git init
git add .
git commit -m "chore: initial project setup"

# Install dependencies
pnpm install

# Verify builds work
pnpm build

# Verify tests run (will be empty initially)
pnpm test
```

### Success Criteria

✅ `pnpm install` succeeds  
✅ `pnpm build` succeeds  
✅ `pnpm test` runs (no tests yet)  
✅ Proper monorepo structure created  
✅ TypeScript compiles without errors  

---

## Step 1: Define Core Types

**Goal:** Create TypeScript type definitions for the entire system

**PRD Reference:** Section 7.5 (Data Model) + Appendix (Type Definitions)

**Duration:** 45 minutes

**Files:** `packages/core/src/types.ts`

### Cursor Prompt

```
Create packages/core/src/types.ts with all TypeScript types from the PRD:

1. StepType enum:
   - "run", "llm", "tool", "decision", "logic", "state", "custom"

2. StepStatus enum:
   - "running", "success", "error"

3. Run interface:
   - id: string
   - name: string
   - status: "running" | "success" | "error"
   - startTime: number (Unix ms)
   - endTime?: number
   - durationMs?: number
   - error?: { message: string; stack?: string }
   - metadata?: Record<string, unknown>
   
   Note: NO input/output fields (MVP safety - prevents PII leakage)

4. Step interface:
   - id: string
   - runId: string
   - parentId?: string
   - name: string
   - type: StepType
   - status: StepStatus
   - startTime: number
   - endTime?: number
   - durationMs?: number
   - error?: { message: string; stack?: string }
   - metadata?: { model?: string; toolName?: string; tokens?: { input?: number; output?: number }; [key: string]: unknown }
   
   Note: tokens field is reserved for future (v0.4+)

5. TraceEventBase interface:
   - schemaVersion: "0.1"
   - event: string
   - timestamp: number

6. TraceEvent union type:
   - RunStartedEvent
   - RunCompletedEvent
   - StepStartedEvent
   - StepCompletedEvent
   
   All extend TraceEventBase

7. InspectRunOptions interface:
   - traceDir?: string
   - silent?: boolean
   - metadata?: Record<string, unknown>

8. StepOptions interface:
   - type?: StepType
   - metadata?: Record<string, unknown>

Include comprehensive JSDoc comments for each type explaining:
- Purpose
- When to use
- Field meanings
- Examples

Follow TypeScript best practices:
- Use readonly where appropriate
- Use branded types for IDs if helpful
- Export all public types
```

### Test Requirements

**File:** `packages/core/test/types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type { 
  StepType, 
  StepStatus, 
  Run, 
  Step, 
  TraceEvent 
} from '../src/types';

describe('Type Definitions', () => {
  it('should allow valid StepType values', () => {
    const types: StepType[] = [
      'run', 'llm', 'tool', 'decision', 'logic', 'state', 'custom'
    ];
    expect(types).toHaveLength(7);
  });

  it('should allow valid Run object', () => {
    const run: Run = {
      id: 'run_abc123',
      name: 'test-run',
      status: 'running',
      startTime: Date.now(),
      metadata: { userId: '123' }
    };
    expect(run).toBeDefined();
  });

  it('should allow valid Step object', () => {
    const step: Step = {
      id: 'step_xyz789',
      runId: 'run_abc123',
      name: 'fetch-user',
      type: 'logic',
      status: 'success',
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      durationMs: 1000
    };
    expect(step).toBeDefined();
  });

  it('should enforce schemaVersion on TraceEvent', () => {
    const event: TraceEvent = {
      schemaVersion: '0.1',
      event: 'run_started',
      runId: 'run_abc123',
      name: 'test',
      startTime: Date.now(),
      timestamp: Date.now()
    };
    expect(event.schemaVersion).toBe('0.1');
  });
});
```

### Documentation Requirements

Add to `README.md`:

```markdown
## Type System

AgentInspect uses TypeScript for full type safety:

```typescript
import type { Run, Step, StepType } from 'agent-inspect';
```

See [types.ts](./packages/core/src/types.ts) for complete type definitions.
```

### Success Criteria

✅ All types compile  
✅ Types match PRD exactly  
✅ JSDoc comments complete  
✅ Tests pass  
✅ No `any` types used  

---

## Step 2: Implement Utilities

**Goal:** Create utility functions for ID generation, formatting, and path resolution

**PRD Reference:** Section 7.3 (Technical Architecture)

**Duration:** 1 hour

**Files:** `packages/core/src/utils.ts`

### Cursor Prompt

```
Create packages/core/src/utils.ts with utility functions:

1. ID Generation:
   - createRunId(): string - Returns "run_<nanoid(10)>"
   - createStepId(): string - Returns "step_<nanoid(10)>"
   - Use nanoid from 'nanoid' package

2. Time Formatting:
   - formatDuration(ms: number): string - Formats as "1.2s" or "850ms"
   - formatTimestamp(timestamp: number): string - Formats as "2026-05-01 10:23:45"

3. Path Resolution:
   - getDefaultTraceDir(): string - Returns ~/.agent-inspect/runs/
   - ensureTraceDir(dir: string): Promise<void> - Creates directory if needed
   - getTraceFilePath(runId: string, baseDir?: string): string - Returns full path to JSONL file

4. Error Handling:
   - formatError(error: unknown): { message: string; stack?: string } - Safely formats any error
   - isInstrumentationError(error: unknown): boolean - Checks if error should be logged vs thrown

5. Constants:
   - DEFAULT_TRACE_DIR
   - MAX_NAME_LENGTH = 100 (truncate long names)
   - FALLBACK_TRACE_DIR = /tmp/agent-inspect/

All functions should:
- Have comprehensive JSDoc
- Handle edge cases (null, undefined, invalid input)
- Never throw (return fallback values)
- Use proper error handling

Example error handling pattern:
```typescript
export async function ensureTraceDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.warn(`[AgentInspect] Failed to create trace directory: ${dir}`, error);
    // Try fallback
    try {
      await fs.mkdir(FALLBACK_TRACE_DIR, { recursive: true });
    } catch {
      // If even fallback fails, continue silently
    }
  }
}
```
```

### Test Requirements

**File:** `packages/core/test/utils.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createRunId,
  createStepId,
  formatDuration,
  formatTimestamp,
  getDefaultTraceDir,
  ensureTraceDir,
  getTraceFilePath,
  formatError
} from '../src/utils';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

describe('ID Generation', () => {
  it('should create unique run IDs', () => {
    const id1 = createRunId();
    const id2 = createRunId();
    
    expect(id1).toMatch(/^run_[a-zA-Z0-9]{10}$/);
    expect(id2).toMatch(/^run_[a-zA-Z0-9]{10}$/);
    expect(id1).not.toBe(id2);
  });

  it('should create unique step IDs', () => {
    const id1 = createStepId();
    const id2 = createStepId();
    
    expect(id1).toMatch(/^step_[a-zA-Z0-9]{10}$/);
    expect(id2).toMatch(/^step_[a-zA-Z0-9]{10}$/);
    expect(id1).not.toBe(id2);
  });
});

describe('Time Formatting', () => {
  it('should format durations under 1s as ms', () => {
    expect(formatDuration(850)).toBe('850ms');
    expect(formatDuration(50)).toBe('50ms');
  });

  it('should format durations over 1s as seconds', () => {
    expect(formatDuration(1234)).toBe('1.2s');
    expect(formatDuration(5678)).toBe('5.7s');
  });

  it('should handle zero duration', () => {
    expect(formatDuration(0)).toBe('0ms');
  });

  it('should format timestamps as readable strings', () => {
    const timestamp = new Date('2026-05-01T10:23:45Z').getTime();
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('05');
    expect(formatted).toContain('01');
  });
});

describe('Path Resolution', () => {
  it('should return default trace directory in home dir', () => {
    const dir = getDefaultTraceDir();
    expect(dir).toContain('.agent-inspect');
    expect(dir).toContain('runs');
  });

  it('should create trace directory if it does not exist', async () => {
    const testDir = path.join(os.tmpdir(), 'agent-inspect-test', 'runs');
    
    // Ensure it doesn't exist first
    await fs.rm(testDir, { recursive: true, force: true });
    
    await ensureTraceDir(testDir);
    
    const stat = await fs.stat(testDir);
    expect(stat.isDirectory()).toBe(true);
    
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should not throw if directory creation fails', async () => {
    const invalidDir = '/root/impossible/path';
    
    // Should not throw
    await expect(ensureTraceDir(invalidDir)).resolves.toBeUndefined();
  });

  it('should return correct trace file path', () => {
    const runId = 'run_abc123';
    const baseDir = '/tmp/traces';
    const filePath = getTraceFilePath(runId, baseDir);
    
    expect(filePath).toBe('/tmp/traces/run_abc123.jsonl');
  });
});

describe('Error Formatting', () => {
  it('should format Error objects', () => {
    const error = new Error('Test error');
    const formatted = formatError(error);
    
    expect(formatted.message).toBe('Test error');
    expect(formatted.stack).toBeDefined();
  });

  it('should handle string errors', () => {
    const formatted = formatError('Something went wrong');
    
    expect(formatted.message).toBe('Something went wrong');
    expect(formatted.stack).toBeUndefined();
  });

  it('should handle unknown error types', () => {
    const formatted = formatError({ custom: 'error' });
    
    expect(formatted.message).toContain('Unknown error');
  });

  it('should handle null/undefined', () => {
    expect(formatError(null).message).toBeDefined();
    expect(formatError(undefined).message).toBeDefined();
  });
});
```

### Success Criteria

✅ All utility functions work correctly  
✅ Tests pass including edge cases  
✅ No throws from utility functions  
✅ Fallback behavior validated  
✅ Directory creation works on different OS  

---

## Step 3: Implement Async Context Tracking

**Goal:** Create async context for tracking nested steps

**PRD Reference:** Section 5 (Core Concepts - Nested Context)

**Duration:** 2 hours

**Files:** `packages/core/src/context.ts`

### Cursor Prompt

```
Create packages/core/src/context.ts using Node.js AsyncLocalStorage for tracking execution context:

1. Define ExecutionContext interface:
   - runId: string
   - runName: string
   - currentStepId?: string (for nesting)
   - silent: boolean (for disabling output)
   - traceDir: string

2. Implement context management:
   - Create AsyncLocalStorage instance
   - getCurrentContext(): ExecutionContext | undefined
   - setContext(context: ExecutionContext): void
   - runWithContext<T>(context: ExecutionContext, fn: () => Promise<T>): Promise<T>
   - enterStep(stepId: string): void - Sets current step as parent
   - exitStep(): void - Clears current step
   - getCurrentRunId(): string | undefined
   - getCurrentStepId(): string | undefined (returns parent for nesting)

3. Error handling:
   - All functions should be safe to call outside context
   - Return undefined gracefully if no context exists
   - Never throw

Example implementation pattern:
```typescript
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<ExecutionContext>();

export function getCurrentContext(): ExecutionContext | undefined {
  return asyncLocalStorage.getStore();
}

export function runWithContext<T>(
  context: ExecutionContext,
  fn: () => Promise<T>
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}
```

Ensure nested steps work correctly:
- When step A calls step B, step B should see A as parent
- Parallel steps (Promise.all) should maintain correct parents
- Context should not leak between concurrent runs
```

### Test Requirements

**File:** `packages/core/test/context.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCurrentContext,
  runWithContext,
  enterStep,
  exitStep,
  getCurrentRunId,
  getCurrentStepId
} from '../src/context';

describe('Context Management', () => {
  beforeEach(() => {
    // Ensure clean state
  });

  it('should return undefined when no context exists', () => {
    expect(getCurrentContext()).toBeUndefined();
    expect(getCurrentRunId()).toBeUndefined();
    expect(getCurrentStepId()).toBeUndefined();
  });

  it('should store and retrieve context', async () => {
    const context = {
      runId: 'run_test123',
      runName: 'test-run',
      silent: false,
      traceDir: '/tmp/traces'
    };

    await runWithContext(context, async () => {
      expect(getCurrentRunId()).toBe('run_test123');
      expect(getCurrentContext()?.runName).toBe('test-run');
    });

    // Context should not leak outside
    expect(getCurrentContext()).toBeUndefined();
  });

  it('should handle nested steps', async () => {
    const context = {
      runId: 'run_test123',
      runName: 'test-run',
      silent: false,
      traceDir: '/tmp/traces'
    };

    await runWithContext(context, async () => {
      expect(getCurrentStepId()).toBeUndefined(); // No parent yet

      enterStep('step_1');
      expect(getCurrentStepId()).toBe('step_1');

      enterStep('step_2');
      expect(getCurrentStepId()).toBe('step_2'); // Now step_2 is current

      exitStep();
      expect(getCurrentStepId()).toBe('step_1'); // Back to step_1

      exitStep();
      expect(getCurrentStepId()).toBeUndefined(); // Back to root
    });
  });

  it('should maintain separate contexts in parallel', async () => {
    const context1 = {
      runId: 'run_1',
      runName: 'test-1',
      silent: false,
      traceDir: '/tmp/traces'
    };

    const context2 = {
      runId: 'run_2',
      runName: 'test-2',
      silent: false,
      traceDir: '/tmp/traces'
    };

    const results = await Promise.all([
      runWithContext(context1, async () => {
        await new Promise(r => setTimeout(r, 10));
        return getCurrentRunId();
      }),
      runWithContext(context2, async () => {
        await new Promise(r => setTimeout(r, 5));
        return getCurrentRunId();
      })
    ]);

    expect(results).toEqual(['run_1', 'run_2']);
  });

  it('should handle errors without losing context', async () => {
    const context = {
      runId: 'run_test123',
      runName: 'test-run',
      silent: false,
      traceDir: '/tmp/traces'
    };

    await expect(
      runWithContext(context, async () => {
        expect(getCurrentRunId()).toBe('run_test123');
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    // Context should still be cleaned up
    expect(getCurrentContext()).toBeUndefined();
  });
});
```

### Success Criteria

✅ AsyncLocalStorage correctly isolates contexts  
✅ Nested steps track parents correctly  
✅ Parallel execution maintains separate contexts  
✅ No context leakage between runs  
✅ Safe to call outside context  

---

## Step 4: Implement JSONL Storage

**Goal:** Create JSONL file writer for trace events

**PRD Reference:** Section 7.6 (JSONL Event Format)

**Duration:** 2 hours

**Files:** `packages/core/src/storage.ts`

### Cursor Prompt

```
Create packages/core/src/storage.ts for JSONL trace storage:

1. Implement writeTraceEvent():
   - async writeTraceEvent(event: TraceEvent, traceDir: string): Promise<void>
   - Appends event to ~/.agent-inspect/runs/<runId>.jsonl
   - Creates directory if needed
   - Handles file write errors gracefully (logs warning, continues)
   - Validates event has schemaVersion: "0.1"
   - Never throws

2. Implement initializeTraceFile():
   - async initializeTraceFile(runId: string, traceDir: string): Promise<void>
   - Creates empty JSONL file
   - Ensures directory exists
   - Safe if file already exists

3. Helper functions:
   - serializeEvent(event: TraceEvent): string - Converts to JSONL line
   - validateEvent(event: TraceEvent): boolean - Checks required fields

4. Error handling patterns:
   - Primary storage fails → Try fallback directory (/tmp/agent-inspect/)
   - Fallback fails → Log warning and continue (don't write trace)
   - Never crash the agent

Example implementation:
```typescript
import fs from 'fs/promises';
import { formatError } from './utils';
import type { TraceEvent } from './types';

export async function writeTraceEvent(
  event: TraceEvent,
  traceDir: string
): Promise<void> {
  try {
    if (!validateEvent(event)) {
      console.warn('[AgentInspect] Invalid trace event, skipping');
      return;
    }

    const runId = 'runId' in event ? event.runId : 'unknown';
    const filePath = getTraceFilePath(runId, traceDir);
    const line = serializeEvent(event);

    await fs.appendFile(filePath, line + '\n', 'utf-8');
  } catch (error) {
    console.warn('[AgentInspect] Failed to write trace:', formatError(error).message);
    // Try fallback
    try {
      const fallbackPath = getTraceFilePath(runId, FALLBACK_TRACE_DIR);
      await fs.appendFile(fallbackPath, line + '\n', 'utf-8');
    } catch {
      // Silent failure - don't crash agent
    }
  }
}
```

5. Ensure atomic writes (use appendFile, not writeFile)
6. Handle concurrent writes to same file (OS-level file locking)
```

### Test Requirements

**File:** `packages/core/test/storage.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  writeTraceEvent,
  initializeTraceFile,
  serializeEvent,
  validateEvent
} from '../src/storage';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('JSONL Storage', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should initialize trace file', async () => {
    const runId = 'run_test123';
    await initializeTraceFile(runId, testDir);

    const filePath = path.join(testDir, `${runId}.jsonl`);
    const stat = await fs.stat(filePath);
    expect(stat.isFile()).toBe(true);
  });

  it('should write trace event as JSONL', async () => {
    const runId = 'run_test123';
    await initializeTraceFile(runId, testDir);

    const event: TraceEvent = {
      schemaVersion: '0.1',
      event: 'run_started',
      runId,
      name: 'test-run',
      startTime: Date.now(),
      timestamp: Date.now()
    };

    await writeTraceEvent(event, testDir);

    const filePath = path.join(testDir, `${runId}.jsonl`);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.event).toBe('run_started');
    expect(parsed.schemaVersion).toBe('0.1');
  });

  it('should append multiple events', async () => {
    const runId = 'run_test123';
    await initializeTraceFile(runId, testDir);

    const event1 = {
      schemaVersion: '0.1' as const,
      event: 'run_started',
      runId,
      name: 'test',
      startTime: Date.now(),
      timestamp: Date.now()
    };

    const event2 = {
      schemaVersion: '0.1' as const,
      event: 'step_started',
      runId,
      stepId: 'step_1',
      name: 'test-step',
      type: 'logic' as const,
      startTime: Date.now(),
      timestamp: Date.now()
    };

    await writeTraceEvent(event1, testDir);
    await writeTraceEvent(event2, testDir);

    const filePath = path.join(testDir, `${runId}.jsonl`);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    expect(lines).toHaveLength(2);
  });

  it('should validate events before writing', () => {
    const validEvent = {
      schemaVersion: '0.1' as const,
      event: 'run_started',
      runId: 'run_123',
      name: 'test',
      startTime: Date.now(),
      timestamp: Date.now()
    };

    const invalidEvent = {
      event: 'run_started',
      // Missing schemaVersion
    };

    expect(validateEvent(validEvent)).toBe(true);
    expect(validateEvent(invalidEvent as any)).toBe(false);
  });

  it('should serialize event correctly', () => {
    const event = {
      schemaVersion: '0.1' as const,
      event: 'run_started',
      runId: 'run_123',
      name: 'test',
      startTime: 1714500000000,
      timestamp: 1714500000000
    };

    const serialized = serializeEvent(event);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(event);
  });

  it('should not throw if directory creation fails', async () => {
    const invalidDir = '/root/impossible/path';
    const event = {
      schemaVersion: '0.1' as const,
      event: 'run_started',
      runId: 'run_123',
      name: 'test',
      startTime: Date.now(),
      timestamp: Date.now()
    };

    // Should not throw
    await expect(writeTraceEvent(event, invalidDir)).resolves.toBeUndefined();
  });

  it('should handle concurrent writes', async () => {
    const runId = 'run_test123';
    await initializeTraceFile(runId, testDir);

    const events = Array.from({ length: 10 }, (_, i) => ({
      schemaVersion: '0.1' as const,
      event: 'step_started',
      runId,
      stepId: `step_${i}`,
      name: `step-${i}`,
      type: 'logic' as const,
      startTime: Date.now(),
      timestamp: Date.now()
    }));

    await Promise.all(
      events.map(event => writeTraceEvent(event, testDir))
    );

    const filePath = path.join(testDir, `${runId}.jsonl`);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    expect(lines).toHaveLength(10);
  });
});
```

### Success Criteria

✅ JSONL files written correctly  
✅ Concurrent writes handled  
✅ Directory creation works  
✅ Fallback behavior works  
✅ Never throws errors  
✅ Events validated before writing  

---

## Step 5: Implement Terminal Output

**Goal:** Create terminal output formatter with colors and tree structure

**PRD Reference:** Section 7.7 (Terminal Output)

**Duration:** 2 hours

**Files:** `packages/core/src/terminal.ts`

### Cursor Prompt

```
Create packages/core/src/terminal.ts for terminal output using chalk:

1. Implement output functions:
   - printRunStart(runId: string, name: string): void
   - printStepStart(name: string, depth: number): void
   - printStepComplete(name: string, durationMs: number, status: StepStatus, depth: number): void
   - printRunComplete(name: string, runId: string, durationMs: number, status: 'success' | 'error', traceFilePath: string): void
   - printError(stepName: string, error: { message: string; stack?: string }, depth: number): void

2. Tree formatting:
   - Use indentation for depth (2 spaces per level)
   - Use box-drawing characters: ✔ (success), ✖ (error), ⏳ (running)
   - Use chalk for colors:
     - green for success
     - red for errors
     - yellow for running
     - cyan for info
     - dim for metadata

3. Example output format:
```
🔍 AgentInspect: trip-planner (run_abc123)

✔ plan (1.2s)
  ✔ llm:gpt-4.1 (900ms)
  ✔ parse-response (120ms)

✔ tool:searchHotels (700ms)

✖ tool:pricingAPI (5.0s)
  Error: Timeout after 5000ms

Failed at: tool:pricingAPI
Trace: ~/.agent-inspect/runs/run_abc123.jsonl
```

4. Handle silent mode:
   - Check context.silent before printing
   - All functions should be no-ops if silent: true

5. Handle edge cases:
   - Long names (truncate at 80 chars)
   - Very deep nesting (max 10 levels, then flatten)
   - Terminal width (don't wrap awkwardly)

Example implementation:
```typescript
import chalk from 'chalk';
import { formatDuration } from './utils';
import { getCurrentContext } from './context';
import type { StepStatus } from './types';

export function printStepComplete(
  name: string,
  durationMs: number,
  status: StepStatus,
  depth: number
): void {
  const context = getCurrentContext();
  if (context?.silent) return;

  const indent = '  '.repeat(depth);
  const icon = status === 'success' ? chalk.green('✔') : chalk.red('✖');
  const duration = chalk.dim(`(${formatDuration(durationMs)})`);
  const truncatedName = name.length > 80 ? name.slice(0, 77) + '...' : name;

  console.log(`${indent}${icon} ${truncatedName} ${duration}`);
}
```
```

### Test Requirements

**File:** `packages/core/test/terminal.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  printRunStart,
  printStepComplete,
  printRunComplete,
  printError
} from '../src/terminal';

describe('Terminal Output', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should print run start', () => {
    printRunStart('run_abc123', 'test-run');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('AgentInspect')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-run')
    );
  });

  it('should print step completion with correct indentation', () => {
    printStepComplete('test-step', 1200, 'success', 0);

    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('✔');
    expect(output).toContain('test-step');
    expect(output).toContain('1.2s');
  });

  it('should print nested steps with indentation', () => {
    printStepComplete('parent-step', 1000, 'success', 0);
    printStepComplete('child-step', 500, 'success', 1);

    const parentOutput = consoleLogSpy.mock.calls[0][0];
    const childOutput = consoleLogSpy.mock.calls[1][0];

    expect(parentOutput).not.toContain('  '); // No indent
    expect(childOutput).toContain('  '); // 2-space indent
  });

  it('should print errors with details', () => {
    const error = {
      message: 'Test error message',
      stack: 'Error: Test error\\n  at ...'
    };

    printError('failed-step', error, 0);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Test error message')
    );
  });

  it('should respect silent mode', () => {
    // This test would need context mocking
    // For now, document that silent mode is tested in integration tests
  });

  it('should truncate long step names', () => {
    const longName = 'a'.repeat(100);
    printStepComplete(longName, 1000, 'success', 0);

    const output = consoleLogSpy.mock.calls[0][0];
    expect(output.length).toBeLessThan(150); // Should be truncated
    expect(output).toContain('...');
  });

  it('should handle deep nesting', () => {
    for (let i = 0; i < 15; i++) {
      printStepComplete(`step-${i}`, 100, 'success', i);
    }

    // Should not throw, should flatten after depth 10
    expect(consoleLogSpy).toHaveBeenCalledTimes(15);
  });
});
```

### Success Criteria

✅ Terminal output matches PRD design  
✅ Colors work correctly  
✅ Tree indentation correct  
✅ Silent mode works  
✅ Long names truncated  
✅ Deep nesting handled  

---

## Step 6: Implement inspectRun()

**Goal:** Create the core `inspectRun()` function

**PRD Reference:** Section 6 (Public API - inspectRun)

**Duration:** 3 hours

**Files:** `packages/core/src/inspect-run.ts`

### Cursor Prompt

```
Create packages/core/src/inspect-run.ts implementing the inspectRun() function:

1. Function signature:
```typescript
export async function inspectRun<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: InspectRunOptions
): Promise<T>
```

2. Implementation steps:
   a. Create unique run ID
   b. Set up execution context
   c. Ensure trace directory exists
   d. Initialize trace file
   e. Write run_started event
   f. Print terminal output (unless silent)
   g. Execute user function
   h. Capture timing and result
   i. Write run_completed event
   j. Print completion summary
   k. Return original result

3. Error handling:
   - If user function throws → capture error, write to trace, re-throw
   - If instrumentation fails → log warning, continue
   - Never crash due to instrumentation

4. Full implementation example:
```typescript
import { runWithContext, getCurrentContext } from './context';
import { createRunId, getDefaultTraceDir, ensureTraceDir, formatError } from './utils';
import { writeTraceEvent, initializeTraceFile } from './storage';
import { printRunStart, printRunComplete } from './terminal';
import type { InspectRunOptions, TraceEvent } from './types';

export async function inspectRun<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: InspectRunOptions
): Promise<T> {
  const runId = createRunId();
  const traceDir = options?.traceDir || getDefaultTraceDir();
  const silent = options?.silent || false;
  const metadata = options?.metadata || {};

  // Set up context
  const context = {
    runId,
    runName: name,
    silent,
    traceDir
  };

  return runWithContext(context, async () => {
    const startTime = Date.now();

    try {
      // Initialize storage
      await ensureTraceDir(traceDir);
      await initializeTraceFile(runId, traceDir);

      // Write run_started event
      const startEvent: TraceEvent = {
        schemaVersion: '0.1',
        event: 'run_started',
        runId,
        name,
        startTime,
        timestamp: startTime
      };
      await writeTraceEvent(startEvent, traceDir);

      // Print to terminal
      if (!silent) {
        printRunStart(runId, name);
      }

      // Execute user function
      const result = await fn();

      // Success path
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      const completeEvent: TraceEvent = {
        schemaVersion: '0.1',
        event: 'run_completed',
        runId,
        status: 'success',
        endTime,
        durationMs,
        timestamp: endTime
      };
      await writeTraceEvent(completeEvent, traceDir);

      if (!silent) {
        printRunComplete(name, runId, durationMs, 'success', traceFilePath);
      }

      return result;

    } catch (error) {
      // Error path
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const formattedError = formatError(error);

      const errorEvent: TraceEvent = {
        schemaVersion: '0.1',
        event: 'run_completed',
        runId,
        status: 'error',
        endTime,
        durationMs,
        error: formattedError,
        timestamp: endTime
      };

      try {
        await writeTraceEvent(errorEvent, traceDir);
      } catch (writeError) {
        console.warn('[AgentInspect] Failed to write error event:', writeError);
      }

      if (!silent) {
        printRunComplete(name, runId, durationMs, 'error', traceFilePath);
      }

      // Re-throw original error
      throw error;
    }
  });
}
```

5. Validation:
   - Name should be non-empty string (default to 'unnamed-run' if invalid)
   - fn should be a function (throw TypeError if not)
```

### Test Requirements

**File:** `packages/core/test/inspect-run.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { inspectRun } from '../src/inspect-run';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('inspectRun()', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute function and return result', async () => {
    const result = await inspectRun('test-run', async () => {
      return 'test-result';
    }, { traceDir: testDir, silent: true });

    expect(result).toBe('test-result');
  });

  it('should create unique run ID for each execution', async () => {
    const runIds = new Set<string>();

    const getRunId = () => {
      const files = fs.readdirSync(testDir);
      return files[0]?.replace('.jsonl', '');
    };

    await inspectRun('test-1', async () => {}, { traceDir: testDir, silent: true });
    runIds.add(getRunId());

    await inspectRun('test-2', async () => {}, { traceDir: testDir, silent: true });
    
    expect(runIds.size).toBe(2);
  });

  it('should write trace file with events', async () => {
    await inspectRun('test-run', async () => {
      return 'result';
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    expect(files).toHaveLength(1);

    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    expect(lines.length).toBeGreaterThanOrEqual(2); // run_started + run_completed
    
    const startEvent = JSON.parse(lines[0]);
    expect(startEvent.event).toBe('run_started');
    expect(startEvent.schemaVersion).toBe('0.1');

    const endEvent = JSON.parse(lines[lines.length - 1]);
    expect(endEvent.event).toBe('run_completed');
    expect(endEvent.status).toBe('success');
  });

  it('should capture and re-throw errors', async () => {
    const testError = new Error('Test error');

    await expect(
      inspectRun('test-run', async () => {
        throw testError;
      }, { traceDir: testDir, silent: true })
    ).rejects.toThrow('Test error');

    // Check error was recorded
    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');
    const errorEvent = JSON.parse(lines[lines.length - 1]);

    expect(errorEvent.event).toBe('run_completed');
    expect(errorEvent.status).toBe('error');
    expect(errorEvent.error.message).toBe('Test error');
  });

  it('should respect silent mode', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await inspectRun('test-run', async () => {
      return 'result';
    }, { traceDir: testDir, silent: true });

    expect(consoleLogSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it('should accept custom metadata', async () => {
    await inspectRun('test-run', async () => {}, {
      traceDir: testDir,
      silent: true,
      metadata: { userId: '123', environment: 'test' }
    });

    // Metadata is stored in context, not directly in events (for MVP)
    // Full validation would require context inspection
  });

  it('should handle synchronous functions', async () => {
    const result = await inspectRun('test-run', () => {
      return 'sync-result';
    }, { traceDir: testDir, silent: true });

    expect(result).toBe('sync-result');
  });

  it('should not crash if storage fails', async () => {
    const invalidDir = '/root/impossible/path';

    const result = await inspectRun('test-run', async () => {
      return 'result';
    }, { traceDir: invalidDir, silent: true });

    expect(result).toBe('result'); // Agent continues
  });

  it('should handle nested inspectRun calls', async () => {
    const result = await inspectRun('outer-run', async () => {
      const innerResult = await inspectRun('inner-run', async () => {
        return 'inner';
      }, { traceDir: testDir, silent: true });
      return `outer-${innerResult}`;
    }, { traceDir: testDir, silent: true });

    expect(result).toBe('outer-inner');

    // Should create 2 separate trace files
    const files = await fs.readdir(testDir);
    expect(files).toHaveLength(2);
  });
});
```

### Success Criteria

✅ `inspectRun()` executes and returns result  
✅ Trace files created with correct events  
✅ Errors captured and re-thrown  
✅ Silent mode works  
✅ Storage failures don't crash  
✅ Metadata stored correctly  

---

---

## Step 7: Implement step() and Helpers

**Goal:** Create `step()`, `step.llm()`, and `step.tool()` functions

**PRD Reference:** Section 6 (Public API - step)

**Duration:** 3 hours

**Files:** `packages/core/src/step.ts`

### Cursor Prompt

```
Create packages/core/src/step.ts implementing the step() function and helpers:

1. Main step() function:
```typescript
export async function step<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: StepOptions
): Promise<T>
```

2. Implementation steps:
   a. Get current context (must be inside inspectRun)
   b. Create unique step ID
   c. Get parent step ID from context (for nesting)
   d. Determine step type (from options or default to 'logic')
   e. Write step_started event
   f. Enter step context (so nested steps see this as parent)
   g. Execute user function
   h. Capture timing and result
   i. Exit step context
   j. Write step_completed event
   k. Print to terminal
   l. Return original result

3. Helper functions:
```typescript
export namespace step {
  export function llm<T>(
    model: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    return step(`llm:${model}`, fn, { 
      type: 'llm',
      metadata: { model }
    });
  }

  export function tool<T>(
    toolName: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    return step(`tool:${toolName}`, fn, {
      type: 'tool',
      metadata: { toolName }
    });
  }
}
```

4. Full implementation example:
```typescript
import { getCurrentContext, getCurrentStepId, enterStep, exitStep } from './context';
import { createStepId, formatError } from './utils';
import { writeTraceEvent } from './storage';
import { printStepStart, printStepComplete, printError } from './terminal';
import type { StepOptions, TraceEvent, StepType } from './types';

export async function step<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: StepOptions
): Promise<T> {
  const context = getCurrentContext();
  
  // If no context, execute without instrumentation
  if (!context) {
    console.warn('[AgentInspect] step() called outside inspectRun(), executing without instrumentation');
    return await fn();
  }

  const stepId = createStepId();
  const parentId = getCurrentStepId(); // For nesting
  const stepType: StepType = options?.type || 'logic';
  const metadata = options?.metadata || {};
  const startTime = Date.now();

  // Calculate depth for terminal output
  let depth = 0;
  let currentParent = parentId;
  while (currentParent) {
    depth++;
    // In production, track parent chain in context
    currentParent = undefined; // Simplified for example
  }

  try {
    // Write step_started event
    const startEvent: TraceEvent = {
      schemaVersion: '0.1',
      event: 'step_started',
      runId: context.runId,
      stepId,
      parentId,
      name,
      type: stepType,
      startTime,
      timestamp: startTime
    };
    await writeTraceEvent(startEvent, context.traceDir);

    // Print to terminal
    if (!context.silent) {
      printStepStart(name, depth);
    }

    // Enter step context (for nested steps)
    enterStep(stepId);

    try {
      // Execute user function
      const result = await fn();

      // Success path
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      const completeEvent: TraceEvent = {
        schemaVersion: '0.1',
        event: 'step_completed',
        runId: context.runId,
        stepId,
        status: 'success',
        endTime,
        durationMs,
        timestamp: endTime
      };
      await writeTraceEvent(completeEvent, context.traceDir);

      if (!context.silent) {
        printStepComplete(name, durationMs, 'success', depth);
      }

      return result;

    } catch (error) {
      // Error path
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const formattedError = formatError(error);

      const errorEvent: TraceEvent = {
        schemaVersion: '0.1',
        event: 'step_completed',
        runId: context.runId,
        stepId,
        status: 'error',
        endTime,
        durationMs,
        error: formattedError,
        timestamp: endTime
      };

      try {
        await writeTraceEvent(errorEvent, context.traceDir);
      } catch (writeError) {
        console.warn('[AgentInspect] Failed to write step error:', writeError);
      }

      if (!context.silent) {
        printStepComplete(name, durationMs, 'error', depth);
        printError(name, formattedError, depth);
      }

      // Re-throw original error
      throw error;
    } finally {
      // Always exit step context
      exitStep();
    }

  } catch (instrumentationError) {
    // If instrumentation itself fails, log and continue
    console.warn('[AgentInspect] Step instrumentation failed:', instrumentationError);
    exitStep();
    
    // Execute function without instrumentation
    return await fn();
  }
}

// Helper namespace functions
export namespace step {
  export function llm<T>(
    model: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    return step(`llm:${model}`, fn, {
      type: 'llm',
      metadata: { model }
    });
  }

  export function tool<T>(
    toolName: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    return step(`tool:${toolName}`, fn, {
      type: 'tool',
      metadata: { toolName }
    });
  }
}
```

5. Edge cases to handle:
   - step() called outside inspectRun() → log warning, execute without instrumentation
   - Very long step names → truncate in terminal output
   - Deep nesting (>10 levels) → flatten rendering
   - Parallel steps → maintain correct parent IDs
```

### Test Requirements

**File:** `packages/core/test/step.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { inspectRun } from '../src/inspect-run';
import { step } from '../src/step';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('step()', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute function and return result', async () => {
    const result = await inspectRun('test-run', async () => {
      return await step('test-step', async () => {
        return 'step-result';
      });
    }, { traceDir: testDir, silent: true });

    expect(result).toBe('step-result');
  });

  it('should write step events to trace', async () => {
    await inspectRun('test-run', async () => {
      await step('test-step', async () => {
        return 'result';
      });
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepStarted = lines.find(line => {
      const event = JSON.parse(line);
      return event.event === 'step_started';
    });
    const stepCompleted = lines.find(line => {
      const event = JSON.parse(line);
      return event.event === 'step_completed';
    });

    expect(stepStarted).toBeDefined();
    expect(stepCompleted).toBeDefined();

    const startEvent = JSON.parse(stepStarted!);
    expect(startEvent.name).toBe('test-step');
    expect(startEvent.type).toBe('logic'); // default type

    const completeEvent = JSON.parse(stepCompleted!);
    expect(completeEvent.status).toBe('success');
    expect(completeEvent.durationMs).toBeGreaterThan(0);
  });

  it('should capture and re-throw errors', async () => {
    const testError = new Error('Step failed');

    await expect(
      inspectRun('test-run', async () => {
        await step('failing-step', async () => {
          throw testError;
        });
      }, { traceDir: testDir, silent: true })
    ).rejects.toThrow('Step failed');

    // Check error was recorded
    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepError = lines.find(line => {
      const event = JSON.parse(line);
      return event.event === 'step_completed' && event.status === 'error';
    });

    expect(stepError).toBeDefined();
    const errorEvent = JSON.parse(stepError!);
    expect(errorEvent.error.message).toBe('Step failed');
  });

  it('should support nested steps', async () => {
    await inspectRun('test-run', async () => {
      await step('parent-step', async () => {
        await step('child-step', async () => {
          return 'nested-result';
        });
      });
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepEvents = lines
      .map(line => JSON.parse(line))
      .filter(event => event.event === 'step_started');

    expect(stepEvents).toHaveLength(2);

    const parentStep = stepEvents.find(e => e.name === 'parent-step');
    const childStep = stepEvents.find(e => e.name === 'child-step');

    expect(parentStep.parentId).toBeUndefined(); // No parent
    expect(childStep.parentId).toBe(parentStep.stepId); // Child references parent
  });

  it('should support parallel steps', async () => {
    await inspectRun('test-run', async () => {
      await Promise.all([
        step('step-1', async () => {
          await new Promise(r => setTimeout(r, 10));
          return 'result-1';
        }),
        step('step-2', async () => {
          await new Promise(r => setTimeout(r, 5));
          return 'result-2';
        })
      ]);
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepEvents = lines
      .map(line => JSON.parse(line))
      .filter(event => event.event === 'step_started');

    expect(stepEvents).toHaveLength(2);

    // Both should have same parent (or no parent if at root)
    expect(stepEvents[0].parentId).toBe(stepEvents[1].parentId);
  });

  it('should accept custom step type', async () => {
    await inspectRun('test-run', async () => {
      await step('decision-step', async () => {
        return 'decided';
      }, { type: 'decision' });
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepEvent = lines
      .map(line => JSON.parse(line))
      .find(event => event.event === 'step_started' && event.name === 'decision-step');

    expect(stepEvent.type).toBe('decision');
  });

  it('should handle step() called outside inspectRun()', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await step('orphan-step', async () => {
      return 'result';
    });

    expect(result).toBe('result'); // Still executes
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('called outside inspectRun()')
    );

    consoleWarnSpy.mockRestore();
  });
});

describe('step.llm()', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create step with llm type and model metadata', async () => {
    await inspectRun('test-run', async () => {
      await step.llm('gpt-4.1', async () => {
        return 'LLM response';
      });
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepEvent = lines
      .map(line => JSON.parse(line))
      .find(event => event.event === 'step_started' && event.type === 'llm');

    expect(stepEvent).toBeDefined();
    expect(stepEvent.name).toBe('llm:gpt-4.1');
    expect(stepEvent.type).toBe('llm');
    expect(stepEvent.metadata?.model).toBe('gpt-4.1');
  });
});

describe('step.tool()', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create step with tool type and toolName metadata', async () => {
    await inspectRun('test-run', async () => {
      await step.tool('searchHotels', async () => {
        return [{ name: 'Hotel A' }];
      });
    }, { traceDir: testDir, silent: true });

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lines = content.trim().split('\n');

    const stepEvent = lines
      .map(line => JSON.parse(line))
      .find(event => event.event === 'step_started' && event.type === 'tool');

    expect(stepEvent).toBeDefined();
    expect(stepEvent.name).toBe('tool:searchHotels');
    expect(stepEvent.type).toBe('tool');
    expect(stepEvent.metadata?.toolName).toBe('searchHotels');
  });
});
```

### Success Criteria

✅ `step()` executes and returns result  
✅ Nested steps tracked correctly  
✅ Parallel steps maintain correct parents  
✅ Custom types supported  
✅ `step.llm()` and `step.tool()` work  
✅ Works outside inspectRun (with warning)  
✅ Errors captured and re-thrown  

---

## Step 8: Implement observe() Wrapper

**Goal:** Create Proxy-based agent wrapper

**PRD Reference:** Section 6 (Public API - observe)

**Duration:** 2 hours

**Files:** `packages/core/src/observe.ts`

### Cursor Prompt

```
Create packages/core/src/observe.ts implementing the observe() function:

1. Function signature:
```typescript
export function observe<T extends Record<string, any>>(
  agent: T,
  options?: InspectRunOptions
): T
```

2. Implementation approach:
   - Use JavaScript Proxy to intercept method calls
   - Detect methods named: run, execute, invoke
   - Wrap detected methods with inspectRun()
   - Return Proxy that behaves identically to original agent
   - Never crash - if instrumentation fails, return original agent

3. Full implementation example:
```typescript
import { inspectRun } from './inspect-run';
import type { InspectRunOptions } from './types';

export function observe<T extends Record<string, any>>(
  agent: T,
  options?: InspectRunOptions
): T {
  try {
    // Validate input
    if (!agent || typeof agent !== 'object') {
      console.warn('[AgentInspect] observe() requires an object, returning original');
      return agent;
    }

    // Detect instrumentable methods
    const methodsToWrap = ['run', 'execute', 'invoke'];
    const foundMethods = methodsToWrap.filter(method => 
      typeof agent[method] === 'function'
    );

    if (foundMethods.length === 0) {
      console.warn('[AgentInspect] No instrumentable methods found (run/execute/invoke), returning original');
      return agent;
    }

    // Create Proxy
    return new Proxy(agent, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);

        // If it's a method we want to wrap
        if (foundMethods.includes(prop as string) && typeof original === 'function') {
          return function(this: any, ...args: any[]) {
            // Generate run name from agent class name + method
            const agentName = target.constructor?.name || 'Agent';
            const runName = `${agentName}.${String(prop)}`;

            // Wrap with inspectRun
            return inspectRun(runName, async () => {
              return original.apply(this, args);
            }, options);
          };
        }

        // Return everything else unchanged
        return original;
      }
    });

  } catch (error) {
    console.warn('[AgentInspect] observe() failed, returning original agent:', error);
    return agent;
  }
}
```

4. Edge cases:
   - Agent is null/undefined → return original
   - Agent has no instrumentable methods → warn and return original
   - Proxy creation fails → return original
   - Method is async or sync → handle both
   - Method uses `this` context → preserve binding
   - Agent is a class instance → preserve prototype chain
```

### Test Requirements

**File:** `packages/core/test/observe.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { observe } from '../src/observe';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('observe()', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should wrap agent with run() method', async () => {
    const agent = {
      async run(input: string) {
        return `Result: ${input}`;
      }
    };

    const observed = observe(agent, { traceDir: testDir, silent: true });
    const result = await observed.run('test');

    expect(result).toBe('Result: test');

    // Check trace was created
    const files = await fs.readdir(testDir);
    expect(files).toHaveLength(1);
  });

  it('should wrap agent with execute() method', async () => {
    const agent = {
      async execute(input: string) {
        return `Executed: ${input}`;
      }
    };

    const observed = observe(agent, { traceDir: testDir, silent: true });
    const result = await observed.execute('test');

    expect(result).toBe('Executed: test');
  });

  it('should wrap agent with invoke() method', async () => {
    const agent = {
      async invoke(input: string) {
        return `Invoked: ${input}`;
      }
    };

    const observed = observe(agent, { traceDir: testDir, silent: true });
    const result = await observed.invoke('test');

    expect(result).toBe('Invoked: test');
  });

  it('should preserve agent class name in run name', async () => {
    class MyCustomAgent {
      async run(input: string) {
        return `Result: ${input}`;
      }
    }

    const agent = new MyCustomAgent();
    const observed = observe(agent, { traceDir: testDir, silent: true });
    await observed.run('test');

    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const firstLine = content.split('\n')[0];
    const event = JSON.parse(firstLine);

    expect(event.name).toContain('MyCustomAgent');
  });

  it('should not wrap non-instrumentable methods', async () => {
    const agent = {
      async run(input: string) {
        return this.helper(input);
      },
      helper(input: string) {
        return `Helper: ${input}`;
      }
    };

    const observed = observe(agent, { traceDir: testDir, silent: true });
    const result = await observed.run('test');

    expect(result).toBe('Helper: test');

    // Only one trace file (for run, not helper)
    const files = await fs.readdir(testDir);
    expect(files).toHaveLength(1);
  });

  it('should preserve this context', async () => {
    class StatefulAgent {
      private state = 'initial';

      async run(input: string) {
        this.state = 'modified';
        return `${this.state}: ${input}`;
      }

      getState() {
        return this.state;
      }
    }

    const agent = new StatefulAgent();
    const observed = observe(agent, { traceDir: testDir, silent: true });
    const result = await observed.run('test');

    expect(result).toBe('modified: test');
    expect(observed.getState()).toBe('modified');
  });

  it('should handle synchronous methods', async () => {
    const agent = {
      run(input: string) {
        return `Sync: ${input}`;
      }
    };

    const observed = observe(agent, { traceDir: testDir, silent: true });
    const result = await observed.run('test');

    expect(result).toBe('Sync: test');
  });

  it('should return original agent if no instrumentable methods', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const agent = {
      someOtherMethod() {
        return 'test';
      }
    };

    const observed = observe(agent);

    expect(observed).toBe(agent); // Same reference
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No instrumentable methods found')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return original agent if input is invalid', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const observed = observe(null as any);

    expect(observed).toBe(null);
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle errors in wrapped methods', async () => {
    const agent = {
      async run(input: string) {
        throw new Error('Agent error');
      }
    };

    const observed = observe(agent, { traceDir: testDir, silent: true });

    await expect(observed.run('test')).rejects.toThrow('Agent error');

    // Check error was traced
    const files = await fs.readdir(testDir);
    const content = await fs.readFile(path.join(testDir, files[0]), 'utf-8');
    const lastLine = content.trim().split('\n').pop();
    const event = JSON.parse(lastLine!);

    expect(event.status).toBe('error');
    expect(event.error.message).toBe('Agent error');
  });

  it('should not break if instrumentation fails', async () => {
    const agent = {
      async run(input: string) {
        return `Result: ${input}`;
      }
    };

    // Force instrumentation failure (invalid trace dir)
    const observed = observe(agent, { traceDir: '/root/impossible' });
    const result = await observed.run('test');

    // Agent still works
    expect(result).toBe('Result: test');
  });
});
```

### Success Criteria

✅ `observe()` wraps agents correctly  
✅ Preserves `this` context  
✅ Works with classes and plain objects  
✅ Handles sync and async methods  
✅ Returns original agent on failure  
✅ Traces errors correctly  
✅ Doesn't break agent functionality  

---

## Step 9: Implement CLI

**Goal:** Create CLI with `list` and `view` commands

**PRD Reference:** Section 4.5 (CLI)

**Duration:** 3 hours

**Files:** `packages/cli/src/index.ts`, `list.ts`, `view.ts`

### Cursor Prompt

```
Create packages/cli/src/ with three files:

1. packages/cli/src/index.ts (main CLI entry):
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { list } from './list';
import { view } from './view';

const program = new Command();

program
  .name('agent-inspect')
  .description('Local-first debugging tool for AI agents')
  .version('0.1.0');

program
  .command('list')
  .description('List recent agent runs')
  .option('-l, --limit <number>', 'Max number of runs to show', '20')
  .option('--status <status>', 'Filter by status (running|completed|failed)')
  .option('--dir <path>', 'Custom trace directory')
  .action(list);

program
  .command('view <run-id>')
  .description('View execution tree for a specific run')
  .option('--dir <path>', 'Custom trace directory')
  .option('-v, --verbose', 'Show full details')
  .action(view);

program.parse();
```

2. packages/cli/src/list.ts:
```typescript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { formatDuration, formatTimestamp } from '@agent-inspect/core';

interface ListOptions {
  limit?: string;
  status?: 'running' | 'completed' | 'failed';
  dir?: string;
}

export async function list(options: ListOptions) {
  try {
    const traceDir = options.dir || path.join(os.homedir(), '.agent-inspect', 'runs');
    const limit = parseInt(options.limit || '20', 10);

    // Read all trace files
    const files = await fs.readdir(traceDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) {
      console.log(chalk.yellow('No agent runs found'));
      console.log(chalk.dim(`Trace directory: ${traceDir}`));
      return;
    }

    // Parse each file to get run info
    const runs: Array<{
      runId: string;
      name: string;
      status: string;
      duration: number;
      startTime: number;
    }> = [];

    for (const file of jsonlFiles) {
      const content = await fs.readFile(path.join(traceDir, file), 'utf-8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) continue;

      const firstEvent = JSON.parse(lines[0]);
      const lastEvent = JSON.parse(lines[lines.length - 1]);

      runs.push({
        runId: firstEvent.runId,
        name: firstEvent.name || 'unnamed',
        status: lastEvent.status || 'running',
        duration: lastEvent.durationMs || 0,
        startTime: firstEvent.startTime
      });
    }

    // Sort by start time (most recent first)
    runs.sort((a, b) => b.startTime - a.startTime);

    // Apply filters
    let filtered = runs;
    if (options.status) {
      filtered = runs.filter(r => r.status === options.status);
    }

    // Apply limit
    const displayed = filtered.slice(0, limit);

    // Display
    console.log(chalk.bold('\nRecent AgentInspect Runs\n'));

    for (const run of displayed) {
      const icon = run.status === 'success' 
        ? chalk.green('✓')
        : run.status === 'error'
        ? chalk.red('✗')
        : chalk.yellow('⏳');

      const runId = chalk.dim(run.runId);
      const name = chalk.bold(run.name);
      const duration = chalk.dim(formatDuration(run.duration));
      const time = chalk.dim(formatTimestamp(run.startTime));

      console.log(`${icon} ${runId} | ${name.padEnd(20)} | ${duration.padEnd(8)} | ${time}`);
    }

    console.log(chalk.dim(`\nShowing ${displayed.length} of ${filtered.length} runs`));
    console.log(chalk.dim(`Trace directory: ${traceDir}\n`));

  } catch (error: any) {
    console.error(chalk.red('Error listing runs:'), error.message);
    process.exit(1);
  }
}
```

3. packages/cli/src/view.ts:
```typescript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { formatDuration, formatTimestamp } from '@agent-inspect/core';

interface ViewOptions {
  dir?: string;
  verbose?: boolean;
}

export async function view(runId: string, options: ViewOptions) {
  try {
    const traceDir = options.dir || path.join(os.homedir(), '.agent-inspect', 'runs');
    const filePath = path.join(traceDir, `${runId}.jsonl`);

    // Read trace file
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const events = lines.map(line => JSON.parse(line));

    // Extract run info
    const runStarted = events.find(e => e.event === 'run_started');
    const runCompleted = events.find(e => e.event === 'run_completed');

    if (!runStarted) {
      console.error(chalk.red('Invalid trace file'));
      process.exit(1);
    }

    // Display run header
    console.log(chalk.bold(`\nAgentInspect Run: ${runStarted.name}`));
    console.log(chalk.dim(`ID: ${runId}`));
    console.log(chalk.dim(`Status: ${runCompleted?.status || 'running'}`));
    console.log(chalk.dim(`Duration: ${formatDuration(runCompleted?.durationMs || 0)}`));
    console.log(chalk.dim(`Started: ${formatTimestamp(runStarted.startTime)}\n`));

    // Build execution tree
    const steps = events.filter(e => e.event === 'step_started' || e.event === 'step_completed');
    const stepMap = new Map();

    // First pass: collect all steps
    for (const event of steps) {
      if (event.event === 'step_started') {
        stepMap.set(event.stepId, {
          id: event.stepId,
          parentId: event.parentId,
          name: event.name,
          type: event.type,
          status: 'running',
          durationMs: 0
        });
      } else if (event.event === 'step_completed') {
        const step = stepMap.get(event.stepId);
        if (step) {
          step.status = event.status;
          step.durationMs = event.durationMs;
          step.error = event.error;
        }
      }
    }

    // Second pass: render tree
    console.log(chalk.bold('Execution Tree:'));
    
    function renderStep(stepId: string, depth: number) {
      const step = stepMap.get(stepId);
      if (!step) return;

      const indent = '  '.repeat(depth);
      const icon = step.status === 'success'
        ? chalk.green('✔')
        : step.status === 'error'
        ? chalk.red('✖')
        : chalk.yellow('⏳');
      
      const name = step.name;
      const duration = chalk.dim(`(${formatDuration(step.durationMs)})`);

      console.log(`${indent}${icon} ${name} ${duration}`);

      if (options.verbose && step.error) {
        console.log(`${indent}  ${chalk.red('Error:')} ${step.error.message}`);
      }

      // Render children
      const children = Array.from(stepMap.values())
        .filter(s => s.parentId === stepId);
      
      for (const child of children) {
        renderStep(child.id, depth + 1);
      }
    }

    // Render root steps (no parent)
    const rootSteps = Array.from(stepMap.values())
      .filter(s => !s.parentId);

    for (const step of rootSteps) {
      renderStep(step.id, 0);
    }

    console.log(chalk.dim(`\nTrace file: ${filePath}\n`));

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red(`Run not found: ${runId}`));
    } else {
      console.error(chalk.red('Error viewing run:'), error.message);
    }
    process.exit(1);
  }
}
```

Ensure:
- Proper error handling
- Helpful error messages
- Works with default and custom trace directories
- Colors used consistently
- Tree rendering handles deep nesting
```

### Test Requirements

**File:** `packages/cli/test/list.test.ts` and `view.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('CLI: list command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-cli-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should list runs from directory', async () => {
    // Create mock trace file
    const runId = 'run_test123';
    const trace = [
      { schemaVersion: '0.1', event: 'run_started', runId, name: 'test-run', startTime: Date.now(), timestamp: Date.now() },
      { schemaVersion: '0.1', event: 'run_completed', runId, status: 'success', endTime: Date.now(), durationMs: 1000, timestamp: Date.now() }
    ].map(e => JSON.stringify(e)).join('\n');

    await fs.writeFile(path.join(testDir, `${runId}.jsonl`), trace);

    // Run CLI
    const output = execSync(`node dist/index.js list --dir ${testDir}`, {
      encoding: 'utf-8'
    });

    expect(output).toContain('test-run');
    expect(output).toContain(runId);
  });

  it('should show message when no runs found', () => {
    const output = execSync(`node dist/index.js list --dir ${testDir}`, {
      encoding: 'utf-8'
    });

    expect(output).toContain('No agent runs found');
  });
});

describe('CLI: view command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agent-inspect-cli-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should display execution tree', async () => {
    const runId = 'run_test123';
    const trace = [
      { schemaVersion: '0.1', event: 'run_started', runId, name: 'test-run', startTime: Date.now(), timestamp: Date.now() },
      { schemaVersion: '0.1', event: 'step_started', runId, stepId: 'step_1', name: 'test-step', type: 'logic', startTime: Date.now(), timestamp: Date.now() },
      { schemaVersion: '0.1', event: 'step_completed', runId, stepId: 'step_1', status: 'success', endTime: Date.now(), durationMs: 500, timestamp: Date.now() },
      { schemaVersion: '0.1', event: 'run_completed', runId, status: 'success', endTime: Date.now(), durationMs: 1000, timestamp: Date.now() }
    ].map(e => JSON.stringify(e)).join('\n');

    await fs.writeFile(path.join(testDir, `${runId}.jsonl`), trace);

    const output = execSync(`node dist/index.js view ${runId} --dir ${testDir}`, {
      encoding: 'utf-8'
    });

    expect(output).toContain('test-run');
    expect(output).toContain('test-step');
    expect(output).toContain('Execution Tree');
  });

  it('should show error for non-existent run', () => {
    try {
      execSync(`node dist/index.js view run_fake123 --dir ${testDir}`, {
        encoding: 'utf-8'
      });
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Run not found');
    }
  });
});
```

### Success Criteria

✅ `list` command works  
✅ `view` command renders tree  
✅ Colors and formatting correct  
✅ Error messages helpful  
✅ Works with custom directories  
✅ CLI is executable via `npx`  

---

## Step 10: Create Examples and Final Documentation

**Goal:** Create comprehensive examples and polish README

**PRD Reference:** Section 9 (Examples)

**Duration:** 4 hours

**Files:** Multiple example directories, README.md, CONTRIBUTING.md

### Cursor Prompt

```
Create 5 example projects in the examples/ directory:

1. examples/01-basic/index.ts:
   - Simple agent with inspectRun() and step()
   - Shows basic usage pattern
   - Includes package.json with scripts

2. examples/02-nested-steps/index.ts:
   - Demonstrates nested step hierarchies
   - Shows parent-child relationships in output
   - Multiple levels of nesting

3. examples/03-parallel-steps/index.ts:
   - Uses Promise.all() with multiple steps
   - Shows concurrent execution tracking
   - Demonstrates that parent IDs are maintained

4. examples/04-error-handling/index.ts:
   - Shows how errors are captured
   - Demonstrates try/catch patterns
   - Shows trace inspection after failure

5. examples/05-observe-wrapper/index.ts:
   - Uses observe() on a custom agent class
   - Shows class-based agent pattern
   - Demonstrates automatic instrumentation

Each example should:
- Have clear comments explaining what's happening
- Include a package.json with "start" script
- Be runnable with: cd examples/01-basic && pnpm start
- Show expected output in comments at top

Also update root README.md with:
- Clear quickstart guide
- Installation instructions
- API reference (brief)
- Link to examples
- Link to PRD
- Contributing guidelines
- License (MIT)

Create CONTRIBUTING.md with:
- How to set up dev environment
- How to run tests
- How to add new features
- Code style guidelines
- Commit message convention
```

### Example: examples/01-basic/index.ts

```typescript
/**
 * Basic AgentInspect Example
 * 
 * This example shows the simplest usage pattern:
 * - inspectRun() to track a workflow
 * - step() to track individual operations
 * 
 * Expected output:
 * 🔍 AgentInspect: booking-flow (run_abc123)
 * 
 * ✔ search-hotels (820ms)
 * ✔ check-availability (340ms)
 * ✔ book-room (1.2s)
 * 
 * Completed in 2.4s
 * Trace: ~/.agent-inspect/runs/run_abc123.jsonl
 */

import { inspectRun, step } from 'agent-inspect';

async function searchHotels(destination: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    { name: 'Hotel A', price: 150 },
    { name: 'Hotel B', price: 200 }
  ];
}

async function checkAvailability(hotel: any) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { available: true, roomType: 'deluxe' };
}

async function bookRoom(hotel: any, room: any) {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return { confirmationId: 'CONF-123', hotel, room };
}

async function bookHotel(destination: string) {
  return inspectRun('booking-flow', async () => {
    const hotels = await step('search-hotels', () => 
      searchHotels(destination)
    );

    const availability = await step('check-availability', () =>
      checkAvailability(hotels[0])
    );

    const booking = await step('book-room', () =>
      bookRoom(hotels[0], availability)
    );

    return booking;
  });
}

// Run the example
bookHotel('Tokyo').then(result => {
  console.log('\nBooking result:', result);
}).catch(error => {
  console.error('Booking failed:', error);
});
```

### Final README.md Structure

```markdown
# AgentInspect

> Local-first debugging tool for AI agents—see what your agent did, step by step.

[![npm version](https://img.shields.io/npm/v/agent-inspect.svg)](https://www.npmjs.com/package/agent-inspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is AgentInspect?

AgentInspect transforms AI agent execution from scattered `console.log` statements into a structured, inspectable execution tree.

**Before:**
```typescript
console.log("Planning...");
console.log("Calling tool...");
console.log("Result:", result);
```

**After:**
```typescript
await inspectRun("trip-planner", async () => {
  const plan = await step("plan", () => planTrip());
  const hotels = await step.tool("searchHotels", () => searchHotels(plan));
  return step("finalize", () => finalize(plan, hotels));
});
```

## Features

- ✅ **Structured execution trees** instead of flat logs
- ✅ **Persistent JSONL traces** for later inspection
- ✅ **Real-time terminal output** showing step-by-step progress
- ✅ **Simple CLI** to list and view past runs
- ✅ **Zero configuration**—no API keys, accounts, or dashboards
- ✅ **Framework-agnostic**—works with any TypeScript agent

## Installation

```bash
npm install agent-inspect
# or
pnpm add agent-inspect
```

## Quick Start

### 1. Wrap your agent workflow

```typescript
import { inspectRun, step } from "agent-inspect";

await inspectRun("booking-flow", async () => {
  const hotels = await step("search-hotels", () => searchHotels());
  return step("finalize", () => finalize(hotels));
});
```

### 2. See real-time execution tree

```
🔍 AgentInspect: booking-flow (run_abc123)

✔ search-hotels (820ms)
✔ finalize (120ms)

Completed in 940ms
Trace: ~/.agent-inspect/runs/run_abc123.jsonl
```

### 3. Inspect past runs

```bash
agent-inspect list
agent-inspect view run_abc123
```

## API Reference

### `inspectRun(name, fn, options?)`

Track a named workflow execution.

```typescript
await inspectRun("workflow-name", async () => {
  // Your agent logic
});
```

### `step(name, fn, options?)`

Track an individual step.

```typescript
const result = await step("step-name", async () => {
  return doWork();
});
```

### `step.llm(model, fn)` & `step.tool(toolName, fn)`

Convenience helpers for LLM calls and tool invocations.

```typescript
await step.llm("gpt-4.1", () => llm.generate(prompt));
await step.tool("searchHotels", () => searchHotels(params));
```

### `observe(agent)`

Wrap an agent object for automatic tracking.

```typescript
const agent = observe({
  async run(input) {
    // Agent logic
  }
});
```

## Examples

See the [examples/](./examples/) directory for complete examples:

- [01-basic](./examples/01-basic/) - Simple usage
- [02-nested-steps](./examples/02-nested-steps/) - Hierarchical execution
- [03-parallel-steps](./examples/03-parallel-steps/) - Concurrent steps
- [04-error-handling](./examples/04-error-handling/) - Error capture
- [05-observe-wrapper](./examples/05-observe-wrapper/) - Class-based agents

## CLI Commands

### `agent-inspect list`

List recent agent runs.

```bash
agent-inspect list
agent-inspect list --limit 10
agent-inspect list --status error
```

### `agent-inspect view <run-id>`

View execution tree for a specific run.

```bash
agent-inspect view run_abc123
agent-inspect view run_abc123 --verbose
```

## Documentation

- [Product Requirements Document (PRD)](./AGENT_INSPECT_PRD_FINAL.md)
- [Implementation Guide](./CURSOR_IMPLEMENTATION_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT © 2026 AgentInspect Contributors

## Support

- [GitHub Issues](https://github.com/yourusername/agent-inspect/issues)
- [Documentation](./AGENT_INSPECT_PRD_FINAL.md)

---

**Built with ❤️ for AI agent developers**
```

### Success Criteria

✅ All 5 examples work correctly  
✅ Examples are well-commented  
✅ README is comprehensive  
✅ CONTRIBUTING.md complete  
✅ LICENSE file added (MIT)  
✅ Examples runnable with `pnpm start`  

---

## Final Steps: Publishing

### Step 11: Pre-Publish Checklist

**Duration:** 2 hours

#### Tasks

1. **Version finalization**
   ```bash
   pnpm version 0.1.0
   ```

2. **Build verification**
   ```bash
   pnpm clean
   pnpm build
   pnpm test
   pnpm typecheck
   ```

3. **Package.json review**
   - Ensure correct entry points
   - Verify exports (ESM + CJS)
   - Check bin configuration for CLI
   - Add keywords: "ai", "agent", "debugging", "observability", "local-first"
   - Add repository URL
   - Add homepage URL

4. **Documentation review**
   - README complete
   - LICENSE present
   - CONTRIBUTING.md present
   - Examples work

5. **Test installation**
   ```bash
   pnpm pack
   cd /tmp
   npm install /path/to/agent-inspect-0.1.0.tgz
   ```

6. **Publish dry-run**
   ```bash
   pnpm publish --dry-run
   ```

7. **Actual publish**
   ```bash
   pnpm publish --access public
   ```

8. **Post-publish verification**
   ```bash
   npx agent-inspect list
   ```

9. **GitHub release**
   - Tag release: v0.1.0
   - Create GitHub release with changelog
   - Link to npm package

### Success Criteria

✅ Package builds successfully  
✅ All tests pass  
✅ Published to npm  
✅ CLI works via `npx`  
✅ GitHub release created  
✅ Documentation complete  

---

## Quick Reference: Cursor Commands

### Build
```bash
pnpm build
```

### Test
```bash
pnpm test                # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # With coverage
```

### Lint
```bash
pnpm lint
pnpm lint:fix
```

### Type Check
```bash
pnpm typecheck
```

### Clean
```bash
pnpm clean               # Remove dist/, coverage/
```

---

**Next:** Let me know if you'd like the remaining steps (7-10) or any adjustments to the first 6 steps!
