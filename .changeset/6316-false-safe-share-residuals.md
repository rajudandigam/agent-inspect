---
"agent-inspect": patch
"@agent-inspect/redact": patch
---

Close two false-SAFE share residuals: treat incomplete placeholders like `token=[REDACTED]/…` as secrets in free text, and strip or withhold connection-string userinfo when multihost authorities fail WHATWG URL parsing.
