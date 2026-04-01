# Agent Context

## Project Scope

This file applies only to `apps/web/`.

The web app is a TanStack Start application built with:

- React 19
- TanStack Start
- TanStack Router
- TanStack Query
- Vite
- Vitest
- Biome
- Tailwind CSS v4
- Zod

Run commands from `apps/web/` unless there is a clear reason to do otherwise.

## Working Model

- Treat this as a frontend application with route-driven UI, server functions, and shared client/server TypeScript.
- Prefer matching the surrounding feature structure over introducing a new architecture.
- Keep changes minimal and local.
- Do not apply backend NestJS conventions here.
- Do not edit generated files unless the task explicitly requires it.

## Important Paths

- `src/routes/` - TanStack Start route files
- `src/features/` - feature-level UI, queries, schemas, hooks, and server functions
- `src/components/ui/` - shared UI primitives
- `src/components/` - app-level reusable components
- `src/shared/` - shared hooks, utilities, contexts, and errors
- `src/lib/` - app infrastructure helpers such as API and date helpers
- `src/integrations/` - framework integrations such as TanStack Query
- `src/routeTree.gen.ts` - generated route tree, do not hand-edit

## Source Of Truth

Use local config and nearby code as the primary source of truth:

- `package.json` for available commands
- `biome.json` for formatting, linting, and import organization
- `tsconfig.json` for aliases and compiler behavior
- `vite.config.ts` for runtime/build setup
- nearby route, feature, and component files for naming and structure

There is a local Cursor rule in `.cursorrules`:

- For new shadcn components, use the latest CLI form: `pnpm dlx shadcn@latest add <component>`

No `.cursor/rules/` directory or Copilot instructions file were found for this app.

## Commands

Authoritative app commands:

- `pnpm dev` - run the Vite dev server on port 3001
- `pnpm build` - production build
- `pnpm preview` - preview the production build
- `pnpm test` - run Vitest once
- `pnpm lint` - run Biome lint
- `pnpm format` - run Biome formatter
- `pnpm check` - run Biome check
- `pnpm cf-typegen` - generate Wrangler/Cloudflare types
- `pnpm deploy` - build then deploy with Wrangler

## Single Test Commands

Use direct Vitest invocations when you need to run a single test or narrow scope.

- `pnpm vitest run src/path/to/file.test.ts`
- `pnpm vitest run src/path/to/file.spec.tsx`
- `pnpm vitest run -t "exact test name"`
- `pnpm vitest --watch src/path/to/file.test.ts`

If you need a specific test inside a file, combine both patterns:

- `pnpm vitest run src/path/to/file.test.ts -t "test name"`

When validating a change, prefer the smallest relevant command first, then broaden only if needed.

## Build And Verification Expectations

- Run `pnpm lint` for style and correctness checks on edited files.
- Run `pnpm test` or a focused Vitest command when behavior changes or tests are added.
- Run `pnpm build` when changes affect routing, server functions, config, or production behavior.
- Use `pnpm check` when you want formatting, linting, and import organization verified together by Biome.

## Formatting Rules

These come from `biome.json` and the current codebase:

- Use tabs for indentation.
- Use double quotes in JavaScript and TypeScript.
- Let Biome organize imports instead of hand-formatting them.
- Do not manually reformat generated files.
- `src/routeTree.gen.ts` is generated and excluded from normal editing.
- `src/styles.css` is excluded from Biome formatting in this app.

## Import Conventions

- Prefer the app alias `@/` for imports from `src/`.
- Use workspace package imports like `@repo/schemas`, `@repo/types`, and other `@repo/*` packages for shared contracts.
- Use `import type` for type-only imports.
- Use relative imports for very local neighbors when that is already the local pattern, especially generated files like `./routeTree.gen`.
- Do not introduce deep relative paths when an alias import is clearer.
- Let Biome normalize import ordering.

## TypeScript Rules

The app inherits strict TypeScript settings from `@repo/typescript-config/base.json`.

