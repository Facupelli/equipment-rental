# Based on: https://www.bstefanski.com/blog/turborepo-nestjs-prisma-dockerfile
# Adapted for @repo/backend with pnpm@10.30.3, Prisma v7, prisma.config.ts

# =============================================================================
# Stage 1 — base
# Install pnpm and turbo globally via corepack + npm.
# Using ENV for pnpm home as recommended for corepack + global installs.
# =============================================================================
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat openssl && \
    corepack enable && \
    corepack prepare pnpm@10.30.3 --activate && \
    npm install -g turbo

# =============================================================================
# Stage 2 — builder
# Runs turbo prune to produce a minimal pruned workspace for @repo/backend.
# =============================================================================
FROM base AS builder

WORKDIR /app

COPY . .

RUN turbo prune @repo/backend --docker

# =============================================================================
# Stage 3 — installer
# Two-step copy pattern for optimal Docker layer caching:
#   1. Copy package.json files only → install deps (cached until deps change)
#   2. Copy full source → build (cached until source changes)
# Prisma client is generated BEFORE nest build so TS types are available.
# =============================================================================
FROM base AS installer

WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

# Generate Prisma client BEFORE nest build — TypeScript needs types at compile time.
# Using prisma.config.ts which lives at apps/backend/prisma.config.ts
RUN cd apps/backend && pnpm exec prisma generate

RUN turbo run build --filter=@repo/backend --no-cache

# =============================================================================
# Stage 4 — runner
# Minimal production image. Copies only what is needed to run the app:
#   - root node_modules (shared deps)
#   - app dist/ (compiled output)
#   - app node_modules (app-specific deps)
#   - prisma/ schema + migrations (needed by migrate deploy at runtime)
#   - packages/ (shared workspace packages)
# Runs as a non-root user for security.
# =============================================================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

WORKDIR /app

COPY --from=installer --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=installer --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nodejs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=installer --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=installer --chown=nodejs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=installer --chown=nodejs:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=installer --chown=nodejs:nodejs /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=installer --chown=nodejs:nodejs /app/packages ./packages

USER nodejs

# Railway injects PORT at runtime; fallback to 3000 for local docker runs
EXPOSE 3000

CMD ["node", "apps/backend/dist/src/main.js"]
