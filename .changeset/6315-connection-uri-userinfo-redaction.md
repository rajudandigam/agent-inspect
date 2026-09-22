---
"agent-inspect": patch
"@agent-inspect/redact": patch
---

Strip userinfo credentials from common connection URIs (postgres, mysql, mongodb, redis, amqp, and TLS variants) under share/strict while keeping scheme, host, port, and database/queue path.
