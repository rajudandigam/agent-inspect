#!/usr/bin/env node
process.argv.splice(2, 0, "good");
await import("./demo-agent.mjs");
