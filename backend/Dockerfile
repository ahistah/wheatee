FROM oven/bun:1.3.13

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["bun", "src/server.ts"]
