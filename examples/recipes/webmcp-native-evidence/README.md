# Recipe: webmcp-native-evidence

Keyless **WebMCP operation evidence** harness: tool response vs independently
observed effect, with portable AgentInspect checks and Evidence v2.

## What this proves

| Lane | Status in this recipe |
| --- | --- |
| Synthetic fixture cases (good, business rejection, wrong-resource, missing observer) | Runnable offline; no browser |
| Native Chromium `page.webmcp` | **Not claimed here** — requires a WebMCP-capable Chrome and is validated in Trip Workbench |
| Real application (Trip Workbench lost-response / receipt recovery) | See Trip `npm run test:lost-response-evidence` (API-labeled) and `npm run test:webmcp-evidence` (strict native gate) |

This recipe does **not** replace
[browser-mcp-observed-outcomes](../browser-mcp-observed-outcomes/), which already
covers synthetic binding-only / forged-label / ablation controls (#485 W05
residual). Reuse that recipe for detector ablations; use this recipe for the
portable check → evidence packaging pattern aimed at WebMCP operations.

## Cases

1. **good** — intended resource, matching receipt/fields, all outcomes `passed`
2. **business-rejected** — protocol-complete tool step with app `ok:false`; mutation outcome fails; rejection scenario passes
3. **wrong-resource** — observer returns a different resource id; binding fails
4. **missing-observer** — no independent read; affected claims stay `unknown` and the strict gate fails

## How to run

```bash
pnpm build
pnpm --filter agent-inspect-recipe-webmcp-native-evidence start
pnpm --filter agent-inspect-recipe-webmcp-native-evidence verify
```

`verify` parses `check --json`, asserts required observation names/statuses per
case (including the named `mutation_succeeded=failed` for business-rejected),
and runs `bundle verify` on Evidence v2 for the good case. Negative controls
must fail on binding/missing-observer findings — not on unrelated missing-tool
or parser errors.

### Packed-main `gen_ai.tool.name` probe

```bash
pnpm build
pnpm --filter agent-inspect-recipe-webmcp-native-evidence probe:packed-genai-tool-name
```

Installs a tarball from the **current git SHA** (not npm registry `6.31.36`) and
checks that `--required-tool update_trip_draft` matches an OTLP-style span via
`gen_ai.tool.name`. The report prints `gitSha` and `tarballSha256` separately
from any registry version.

## Privacy / network

- Metadata-only synthetic facts; no prompts, cookies, or provider payloads
- Local disk only; no upload
- No Puppeteer/browser dependency at AgentInspect root

## Related

- Trip Workbench integration runbook (application proof): `docs/AGENTINSPECT_WEBMCP.md` in that repository
- Puppeteer WebMCP guide: https://pptr.dev/guides/webmcp
- Spec issue #290 closed as application/tooling work — diagnostics belong in tooling, not new spec surface
