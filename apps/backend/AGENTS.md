# Agent Context

Backend for a B2B multi-tenant equipment rental SaaS built with NestJS, Prisma, PostgreSQL, and TypeScript.

Run commands from `apps/backend/` unless there is a clear reason to run from the workspace root.

Use `pnpm`.

Common backend commands:

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`

Workspace commands:

- `pnpm build`
- `pnpm lint`

Use `docs/agent-rules/` as the source of truth for implementation rules, invariants, and examples.

Always start with `docs/agent-rules/architecture.md`, then load any additional artifact-specific rule documents from `docs/agent-rules/` as needed for the code you are changing.

Use `docs/system-explanations/` for subsystem behavior and architecture references when working in a specific area of the product.

`AGENTS.md` is only an entrypoint and routing guide. Do not duplicate detailed rules here if they already exist in the docs.
