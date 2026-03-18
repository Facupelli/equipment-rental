# =============================================================================
# Stage 1 — base
# Shared foundation pinned to exact Node + pnpm versions.
# =============================================================================
FROM node:20-alpine AS base

RUN apk update && apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# =============================================================================
# Stage 2 — pruner
# Runs turbo prune to produce a minimal subset of the monorepo containing only
# the packages @repo/backend depends on.
#
# Outputs:
#   out/json/           — package.json files only (for install cache layer)
#   out/full/           — full source of relevant packages only
#   out/pnpm-lock.yaml  — pruned lockfile
# =============================================================================
FROM base AS pruner

# npm is always available in the node image and has no corepack conflicts.
RUN npm install -g turbo

COPY . .

RUN turbo prune @repo/backend --docker

# =============================================================================
# Stage 3 — builder
# Installs all dependencies, generates Prisma client, builds the app, then
# prunes devDependencies in place.
#
# Key insight: instead of surgically copying dist/ across stages (which is
# fragile and cache-prone), we build everything here and then strip devDeps
# with `pnpm prune --prod`. The runner stage copies the entire /app directory.
# =============================================================================
FROM base AS builder

# Copy pruned lockfile and workspace manifest
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy only package.json files first — install cache layer.
# pnpm install only re-runs when a package.json or the lockfile changes.
COPY --from=pruner /app/out/json/ .

RUN pnpm install --frozen-lockfile

# Copy full source — this layer busts on source changes only
COPY --from=pruner /app/out/full/ .

# Generate Prisma client BEFORE nest build.
# TypeScript needs the generated types at compile time.
RUN cd apps/backend && pnpm exec prisma generate

# Build all packages @repo/backend depends on, then the backend itself.
RUN pnpm turbo run build --filter=@repo/backend --no-cache

# Strip devDependencies in place.
# This is safer than re-running pnpm install --prod in a new stage because
# it operates on the same node_modules that was used for the build —
# no risk of missing a package that was incorrectly categorised.
RUN pnpm prune --prod --no-optional

# =============================================================================
# Stage 4 — runner
# Minimal final image. Copies the entire /app from builder — node_modules is
# already prod-only thanks to `pnpm prune --prod` above.
# No source files, no devDeps, no TypeScript toolchain.
# =============================================================================
FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app .

# Railway injects PORT at runtime; fallback to 3000 for local docker runs
EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
