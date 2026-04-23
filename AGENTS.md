# Agent Context

Monorepo for a B2B multi-tenant equipment rental platform with frontend and backend apps plus shared workspace packages.

Use `pnpm` workspaces.

Workspace commands:

- `pnpm build`
- `pnpm lint`

Prefer app-local commands when working inside a single app. Use workspace commands for cross-workspace changes.

Top-level structure:

- `apps/` contains runnable applications.
- `packages/` contains shared contracts, schemas, types, and other reusable workspace packages.

When working inside an app, follow that app's local `AGENTS.md` for package-specific guidance:

- `apps/backend/AGENTS.md`
- `apps/web/AGENTS.md`

Use nearby package code and config as the source of truth for package-specific conventions and commands.
