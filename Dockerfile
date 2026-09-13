# Glama / directory-listing image for the Preview read-only MCP server.
# The product is local-first; this image only needs to answer initialize + tools/list.
# Glama's admin UI generates its own Dockerfile — if configuring that form, use:
#   Build steps: ["npm install -g @agent-inspect/mcp-server"]
#   CMD: ["agent-inspect-mcp-server", "--dir", "/traces"]
FROM node:20-alpine

RUN mkdir -p /traces
ENV AGENT_INSPECT_TRACE_DIR=/traces

RUN npm install -g @agent-inspect/mcp-server

CMD ["agent-inspect-mcp-server", "--dir", "/traces"]
