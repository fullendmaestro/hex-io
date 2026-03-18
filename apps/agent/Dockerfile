FROM langchain/langgraphjs-api:20

WORKDIR /deps/agent

# Render builds this service with apps/agent as context.
ADD . /deps/agent

# Remove monorepo-only workspace deps that are not published packages before npm install.
RUN sed -i '/"@hexio\/eslint-config"/d;/"@hexio\/typescript-config"/d' package.json \
	&& npm install --legacy-peer-deps --no-audit --no-fund

ENV LANGSERVE_GRAPHS='{"agent":"./react-agent/graph.ts:graph"}'

RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts