---
name: backend-use-case-implementation
description: >
  Guides implementation of a backend use case in the NestJS app. Use this skill when
  adding or changing a command, query, application service, controller, DTO, mapper,
  or repository in `apps/backend/`.
---

# Backend Use Case Implementation

Use this skill for normal backend feature work that needs to fit the existing module and use-case structure.

## Workflow

1. Read `docs/agent-rules/architecture.md` first.
2. Identify the artifact types involved and load the matching docs from `docs/agent-rules/`.
3. Check whether the change crosses module boundaries. If it does, use only public contracts.
4. Prefer the smallest use-case-shaped change that matches nearby code.
5. Validate with the smallest relevant backend command from `docs/agent-rules/testing.md`.

## Design checks

- One state-changing use case should map cleanly to one command, one application service, and one controller.
- One read use case should map cleanly to one query and one query handler.
- Commands and DTOs stay separate.
- Business rules stay in domain entities or domain services, not in controllers or Prisma code.

## Repository anchors

- `src/modules/order/application/commands/create-order/`
- `src/modules/order/application/queries/get-order-by-id/`
- `src/modules/tenant/location/application/commands/create-location/`
