# ---- Base ----
FROM oven/bun:1 AS base
WORKDIR /app

# ---- Dependencies (cached layer) ----
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholder URL — prisma generate needs it but doesn't connect
ENV DATABASE_URL="mysql://build:build@localhost:3306/build"
RUN bunx prisma generate && bun run build

# ---- Production ----
FROM oven/bun:1-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN adduser --system --uid 1001 nextjs

# Runtime node_modules: serverExternalPackages (mariadb, @prisma/adapter-mariadb)
# and prisma CLI for migrate deploy are NOT traced by Next.js standalone
COPY --from=deps /app/node_modules ./node_modules

# Next.js standalone output (merges its traced node_modules on top)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma: generated client + schema + migrations + config
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "bunx prisma migrate deploy && bun server.js"]
