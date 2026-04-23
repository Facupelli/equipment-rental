# Shared Package Rules

Shared packages define contracts and tooling used across the monorepo. Prefer small, compatibility-aware changes.

General rules:

- Prefer additive changes over breaking changes when updating shared contracts.
- Update the source package artifact rather than editing generated output in `dist/`.
- Keep package exports explicit and stable.
- Use nearby source files as the primary examples for naming and file placement.
- When changing a shared contract, think through both backend and web consumers before finalizing the shape.

Package roles:

- `@repo/types` holds shared enums and lightweight TypeScript contract types.
- `@repo/schemas` holds shared Zod schemas and response/request contract definitions.
- `@repo/typescript-config` holds shared TypeScript compiler config.
- `@repo/jest-config` holds reusable Jest configuration presets.

Validation guidance:

- For package-only changes, run the package's own build or lint command when available.
- For changes to `types` or `schemas`, also validate the affected consumer app or run workspace validation because these packages are consumed across the repo.
- Prefer workspace `pnpm build` or `pnpm lint` when a package change has likely app-level impact.

Representative examples:

- shared enum exports: `packages/types/src/enums/order.enum.ts`
- shared problem details type: `packages/types/src/problem-details.type.ts`
- shared schema entrypoint: `packages/schemas/src/index.ts`
- shared response schema shape: `packages/schemas/src/order/get-order-by-id-response.schema.ts`
