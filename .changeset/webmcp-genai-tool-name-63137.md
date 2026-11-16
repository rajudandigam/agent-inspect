---
"agent-inspect": patch
---

Recognize OTLP/GenAI `gen_ai.tool.name` in shared canonical tool-name matching so `--required-tool` / `--forbidden-tool` and TraceContract tool rules match semantic names (for example `update_trip_draft`) instead of display names like `execute_tool update_trip_draft`. Explicit `toolName`/`tool` fields remain authoritative on conflict, with a `tool.usage` warning. Adds the keyless `webmcp-native-evidence` recipe for synthetic operation-evidence packaging.
