# Dependency Policy

## Purpose

AgentInspect should remain lightweight, local-first, and easy to install.

The core package must avoid unnecessary dependencies because AgentInspect is intended to feel closer to a developer utility than a heavy observability SDK.

Dependency decisions should protect:

- install speed
- package size
- security surface
- maintainability
- cross-platform reliability
- trust in the core package

## Core principle

> Do not add a dependency unless it clearly improves the user experience and cannot be reasonably implemented with Node.js built-ins or a small internal utility.

## Approved runtime dependencies

The following runtime dependencies are approved for the main package:

```text
chalk
commander
nanoid
Why these are approved
chalk

Used for terminal color output.

Acceptable because:

CLI readability matters
widely used
focused purpose
small enough for this use case
commander

Used for CLI command parsing.

Acceptable because:

AgentInspect has a CLI-first workflow
avoids writing custom argument parsing
stable and widely used
nanoid

Used for generating event IDs when source data does not provide stable IDs.

Acceptable because:

small
focused
already preferred over uuid
suitable for generated local trace IDs
Dependencies to avoid
cli-table3

Do not add cli-table3 to the main package.

Use a small internal table renderer instead.

Reason:

table rendering needs are simple
avoids dependency creep
easier to control output format
easier to test
uuid

Do not add uuid.

Use nanoid for generated event IDs.

Reason:

nanoid is already approved
one ID generation dependency is enough
TUI dependencies in the main package

Do not add Ink, React, or TUI-related dependencies to the main package.

TUI should live in a separate package:

@agent-inspect/tui

Reason:

TUI is optional
many users only need CLI output
keeps main install lean
avoids terminal compatibility issues affecting core
Heavy parser libraries

Avoid heavy parser libraries unless explicitly approved.

Reason:

v0.3 parser requirements are intentionally narrow
JSON logs are first-class
log4js parsing is best-effort
unsafe object parsing should not be supported
Vendor SDKs

Do not add vendor observability SDKs to the main package.

Avoid dependencies for:

Langfuse
Braintrust
New Relic
Datadog
Phoenix
OpenTelemetry SDKs

unless a future version explicitly approves a separate adapter/export package.

Reason:

AgentInspect is not a vendor sink before v1.0
local debugging is the core workflow
vendor integration creates maintenance burden
Framework dependencies

Do not add LangChain or other agent framework dependencies to the main package.

Framework adapters should be separate packages if peer dependencies are required.

Example:

@agent-inspect/langchain

Reason:

not all users use LangChain
keeps core framework-agnostic
avoids peer dependency conflicts
Dependency approval checklist

Before adding any dependency, answer:

1. Is this dependency needed at runtime?
2. Can Node.js built-ins solve this?
3. Can a small internal utility solve this?
4. Does this increase package size significantly?
5. Does this increase security risk?
6. Is it needed by all users or only one optional workflow?
7. Should it live in a separate package?
8. Is the dependency actively maintained?
9. Does it support ESM cleanly?
10. Does it work on Windows, macOS, and Linux?

If the dependency is only needed for an optional feature, it should not go into the main package.

Runtime vs dev dependencies
Runtime dependencies

Runtime dependencies are installed by users.

Be very strict.

Approved runtime dependencies for main package:

chalk
commander
nanoid
Dev dependencies

Dev dependencies may include tooling for:

TypeScript
tests
build
linting
package smoke tests
docs generation
examples

Dev dependencies still need care, but they do not affect user install footprint in the same way.

Optional packages

Optional feature areas should become separate packages.

Examples:

@agent-inspect/langchain
@agent-inspect/tui
@agent-inspect/fixtures
@agent-inspect/conformance

Do not add these as optional dependencies of the main package unless there is a strong reason.

Preferred behavior:

user installs explicitly
CLI detects whether package exists
if missing, show clear install instruction

Example:

TUI requires @agent-inspect/tui.
Run: npm install @agent-inspect/tui
ESM and Node built-ins

Use ESM-style imports.

For Node built-ins, use node: prefix.

Good:

import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

Avoid:

import fs from "fs";
Internal utilities preferred

Prefer small internal utilities for:

table rendering
duration formatting
simple wildcard matching
safe JSON parsing
redaction traversal
compact object formatting

Do not reach for dependencies prematurely.

Examples
Table rendering

Preferred:

packages/cli/src/renderers/table-renderer.ts

Avoid:

import Table from "cli-table3";
Duration parsing

Preferred:

packages/core/src/utils/duration.ts

Avoid adding a date utility library for simple duration parsing.

Wildcard matching

Preferred:

function matchesPattern(pattern: string, value: string): boolean {
  // simple exact + '*' support
}

Avoid adding a glob library unless matching requirements become much more complex.

Security considerations

Every dependency increases risk.

Before adding:

npm audit

or equivalent repo command should remain clean for high/critical vulnerabilities.

Dependency updates should be reviewed carefully.

Package-size considerations

AgentInspect should remain lightweight.

Watch for:

large transitive dependency trees
packages that ship browser bundles unnecessarily
packages with native bindings
packages with poor ESM support
packages that slow install
Cross-platform considerations

Dependencies must work on:

macOS
Linux
Windows

Avoid packages with fragile native requirements unless absolutely necessary.

Version-specific guidance
v0.2

No new runtime dependencies.

Use internal table renderer.

Use existing approved dependencies only.

v0.3

Use nanoid for generated event IDs.

Do not add parser libraries.

JSON parser should use Node.js streams and JSON.parse.

log4js parser should extract embedded valid JSON only.

v0.4

Use Node.js streams and file APIs.

Do not add TUI dependencies.

v0.5

LangChain support should use a separate package if peer dependencies are needed.

Do not add LangChain to core package.

v0.6

TUI must be a separate package.

Do not add Ink or React to the main package.

v0.7

Standards export should start with JSON transformations.

Avoid adding heavy OpenTelemetry SDK dependencies unless truly needed.

v1.0

Before declaring v1.0, audit all dependencies and confirm the main package remains lean.

Summary

Approved in main package:

chalk
commander
nanoid

Avoid in main package:

cli-table3
uuid
Ink
React
LangChain
vendor observability SDKs
heavy parser libraries

Default decision:

If unsure, do not add the dependency.