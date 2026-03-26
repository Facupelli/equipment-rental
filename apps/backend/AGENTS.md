# Agent Context

## Project

Backend for a B2B multi-tenant equipment rental SaaS.

Tech stack:

- NestJS
- Prisma
- PostgreSQL
- TypeScript

Architectural style:

- Modular monolith
- DDD / Hexagonal / Clean Architecture influences
- CQRS at the application layer

## Source Of Truth

Use `docs/agent-rules/` as the source of truth for implementation rules, invariants, and examples.

Use `docs/system-explanations/` for subsystem behavior and architecture references when working in a specific area of the product.

`AGENTS.md` is only an entrypoint and routing guide. Do not duplicate detailed rules here if they already exist in `docs/agent-rules/`.

## Important Areas

- `src/modules/` - business modules / bounded contexts
- `src/core/` - shared backend primitives and cross-cutting concerns
- `src/config/` - application configuration
- `prisma/` - Prisma schema and migrations
- `docs/agent-rules/` - task-specific engineering guidance
- `docs/system-explanations/` - subsystem behavior and architecture references

## Architectural Boundaries

- Treat modules as bounded contexts.
- Do not couple modules through private internals.
- Prefer explicit public module entrypoints and approved cross-module patterns.
- Keep domain code free of NestJS, Prisma, HTTP, and transport concerns.
- Keep business rules in domain objects or domain services, not in controllers or infrastructure.
- Commands mutate state; queries read state.
- Controllers are thin transport adapters.
- Mappers translate between persistence models and domain models.
- Follow existing naming and structural conventions in the surrounding module.

## Authoritative Commands

Run from `apps/backend/` unless there is a clear reason to run from the workspace root.

Backend commands:

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`

Workspace commands:

- `pnpm build`
- `pnpm lint`

## Documentation Loading Rules

Always load:

- `docs/agent-rules/architecture.md`

Load additionally based on the artifact being changed:

- Entity / aggregate work -> `docs/agent-rules/entity.md`
- Value object work -> `docs/agent-rules/value-object.md`
- Domain service work -> `docs/agent-rules/domain-service.md`
- Domain event work -> `docs/agent-rules/domain-event.md`
- Domain error work -> `docs/agent-rules/domain-error.md`
- Application service work -> `docs/agent-rules/application-service.md`
- Command / command handler work -> `docs/agent-rules/command.md`
- Query / query handler work -> `docs/agent-rules/query.md`
- Controller work -> `docs/agent-rules/controller.md`
- Request DTO work -> `docs/agent-rules/request-dto.md`
- Response DTO work -> `docs/agent-rules/response-dto.md`
- Mapper / persistence translation work -> `docs/agent-rules/mapper.md`
- Repository work -> `docs/agent-rules/repository.md`

If a task touches multiple artifact types, load all relevant documents before making changes.

Load subsystem references when relevant:

- Product / asset / bundle / order / availability / pricing domain work -> `docs/system-explanations/rental-domain-model.md`
- Tenant resolution / hostname-derived tenant context -> `docs/system-explanations/tenant-context-resolution.md`
- Coupon / discount behavior -> `docs/system-explanations/coupon-discount-system.md`
- User / customer authentication and authorization -> `docs/system-explanations/user-customer-auth.md`

## Working Expectations

Before changing code:

1. Identify which artifact types are involved.
2. Load `docs/agent-rules/architecture.md` first.
3. Load every additional relevant rule document for the task.
4. Preserve module boundaries and existing patterns.
5. Prefer consistency with nearby code over introducing a new pattern.
6. If guidance conflicts, follow the more specific artifact rule over the general one while keeping architecture constraints intact.
