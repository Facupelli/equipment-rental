# Agent Context

## Project

B2B SaaS for equipment rental. Multi-tenant. NestJS + Prisma + PostgreSQL.
Active development phase. Modular monolith with Onion / Pragmatic DDD architecture.

## Rules

Load the relevant rule files before starting any task:

- `rules/multi-tenancy.md` — **Always load this first, no exceptions**
- `rules/architecture.md` — When creating/modifying modules, services, or layer boundaries
- `rules/domain.md` — When touching bookings, inventory, pricing, or bundles
- `rules/api-standards.md` — When writing controllers, DTOs, or error handling
- `rules/testing.md` — When writing or modifying any testable logic

## Workflow

Before writing any non-trivial code, follow the Spec-Driven Development process
defined in `rules/architecture.md`.
