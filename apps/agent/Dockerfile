FROM oven/bun:1.3.9

WORKDIR /app

COPY . .

RUN sed -i '/"@hexio\/eslint-config"/d;/"@hexio\/typescript-config"/d' package.json \
  && bun install

ENV PORT=2024
ENV LANGGRAPH_INTERNAL_PORT=8123

EXPOSE 2024
EXPOSE 8123

CMD ["bun", "run", "dev"]