- Preserve strict typing.
- Prefer concrete domain types over loose records or `unknown` plumbing.
- Avoid `any`; if it is unavoidable, keep it narrow and local.
- Prefer schema-derived types such as `z.infer<typeof schema>`.
- Reuse shared DTOs and response types from `@repo/schemas` when the backend contract already exists.
- Keep helper return types obvious when inference is not clear.
- Respect path alias configuration in `tsconfig.json`.

## App Structure Conventions

- Keep route definitions in `src/routes/` and follow existing TanStack Start file naming.
- Put feature-specific queries, hooks, schemas, API helpers, and components under the relevant `src/features/<feature>/` directory.
- Keep reusable primitives in `src/components/ui/`.
- Keep cross-feature helpers in `src/shared/` or `src/lib/`, depending on whether the code is domain-shared or infrastructural.
- Put React Query query factories and hooks in `*.queries.ts` files.
- Put server function wrappers and API calls in `*.api.ts` files.
- Put Zod schemas in `*.schema.ts` files.
- Put general helpers in `*.utils.ts` files.

## Naming Conventions

- Components: PascalCase
- Hooks: `useX` or `use-x` file names with exported `useX` functions
- Query key factories: plural or feature-namespaced objects like `tenantKeys`
- Query collections: objects like `tenantQueries`
- Server functions: verb-first names such as `getCurrentTenant` or `updateTenantConfig`
- Schemas: descriptive camelCase values ending in `Schema`
- Types: PascalCase
- Constants: `SCREAMING_SNAKE_CASE` only when the surrounding code uses it; otherwise match nearby code

## React And UI Expectations

- Prefer functional components and existing React patterns in the surrounding files.
- Preserve TanStack Router and TanStack Query patterns already in use.
- Use existing UI primitives before creating new ones.
- Use `cn()` and `cva()` the same way existing UI components do.
- Keep presentational components focused on rendering.
- Keep data fetching, mutations, and server interactions in feature query/API modules rather than burying them in UI components.
- Follow the current Tailwind utility style used in the app instead of introducing a different styling approach.

## TanStack Start Patterns

- Keep route-level loading, errors, and document concerns in route files.
- Use `createServerFn` for server-side actions and reads where the current feature already uses it.
- Keep router context compatible with the existing root route and query provider setup.
- Do not manually edit generated routing artifacts to register routes.

## Error Handling

- Prefer existing error types and patterns over raw `throw new Error(...)` when a structured app error already exists.
- Use `ProblemDetailsError` for backend/API failures surfaced through `apiFetch`.
- Parse and validate boundary inputs with Zod.
- Do not silently swallow async errors.
- In route loaders and server functions, either map errors intentionally or let them bubble to the established route-level boundaries.
- Keep error messages actionable and specific.

## Data And API Rules

- Prefer `apiFetch` and related shared helpers over ad hoc `fetch` usage when calling the backend.
- Keep authentication/session behavior consistent with existing helpers in `src/lib/` and auth features.
- Reuse backend response contracts instead of reshaping them unnecessarily.
- Keep query keys stable and colocated with the feature that owns them.
- Invalidate or refresh query data intentionally after mutations.

## Editing Guardrails

- Prefer the smallest correct change.
- Match nearby file structure, naming, and patterns before abstracting.
- Avoid introducing new dependencies unless clearly necessary.
- Avoid broad refactors unless the task explicitly calls for them.
- If you touch generated or framework-sensitive files, verify with `pnpm build`.

## Before Finishing

- Re-run the smallest relevant verification command.
- If imports or formatting changed, run `pnpm check` or the relevant Biome command.
- If behavior changed, run focused Vitest coverage for the affected area when possible.
- If routing, SSR behavior, or build configuration changed, run `pnpm build`.

## Quick Summary

- Work from `apps/web/`
- Use `pnpm` scripts from this app, not backend scripts
- Use Biome for formatting, linting, and import organization
- Use `@/` alias imports and `import type` where appropriate
- Reuse `@repo/schemas` types and Zod schemas
- Keep TanStack Start, Router, and Query patterns intact
- Do not edit `src/routeTree.gen.ts`
- For new shadcn components, use `pnpm dlx shadcn@latest add <component>`
