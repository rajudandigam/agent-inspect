# Clean Install Smoke Test

Use this guide to check that the published `agent-inspect` package works from a clean consumer project. These steps are for users and contributors who want to verify npm or pnpm install behavior without reading the full monorepo development setup.

AgentInspect targets Node.js `>=20`. TypeScript consumers should use TypeScript settings that support package exports, such as `module` and `moduleResolution` set to `NodeNext` or `Node16`.

## npm Temp Project

Start in an empty temporary directory:

```bash
mkdir /tmp/agent-inspect-npm-smoke
cd /tmp/agent-inspect-npm-smoke
npm init -y
npm install agent-inspect
```

Check ESM import support:

```bash
node -e "import('agent-inspect').then((m) => { if (!m.inspectRun || !m.step || !m.maybeInspectRun) process.exit(1); console.log('esm ok'); })"
```

Check CJS require support:

```bash
node -e "const m = require('agent-inspect'); if (!m.inspectRun || !m.step || !m.maybeInspectRun) process.exit(1); console.log('cjs ok');"
```

Check the installed CLI:

```bash
npx --no-install agent-inspect --help
```

To check registry resolution without a local install, run this in a different empty directory:

```bash
npx agent-inspect --help
```

## pnpm Temp Project

Start in a separate temporary directory:

```bash
mkdir /tmp/agent-inspect-pnpm-smoke
cd /tmp/agent-inspect-pnpm-smoke
npm init -y
pnpm add agent-inspect
```

Check ESM import support:

```bash
node -e "import('agent-inspect').then((m) => { if (!m.inspectRun || !m.step || !m.maybeInspectRun) process.exit(1); console.log('esm ok'); })"
```

Check CJS require support:

```bash
node -e "const m = require('agent-inspect'); if (!m.inspectRun || !m.step || !m.maybeInspectRun) process.exit(1); console.log('cjs ok');"
```

Check the installed CLI:

```bash
pnpm exec agent-inspect --help
```

## TypeScript Consumer Notes

For ESM TypeScript consumers, use a package with `"type": "module"` and Node-aware module settings:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

For CJS TypeScript consumers, use a CommonJS package or `.cts` files with Node-aware settings:

```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
```

These settings match the compatibility guidance in [Known issues](KNOWN-ISSUES.md#common-installruntime-compatibility-checks).

## From a Repo Clone

The temp-project checks above verify the published package. From a local repo clone, build first:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm compat:smoke
```

Maintainers can run the tarball smoke test when package contents or exports change:

```bash
pnpm pack:smoke
```

## Troubleshooting

If `npm install agent-inspect` or `pnpm add agent-inspect` fails:

- Confirm `node -v` is Node.js `20` or newer.
- Confirm the package manager can reach the npm registry.
- Retry in a new empty temp directory to rule out an existing lockfile or workspace override.

If ESM import fails:

- Confirm the consumer project uses `"type": "module"` or an `.mjs` entry file when testing static imports.
- For TypeScript, use `module` and `moduleResolution` set to `NodeNext` or `Node16`.

If CJS require fails:

- Confirm the consumer project uses `"type": "commonjs"` or a `.cjs` entry file.
- For TypeScript CJS, prefer `.cts` files with `module` and `moduleResolution` set to `Node16`.

If the CLI is missing:

- Check `node_modules/.bin/agent-inspect` after install.
- Use `npx --no-install agent-inspect --help` or `pnpm exec agent-inspect --help` to ensure you are using the locally installed binary.

## What to Report

When opening an issue, include:

- Node.js version from `node -v`.
- Package manager and version from `npm -v` or `pnpm -v`.
- Operating system and shell.
- Whether the failing case is npm, pnpm, ESM import, CJS require, TypeScript compile, or CLI help.
- The exact command and complete output or stack trace.
- A minimal reproduction directory, repository, or file snippet when possible.
