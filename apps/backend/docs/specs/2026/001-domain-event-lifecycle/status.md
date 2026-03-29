# Domain Event Lifecycle Status

## Status

Implemented

## Owner

Backend

## Created

2026-03-28

## Updated

2026-03-28

## Spec

- `docs/specs/2026/001-domain-event-lifecycle/spec.md`

## Blueprint

- `docs/specs/2026/001-domain-event-lifecycle/blueprint.md`

## Current State

- Architecture and domain-event rule docs were updated to align on:
  - post-commit domain events
  - public module events
  - `@nestjs/event-emitter` as the in-process transport
- `TenantRegisteredEvent` is intentionally treated as a public module event
- Core domain event primitives, shared publisher infrastructure, and `PrismaUnitOfWork` integration are implemented
- Tenant registration now records and publishes `TenantRegisteredEvent` through the post-commit flow
- Successful domain event publication is tracked through canonical request logging instead of per-event success log lines
- Targeted unit tests pass and backend build/lint succeed

## Confirmed Decisions

- Domain events are recorded by aggregate roots
- `PrismaUnitOfWork` is the standard command-side publication path
- Application services explicitly call `events.collectFrom(aggregate)` after persistence
- Application services must not manually publish domain events
- Events are published sequentially in collection order
- Publication fails fast on the first publish error
- Every event has explicit `eventName`
- `TenantRegisteredEvent` is a public module event
- `Tenant.create(...)` records `TenantRegisteredEvent`
- `bootstrapTenantAdmin` remains synchronous and transactional
- In-process publication is acceptable in v1
- Successful event publication enriches canonical request logs
- Explicit event logs are reserved for publish and handler failures
- Outbox is deferred

## Open Items

- Decide whether to add a small docs index under `docs/specs/` later
- Add future handlers as new module boundaries start reacting to public module events

## Next Step

- Use the new primitives for future event-producing command flows
- Add public event consumers only through explicit module boundaries

## Implementation Notes

To be filled during implementation.

## Doc Sync Checklist

Before implementation:

- [x] spec reviewed
- [x] blueprint reviewed
- [x] status reviewed

During implementation:

- [x] update spec if feature behavior changes
- [x] update blueprint if technical design changes
- [x] update status with discoveries/blockers

Before merge:

- [ ] docs reflect actual implementation
- [ ] `docs/agent-rules/` updated if new durable rules emerged
- [ ] ADR added if a durable architectural decision was made
