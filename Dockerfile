# =============================================================================
# Stage 1 — base
# Shared foundation pinned to exact Node + pnpm versions.
# Every subsequent stage inherits from this, keeping things DRY.
# =============================================================================
FROM node:20-alpine AS base

RUN apk update && apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# =============================================================================
# Stage 2 — pruner
# This is the key stage that makes turbo prune valuable.
#
# `turbo prune @repo/backend --docker` statically analyses the workspace
# dependency graph and outputs two directories:
#
#   out/json/ — only the package.json files for @repo/backend and its deps.
#               Used in the next stage to install dependencies in a cached
#               layer that is NOT busted by source code changes.
#
#   out/full/ — the full source of only the packages @repo/backend needs.
#               Changes to unrelated apps (e.g. a frontend) do NOT appear
#               here, so they cannot bust the Docker cache for this image.
#
#   out/pnpm-lock.yaml — a pruned lockfile containing only the subset of
#               dependencies actually needed by the target package.
#
# Without this stage, any change to the root lockfile (e.g. adding a package
# to an unrelated app) would bust the install cache and force a full
# `pnpm install` on every deploy.
# =============================================================================
FROM base AS pruner

# turbo must be available before packages are installed — install it globally.
# Pin to the same major version as in your root devDependencies.
RUN pnpm install -g turbo@latest

COPY . .

RUN turbo prune @repo/backend --docker

# =============================================================================
# Stage 3 — installer
# Install dependencies using the pruned lockfile and package.json files.
#
# The two-copy pattern is the heart of the caching strategy:
#   COPY out/json/  → only package.json files   → cache layer A
#   RUN pnpm install                             → cache layer B (expensive)
#   COPY out/full/  → source files               → cache layer C
#
# Docker only re-runs a layer when the files copied into it change.
# Layer B (pnpm install) is only re-run when a package.json or the pruned
# lockfile changes — NOT when source files change. This is the key speedup.
# =============================================================================
FROM base AS installer

# Copy the pruned lockfile and workspace manifest first
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy only the package.json files (no source yet) — this is cache layer A
COPY --from=pruner /app/out/json/ .

# Install all dependencies (dev included — needed for nest build, prisma generate)
# This layer is cached until a package.json or the lockfile changes
RUN pnpm install --frozen-lockfile

# Now copy the pruned source — this busts cache only when relevant source changes
COPY --from=pruner /app/out/full/ .

# Build all workspace packages @repo/backend depends on, then the backend itself.
# turbo.json's "dependsOn": ["^build"] ensures correct build order.
RUN pnpm turbo run build --filter=@repo/backend

# Generate the Prisma client into src/generated/prisma (as per your schema config).
# Runs after nest build because Prisma needs the compiled output path to exist.
RUN cd apps/backend && pnpm exec prisma generate

# =============================================================================
# Stage 4 — production
# Lean final image: re-install only production deps, copy compiled output.
# No TypeScript, no Jest, no ESLint, no source files in the final image.
# =============================================================================
FROM base AS production

ENV NODE_ENV=production

# Copy the pruned lockfile and manifests for a clean production install
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

# Install ONLY production dependencies — no devDeps in the final image
RUN pnpm install --frozen-lockfile --prod

# Copy the compiled NestJS output from the installer stage
COPY --from=installer /app/apps/backend/dist ./apps/backend/dist

# Copy the generated Prisma client
COPY --from=installer /app/apps/backend/src/generated ./apps/backend/src/generated

# Copy Prisma schema + migrations — prisma migrate deploy reads these at runtime
COPY --from=installer /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=installer /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# Railway injects PORT at runtime; fallback to 3000 for local docker runs
EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
