FROM langchain/langgraphjs-api:20
ADD . /deps/agent
ENV LANGSERVE_GRAPHS='{"agent":"./react-agent/graph.ts:graph"}'
ENV LANGGRAPH_AUTH='{"path":"./react-agent/security/auth.ts:auth","disable_studio_auth":false}'
WORKDIR /deps/agent
RUN bun i
RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts