# =============================================================================
# Stage 1 — pruner
# Generates a minimal monorepo subset for @repo/backend using turbo prune.
# This isolates only the packages and lockfile entries the backend needs.
# =============================================================================
FROM node:20-slim AS pruner

WORKDIR /app

# Enable corepack to get the exact pnpm version declared in package.json
RUN corepack enable

COPY . .

RUN pnpm dlx turbo prune @repo/backend --docker

# =============================================================================
# Stage 2 — builder
# Installs dependencies from the pruned lockfile, then builds the backend.
# Splitting the COPY of json/ and full/ lets Docker cache the install layer
# independently from source changes — a lockfile change busts the cache,
# but a source-only change skips straight to the build step.
# =============================================================================
FROM node:20-slim AS builder

WORKDIR /app

RUN corepack enable

# Install OpenSSL — required by Prisma's query engine at codegen time
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 1. Copy pruned package.json files — used to install deps in isolation
COPY --from=pruner /app/out/json/ .

# 2. Install only the deps declared in the pruned lockfile
RUN pnpm install --frozen-lockfile

# 3. Copy full pruned source
COPY --from=pruner /app/out/full/ .

# 4. Generate Prisma client (targets the schema inside apps/backend/prisma/)
RUN pnpm --filter @repo/backend exec prisma generate

# 5. Build the backend via turbo (respects dependsOn: ["^build"] for shared packages)
RUN pnpm turbo run build --filter=@repo/backend

# =============================================================================
# Stage 3 — runner
# Lean production image. Only dist/, node_modules/, and the Prisma schema
# (needed by migrate deploy at pre-deploy time) are included.
# =============================================================================
FROM node:20-slim AS runner

WORKDIR /app

RUN corepack enable

# OpenSSL is also required at runtime by Prisma's query engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy compiled output
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy Prisma schema + migrations — needed for `prisma migrate deploy`
# which runs as Railway's pre-deploy command, not at container startup
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Copy package.json so Node can resolve the package name if needed
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

CMD ["/bin/sh", "-c", "node /app/apps/backend/node_modules/.bin/prisma migrate deploy --schema=/app/apps/backend/prisma/schema.prisma && node apps/backend/dist/main"]
