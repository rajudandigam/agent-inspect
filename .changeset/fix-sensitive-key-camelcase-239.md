---
"agent-inspect": patch
"@agent-inspect/redact": patch
---

Fix camelCase / kebab / dot compound credential key redaction (`userPassword`, `clientSecret`) while keeping token-config keys and camelCase topic fields (`emailNote`) un-key-redacted.
