#!/usr/bin/env node
process.argv.splice(2, 0, "pii");
await import("./demo-agent.mjs");
