# Based on: https://www.bstefanski.com/blog/turborepo-nestjs-prisma-dockerfile
# Adapted for @repo/backend with pnpm@11, Prisma v7, prisma.config.ts
#
# Using node:22.22.2-bookworm-slim (Debian slim) instead of Alpine:
# - glibc compatibility avoids native dep rebuild issues (bcrypt, prisma binaries)
# - no musl libc workarounds needed (libc6-compat, openssl patches)

# =============================================================================
# Stage 1 — base
# =============================================================================
FROM node:22.22.2-bookworm-slim@sha256:99ffed458747321024eb2d8926e4d3d7a799a6d13ea193913f54cec60009bf09 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/* && \
    corepack enable && \
    corepack prepare pnpm@11.0.9 --activate && \
    npm install -g turbo

# =============================================================================
# Stage 2 — builder
# =============================================================================
FROM base AS builder

WORKDIR /app

COPY . .

RUN turbo prune @repo/backend --docker

# =============================================================================
# Stage 3 — installer
# =============================================================================
FROM base AS installer

WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=s/534fd412-2c53-4a77-b9bc-08d35379ad52-pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

WORKDIR /app/apps/backend
RUN pnpm exec prisma generate

WORKDIR /app
RUN turbo run build --filter=@repo/backend --no-cache

# =============================================================================
# Stage 4 — runner
# =============================================================================
FROM node:22.22.2-bookworm-slim@sha256:99ffed458747321024eb2d8926e4d3d7a799a6d13ea193913f54cec60009bf09 AS runner

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/* && \
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

EXPOSE 3000

CMD ["node", "apps/backend/dist/src/main.js"]
