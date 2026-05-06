# Redaction

## Purpose

AgentInspect processes local traces and logs that may contain sensitive data.

Redaction is required because agent logs often contain:

- authorization headers
- cookies
- API keys
- user identifiers
- emails
- prompt fragments
- tool inputs
- tool outputs
- internal metadata

AgentInspect should be safe by default in terminal output and configurable for stricter persistence rules.

## Core principle

> Never expose obvious secrets in terminal output.

AgentInspect is local-first, but local files and terminal output can still be copied, shared, attached to issues, pasted into Slack, or committed by mistake.

## Redaction rule type

Use this config-safe redaction rule type:

```ts
type RedactionRule =
  | string
  | {
      key: string;
      strategy: "full" | "prefix" | "hash";
      keep?: number;
    };
No function strings

Do not support function strings in JSON config.

Do not support this:

{
  "redact": [
    {
      "key": "token",
      "strategy": "(value) => value.slice(0, 4)"
    }
  ]
}

This is unsafe and not JSON-native.

Use named strategies only.

Default sensitive keys

AgentInspect should redact these keys by default:

authorization
cookie
token
apiKey
password
secret
email

The matching should ideally be case-insensitive.

Recommended extended default candidates:

accessToken
refreshToken
idToken
sessionToken
clientSecret
privateKey
setCookie
xApiKey
api_key
auth
jwt
bearer

These extended keys may be added carefully as the implementation matures.

Redaction strategies
full

Fully redacts the value.

Example:

{
  "key": "apiKey",
  "strategy": "full"
}

Input:

{
  "apiKey": "sk_test_123456789"
}

Output:

{
  "apiKey": "[REDACTED]"
}

String rules should behave like full.

Example:

{
  "redact": ["password"]
}

Equivalent to:

{
  "redact": [
    {
      "key": "password",
      "strategy": "full"
    }
  ]
}
prefix

Keeps a prefix and masks the rest.

Example:

{
  "key": "userUuid",
  "strategy": "prefix",
  "keep": 8
}

Input:

{
  "userUuid": "f0769fd4-1234-5678-9abc-abcdef000001"
}

Output:

{
  "userUuid": "f0769fd4…"
}

Use this for IDs that are useful for correlation but should not be fully displayed.

hash

Replaces value with a stable hash.

Example:

{
  "key": "email",
  "strategy": "hash"
}

Input:

{
  "email": "person@example.com"
}

Output:

{
  "email": "[HASH:ab12cd34]"
}

Hashing is useful when the same value needs to be recognized across events without exposing the value.

Implementation note:

Use a deterministic hash.
Do not add a heavy dependency for hashing.
Prefer Node built-in crypto if needed.
Redaction modes

AgentInspect may eventually support two redaction modes.

type RedactionMode = "display-only" | "persisted";
display-only

Default mode.

Raw local trace data may remain unchanged.
Terminal output is redacted.
Markdown/HTML exports should be redacted unless explicitly configured otherwise.
persisted

Strict mode.

Redacted values are written to AgentInspect output files.
Useful for shareable traces.
Should be clearly documented.
Recommended default

Default behavior should be:

Display output: redacted
Persisted raw traces: current behavior unless strict mode is enabled
Export output: redacted by default

As the product matures, stricter defaults may be considered.

What should be redacted
Headers

Example keys:

authorization
cookie
set-cookie
x-api-key
Tokens

Example keys:

token
accessToken
refreshToken
idToken
sessionToken
jwt
Secrets

Example keys:

apiKey
secret
clientSecret
privateKey
password
Personal data

Example keys:

email
userEmail
phone
address
IDs

IDs are not always secrets, but can be sensitive.

For IDs used in debugging, prefer prefix masking instead of full redaction.

Example:

f0769fd4-1234-5678-9abc-abcdef000001 -> f0769fd4…
What should not be redacted by default

Do not redact useful non-sensitive debugging metadata by default.

Examples:

event
kind
status
durationMs
timestamp
messageCount
model
tokens.input
tokens.output
resultCount

Be careful with prompts and outputs. They can contain sensitive data even if the key name is harmless.

Prompt and output handling

AgentInspect should not capture full prompts or outputs by default.

Recommended capture modes for future adapters:

type CaptureMode = "none" | "metadata-only" | "preview";
none

Capture no input/output content.

metadata-only

Capture lengths, token counts, model names, and status.

Example:

{
  "promptLength": 1200,
  "outputLength": 356,
  "model": "gpt-4o"
}
preview

Capture short previews only.

Example:

{
  "promptPreview": "User asked about...",
  "outputPreview": "The answer is..."
}

Preview must be size-limited and redacted.

Redaction matching rules

Recommended key matching:

case-insensitive
exact key match by default
nested object traversal
array traversal
preserve object shape
avoid mutating original input unless intended

Example:

Input:

{
  "headers": {
    "Authorization": "Bearer abc123",
    "Content-Type": "application/json"
  },
  "user": {
    "email": "person@example.com"
  }
}

Output:

{
  "headers": {
    "Authorization": "[REDACTED]",
    "Content-Type": "application/json"
  },
  "user": {
    "email": "[REDACTED]"
  }
}
Nested values

Redaction must work recursively.

Input:

{
  "toolInput": {
    "user": {
      "email": "person@example.com",
      "token": "abc123"
    }
  }
}

Output:

{
  "toolInput": {
    "user": {
      "email": "[REDACTED]",
      "token": "[REDACTED]"
    }
  }
}
Arrays

Redaction must handle arrays.

Input:

{
  "messages": [
    {
      "role": "user",
      "email": "person@example.com"
    }
  ]
}

Output:

{
  "messages": [
    {
      "role": "user",
      "email": "[REDACTED]"
    }
  ]
}
Circular references

Most log data should be JSON-compatible and not circular.

If AgentInspect handles runtime objects in the future, redaction should guard against circular references.

Redaction in CLI output

CLI output should avoid large raw objects.

Recommended behavior:

show compact attributes
limit value length
redact before formatting
show [REDACTED] consistently
show ID prefixes where configured

Example:

tool:get_user user=f0769fd4… email=[REDACTED]
Redaction in JSON output

For --json, default behavior should be redacted unless a future explicit --raw flag is added.

If a raw mode is ever added, it should include a warning.

Example:

Warning: --raw may expose secrets from local traces.
Redaction in exports

Markdown and HTML exports should be redacted by default.

OpenInference/OTLP exports should avoid full prompt/output values unless the user explicitly opts in.

Example config
{
  "redact": [
    "authorization",
    "cookie",
    "token",
    "apiKey",
    "password",
    "secret",
    "email",
    {
      "key": "userUuid",
      "strategy": "prefix",
      "keep": 8
    },
    {
      "key": "accountId",
      "strategy": "hash"
    }
  ]
}
Example redaction result

Input:

{
  "event": "proactive.job.started",
  "decisionId": "01fe6bf1",
  "userUuid": "f0769fd4-1234-5678-9abc-abcdef000001",
  "email": "person@example.com",
  "authorization": "Bearer abc123",
  "timestamp": 1746451218130
}

Output:

{
  "event": "proactive.job.started",
  "decisionId": "01fe6bf1",
  "userUuid": "f0769fd4…",
  "email": "[REDACTED]",
  "authorization": "[REDACTED]",
  "timestamp": 1746451218130
}
Testing requirements

Redaction tests should cover:

default sensitive keys
case-insensitive key matching
nested objects
arrays
full strategy
prefix strategy
hash strategy
missing keep value
non-string values
null and undefined values
large objects
CLI display redaction
JSON output redaction
Non-goals

Redaction is not:

a full DLP system
a compliance guarantee
a replacement for secure logging
a production data governance engine

AgentInspect should be safe by default, but users remain responsible for how they log, store, export, and share traces.