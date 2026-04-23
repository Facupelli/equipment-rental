# Agent Context

`@repo/schemas` contains shared Zod schemas and API contract definitions consumed across the monorepo.

Run commands from `packages/schemas/`.

Common commands:

- `pnpm build`
- `pnpm lint`

Use `../docs/agent-rules/shared-packages.md` for shared-package rules.

Package-specific expectations:

- Prefer schema changes that stay aligned with existing backend and web contracts.
- Reuse existing schema composition patterns before introducing a new shape.
- Update `src/index.ts` exports when adding a new public schema.
- Do not edit `dist/` by hand.

Representative examples:

- public export surface: `src/index.ts`
- response schema: `src/order/get-order-by-id-response.schema.ts`
- nested feature schema: `src/tenant/location/location.schema.ts`
