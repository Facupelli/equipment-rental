---
name: prisma-domain-change-safely
description: >
  Guides backend changes that cross Prisma schema, mappers, repositories, and domain
  entities. Use this skill when a change affects persistence shape and domain shape together.
---

# Prisma To Domain Change Safety

Use this skill when a backend change crosses persistence and domain boundaries.

## Workflow

1. Load `docs/agent-rules/architecture.md`, `repository.md`, `mapper.md`, and the relevant entity or value-object docs.
2. Identify the true source of change:
   - Prisma persistence model
   - domain entity or value object
   - repository load/save path
   - external DTO or shared package contract
3. Update the mapper paths deliberately. Do not let persistence details leak through public contracts by accident.
4. Check whether any change also affects `@repo/types` or `@repo/schemas`.
5. Validate with integration tests or build verification, not only unit tests.

## Safety checks

- Domain invariants still live in the domain layer.
- Persistence-only fields do not accidentally become domain concepts.
- Public DTOs and shared schemas only change when the external contract truly changed.
- Generated outputs are not hand-edited.

## Repository anchors

- `prisma/schema.prisma`
- `src/modules/tenant/location/infrastructure/persistence/mappers/location.mapper.ts`
- `src/modules/order/domain/entities/order.entity.ts`
