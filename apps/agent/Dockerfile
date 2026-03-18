FROM oven/bun:1.3.9

WORKDIR /app

COPY . .

RUN sed -i '/"@hexio\/eslint-config"/d;/"@hexio\/typescript-config"/d' package.json \
  && bun install

ENV PORT=10000

EXPOSE 10000

CMD ["bun", "run", "start"]