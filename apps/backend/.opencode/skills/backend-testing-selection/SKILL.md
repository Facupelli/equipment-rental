---
name: backend-testing-selection
description: >
  Helps choose the smallest effective backend verification command for a change.
  Use this skill when backend work is done and you need to decide how to validate it.
---

# Backend Testing Selection

Choose the smallest command that still gives confidence.

## Selection guide

- Domain-only change -> focused unit tests first
- Controller, repository, Prisma, or transaction change -> integration tests
- DI wiring, public contract, or compile-sensitive change -> `pnpm build`
- Broad behavior change across multiple modules -> combine targeted tests with build verification

## Important rule

If a change touched shared packages, treat validation as cross-workspace and broaden beyond a narrow backend-only unit test.

## Repository anchors

- domain spec example: `src/modules/order/domain/entities/order.entity.spec.ts`
- service spec example: `src/modules/order/application/commands/create-order/create-order.service.spec.ts`
- integration spec example: `src/modules/order/application/commands/order-lifecycle.http.int-spec.ts`
