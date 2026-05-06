# Schema Evolution

## Purpose

AgentInspect writes and reads local trace data. As the product evolves from v0.1 through v1.0, the schema must evolve carefully.

The goal is to improve the model without breaking existing users or making old traces unreadable.

## Core principles

```text
Existing v0.1 JSONL traces must remain readable.
Additive schema changes are allowed in minor versions.
Breaking schema changes require a major version.
v1.0 schema becomes stable.
Current baseline

The v0.1.x MVP writes local JSONL traces for manual instrumentation.

The current implementation includes:

inspectRun()
step()
step.llm()
step.tool()
observe()
local JSONL traces
CLI list/view

Before changing trace schema behavior, Cursor must inspect the actual current source and tests.

Required files to inspect before schema-sensitive work:

packages/core/src/storage.ts
packages/core/src/types.ts
packages/core/test/*.test.ts
packages/cli/src/index.ts

Do not assume event names.

Do not assume fields.

Do not assume the schema uses names like:

run_ended
step_ended

Always verify the actual current implementation.

Schema compatibility goals

AgentInspect should support three categories of data:

1. Existing v0.1 traces

These are traces already created by the published package.

They must remain readable.

If new metadata extraction cannot fully understand an old trace, it should report unknown values rather than failing.

2. v0.2 enhanced trace metadata

v0.2 improves local inspection:

filtering
summary stats
trace directory config
clean command
metadata extraction

v0.2 should not require breaking changes to existing trace files.

3. v0.3 normalized event model

v0.3 introduces log-to-tree normalization with InspectEvent.

This model may exist alongside existing trace files before becoming the stable foundation.

Additive changes

Additive changes are allowed in minor versions.

Examples:

Adding a new optional field
Adding a new metadata section
Adding a schemaVersion field
Adding source information
Adding confidence labels
Adding attributes
Adding token metadata
Adding redaction metadata

Additive changes should not break older readers.

Example:

{
  "event": "step_completed",
  "runId": "run_123",
  "timestamp": 1746451218130,
  "schemaVersion": "0.3",
  "source": {
    "type": "manual"
  }
}

Older readers should ignore fields they do not understand.

Breaking changes

Breaking changes require a major version.

Examples:

Renaming required fields
Removing fields
Changing timestamp units
Changing event names without migration
Changing status meanings
Changing JSONL record shape incompatibly
Removing CLI support for old traces
Changing default storage location without fallback

Breaking schema changes should wait for v2.0 or require a migration path.

Schema versioning

AgentInspect should introduce explicit schema versioning before v1.0.

Recommended field:

{
  "schemaVersion": "1.0"
}

Before v1.0, schema versions may be:

0.1
0.2
0.3

At v1.0, schema version 1.0 should become stable.

Versioning rules
Patch versions

Patch versions should not change schema except for harmless fixes.

Allowed:

Fix malformed optional metadata
Fix redaction bug
Fix parser warning output
Fix compatibility issue

Not allowed:

Rename fields
Remove fields
Change required structure
Minor versions

Minor versions may add fields or new event types.

Allowed:

Add optional source field
Add optional confidence field
Add optional attributes field
Add new InspectKind
Add new CLI output format

Should remain backward compatible.

Major versions

Major versions may include breaking schema changes.

Allowed only with:

Migration guide
Clear changelog
Optional migration command if needed
Deprecation period where practical
Reading old traces

Readers should be tolerant.

When reading trace files:

skip malformed lines with warning
preserve unknown fields where possible
do not crash on missing optional fields
use unknown status when status cannot be determined
use fallback names when names are missing
keep old traces viewable in CLI
Unknown status behavior

Do not default unknown status to success.

Use unknown or undefined when status cannot be determined.

For metadata extraction, a type like this may be used:

export type TraceMetadataStatus =
  | "success"
  | "error"
  | "running"
  | "unknown";

Rules:

success only when completion is explicit
error when error is explicit
running when trace appears incomplete
unknown when quick scan or old schema cannot determine status
Event name compatibility

Event names are schema-sensitive.

Before implementing logic that depends on event names, inspect current source.

Bad:

if (event.event === "run_ended") {
  status = "success";
}

unless run_ended is verified in current schema.

Better:

// Use actual event names from storage.ts/tests.
// Support multiple known legacy names if necessary.
Migration strategy

Before v1.0, prefer compatibility readers over migration.

For example:

Read v0.1 traces
Extract best-effort metadata
Display unknown where needed
Do not rewrite files automatically

After v1.0, if migration is needed, provide an explicit command:

agent-inspect migrate

Migration should:

be opt-in
create backups or write new files
never destroy old traces silently
explain what changed
JSONL compatibility

AgentInspect trace files are line-delimited JSON.

Rules:

one JSON object per line
malformed lines should be skipped with warning
empty lines should be ignored
unknown fields should be preserved or ignored safely
file extension should remain .jsonl unless a future version explicitly changes it
Trace verification

Commands like clean must verify files before deleting.

A file should be considered an AgentInspect trace only if it matches expected characteristics.

Possible checks:

file extension is .jsonl
contains parseable JSON lines
contains known AgentInspect event fields
contains runId or compatible trace metadata
contains schemaVersion or legacy event shape

Do not delete unknown .jsonl files blindly.

Schema and redaction

Schema evolution must consider redaction.

If new fields may contain sensitive data, redaction rules should be updated.

Examples:

input
output
prompt
completion
messages
headers
metadata
toolInput
toolOutput

Full prompt and output capture should not become default.

Schema and standards export

The internal schema should be designed so it can map to OpenInference and OTel GenAI later.

But the internal schema should serve local debugging first.

Do not force OpenTelemetry concepts into every internal field before local value is proven.

Schema and adapters

Adapters should normalize into InspectEvent.

Adapter-specific fields should go into attributes.

Example:

attributes: {
  langchainRunId: "...",
  parentRunId: "...",
  tags: [],
  metadata: {}
}

Avoid adding framework-specific top-level fields unless they are broadly useful.

Schema and logs

Log-derived events may be incomplete.

The schema must support:

missing parent ID
missing duration
missing status
partial timestamp
unknown kind
correlated confidence
heuristic confidence
source file and line

This is why most fields should be optional except:

eventId
runId
name
kind
timestamp
confidence
source

Even timestamp may need careful fallback behavior if logs are incomplete.

v1.0 stability commitment

At v1.0, AgentInspect should define stable contracts for:

inspectRun()
step()
observe()
step.llm()
step.tool()
InspectEvent
InspectNode
InspectRunTree
AttributionConfidence
InspectKind
CLI commands
JSONL schema

After v1.0:

breaking changes require v2.0
deprecated fields should remain for at least a documented period
migration guides are required
schema changes should be additive whenever possible
Deprecation policy

Recommended v1.x deprecation process:

1. Add new field/API.
2. Mark old field/API as deprecated in docs and JSDoc.
3. Emit warning only when useful and not noisy.
4. Provide migration guidance.
5. Keep old behavior for a defined period.
6. Remove only in next major version.
Testing requirements

Schema-related tests should cover:

v0.1 trace readability
unknown status behavior
missing fields
extra fields
malformed lines
schemaVersion presence
schemaVersion absence
legacy event names
new event names
metadata extraction
clean command verification
redaction of new fields
JSON output compatibility
Documentation requirements

Every schema change should update:

docs/architecture/EVENT-MODEL.md
docs/architecture/SCHEMA-EVOLUTION.md
docs/implementation relevant guide
docs/prd relevant version
CHANGELOG.md
Non-goals

Schema evolution should not become:

a complex migration framework before v1.0
a database abstraction
a vendor trace schema clone
a reason to break existing local traces
an excuse to delay the v0.3 log-to-tree validation
Summary

Schema evolution should follow this rule:

Be flexible before v1.0, but never careless. Existing traces should remain readable, new fields should be additive, and v1.0 should become the stability line.