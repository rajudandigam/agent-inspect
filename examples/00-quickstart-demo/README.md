## AgentInspect quickstart demo

This folder is a minimal runnable demo for AgentInspect.

### Run

```bash
npm install
npm start
```

### Inspect the trace

The demo writes traces under `./.agent-inspect/`.

```bash
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect --summary
```

