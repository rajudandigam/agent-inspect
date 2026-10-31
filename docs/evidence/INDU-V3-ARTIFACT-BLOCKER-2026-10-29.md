# Indu scenario-01-v3 artifact blocker (chunk 10)

**Date:** 2026-10-29  
**Related:** [#450](https://github.com/rajudandigam/agent-inspect/issues/450)

## Decision

**Stop — exact artifact unavailable.** Do not rebuild v3 from v2 or reuse the v2 name/hash.

## Search result

- No directory/archive named `scenario-01-v3-agentinspect-instrumented` under `docs/evidence`, Downloads, or authorized agent-inspect paths.
- Found v2 only under Downloads (`scenario-01-v2-correlation`).
- A renamed working copy elsewhere declares v3 in `fixture-manifest.json` but conflicts with `SOURCE.json` (still v2) and is not the authorized exact path.

## Required for unblocking

1. Absolute path or archive of the original `scenario-01-v3-agentinspect-instrumented` revision.
2. Matching original manifest / hashes.
3. Maintainer agreement if a new revision ID is required instead of recovering v3.

Until then: no Revera acceptance claim; **EVIDENCE_GATE** remains unapproved for 6.32.0.
