# AGENTS.md Addendum

Insert this after `## One-chunk protocol`.

```md
### Explicit autonomous release-train mode

The default remains one chunk followed by maintainer review.

Codex may continue across chunks only when all of the following are true:

- the maintainer explicitly authorizes a named release train;
- `CURRENT-TASK.md` sets `executionMode: "autonomous-release-train"`;
- an active execution plan defines the ordered chunks and gates;
- each chunk remains one independently validated commit;
- Codex pushes only fast-forward commits to the already checked-out `main` branch;
- required CI is green before the next chunk begins.

This mode authorizes routine commit and push operations for the named train. It does not authorize force pushes, branch deletion, bypassing CI, destructive Git operations, local npm publishing, credential use, schema changes, new root/core dependencies, network behavior, or unrelated edits.

Stop autonomous execution on unrelated worktree changes, material plan drift, a public breaking change, a schema/dependency/network decision, validation that cannot be repaired in current scope, partial publication, or missing credentials.
```

In `## Maintainer authority`, append:

```md
The explicit autonomous release-train mode above is the only exception for routine commits, pushes, and validated Changesets PR merging. First publication of a new npm package remains a manual maintainer gate.
```
