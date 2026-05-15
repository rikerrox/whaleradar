FROM oven/bun:1-slim
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install
COPY . .
ENV NODE_ENV=production
EXPOSE 3003
CMD ["bun", "run", "index.ts"]
