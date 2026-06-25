# Adoption metrics

**Status:** product validation dashboard.
**Privacy rule:** do not add hidden telemetry. Prefer manual, public, or opt-in signals.

## Design partners

Recruit 5–10 unrelated teams across:

- AI SDK;
- OpenAI Agents;
- LangGraph;
- mature hosted-observability users;
- privacy-sensitive products;
- CI/eval-heavy teams;
- NestJS or monorepo teams;
- agent framework maintainers.

## Activation metrics

Measure manually and through opt-in research:

- install → first trace opened;
- first trace → first useful command;
- time to first useful trace;
- adapter setup steps;
- quickstart completion.

Target:

```text
median time to first useful trace < 5 minutes
```

## Retention metrics

- active after 7 days;
- active after 30 days;
- repeat runs inspected;
- repeat `diff` usage;
- repeat `check` usage;
- adapter retained in package manifest;
- reporter retained in CI.

## Workflow metrics

- CI trace artifacts created;
- CI checks executed;
- baseline comparisons;
- reports generated;
- safety scans run;
- framework adapter usage;
- sessions inspected.

## Community signals

- external compatibility bugs;
- meaningful adapter requests;
- external recipes;
- external adapter implementations;
- framework documentation references;
- users asking for deeper workflows rather than installation help.

## Measurement sources

Use:

- package-specific npm trends;
- public GitHub dependents;
- public code search;
- design-partner interviews;
- opt-in surveys;
- case studies;
- optional local usage report.

Possible future command:

```bash
agent-inspect usage-report --output usage-report.json
```

It must never transmit automatically.

## Product gates

### After v1.6

- two external `open` users;
- one custom-inspector user;
- external OpenInference or OTLP trace successfully inspected;
- no regression in legacy trace workflows.

### After v1.7

- five unrelated adapter trials;
- three retained integrations;
- median first trace below five minutes;
- one external public integration example.

### After v1.8

- three retained CI workflows;
- repeated `check` use;
- one baseline-regression workflow;
- users request more assertion types rather than basic setup help.

### Before v2 stable

- 10 unrelated teams;
- five retained for 30 days;
- three real repositories retaining the package;
- three CI workflows depending on checks/artifacts;
- two external integrations or major recipes;
- external RC migration validation.
