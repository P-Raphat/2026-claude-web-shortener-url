# 1. เริ่มจากอะไร — ใช้ bun image เป็น base
FROM oven/bun:1 AS base
WORKDIR /app

# 2. ติดตั้ง dependencies ก่อน (cache layer)
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# 3. Build application
FROM base AS builder
ENV DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

# 4. Production — copy เฉพาะที่ต้องใช้ใน production
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/generated ./src/generated

USER nextjs
EXPOSE 3000
CMD ["bun", "server.js"]
