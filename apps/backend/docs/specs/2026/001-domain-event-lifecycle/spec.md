# Domain Event Lifecycle Spec

## Status

Draft

## Owner

Backend

## Created

2026-03-28

## Updated

2026-03-28

## Title

Robust Domain Event Publishing and Listening

## Summary

This document specifies a robust, standardized domain event mechanism for the backend modular monolith.

The goal is to move from ad hoc manual event publishing to a consistent post-commit domain event lifecycle where:

- aggregate roots record domain events during state changes
- events are collected during command execution
- events are published only after successful persistence
- handlers react to committed business facts through a standardized in-process mechanism

This feature is intentionally limited to in-process domain events for the current app. It is designed to be outbox-ready later, but does not implement durable delivery in this phase.

---

## 1. Context

The architecture already defines Domain Events as meaningful business facts that:

- are recorded by aggregate roots
- are dispatched after persistence succeeds
- are used for decoupled post-commit side effects

Relevant architectural rules already exist in:

- `docs/agent-rules/architecture.md`
- `docs/agent-rules/domain-event.md`
- `docs/agent-rules/application-service.md`

However, the current codebase does not yet implement that standard consistently.

### Current state

- There is only one actual domain event in the codebase: `TenantRegisteredEvent`
- It is published manually from the application service
- There is no aggregate event recording mechanism
- There is no transaction-scoped event collection
- There is no standard post-commit publication flow
- There is no listener pattern established yet
- The code currently uses Nest CQRS `EventBus`, while the docs prescribe `@nestjs/event-emitter`

### Architectural framing

This application is a DDD modular monolith with CQRS at the application layer. Domain events are a supporting architectural mechanism for post-commit reactions, not the primary execution model of the system.

---

## 2. Problem Statement

The current implementation has the following issues:

- domain event publication is manual and easy to forget
- publication responsibility sits in the wrong layer
- command-side services can diverge into inconsistent patterns
- there is no reusable event collection mechanism
- there is no guaranteed post-commit publication standard
- code and architectural docs disagree on the event mechanism to use
- the current system does not provide a stable foundation for future domain event adoption

Without standardization, future domain events will likely be implemented inconsistently, increasing coupling, lowering reliability, and making architectural rules harder to enforce.

---

## 3. Goals

This feature must:

- standardize domain event recording at the aggregate root level
- standardize domain event publication after successful persistence
- remove manual domain event publishing from application services
- provide a reusable transaction-scoped collection mechanism
- provide a single infrastructure abstraction for dispatching events
- use one in-process event transport consistently across the app
- define a standard event handler pattern
- support multiple domain events raised during one command execution
- remain compatible with module boundaries and public contracts
- be outbox-ready in design without implementing outbox yet

---

## 4. Non-Goals

This feature does not include:

- distributed event brokers
- Kafka, RabbitMQ, SNS/SQS, or similar infrastructure
- event sourcing
- replacing synchronous application flows with events by default
- generic pub/sub for arbitrary technical notifications
- transactional outbox implementation in this phase
- durable retries or replay workers in this phase
- migration of every existing command to emit events immediately

---

## 5. Architectural Decision

The system will use in-process post-commit domain events.

### Chosen approach

- aggregate roots record domain events internally
- command-side transaction execution collects those events explicitly in the application service
- events are published only after the transaction commits successfully
- handlers react after commit through Nest event listeners
- the transport implementation will use `@nestjs/event-emitter`
- the application and domain layers will depend only on a custom publisher abstraction, not directly on EventEmitter2

### Why this approach

This approach best matches the current architecture because it:

- aligns with the documented rules already present in the repo
- supports modular monolith boundaries cleanly
- keeps the domain pure
- preserves transactional correctness
- avoids premature distributed infrastructure
- creates a clean migration path to an outbox later

---

## 6. High-Level Design

### Target event lifecycle

```text
Controller
  -> CommandBus
  -> Application Service
  -> PrismaUnitOfWork.runInTransaction(...)
       -> load aggregate(s)
       -> aggregate method mutates state
       -> aggregate records domain event(s)
       -> repository persists aggregate(s)
       -> application service calls events.collectFrom(aggregate)
  -> transaction commits successfully
  -> DomainEventPublisher publishes collected events in order
  -> event handlers react
  -> handlers dispatch commands or call public facades if needed
```

### Key rule

A domain event that represents a business fact must only be published once the corresponding state change is successfully persisted.

---

## 7. Core Patterns

### 7.1 Aggregate-Recorded Events

Aggregate roots are responsible for recording domain events during domain state transitions.

Rules:

- only aggregate roots may record domain events
- events are recorded after the state change in the aggregate
- aggregates never publish events directly
- aggregates never depend on NestJS, EventEmitter2, or CQRS event infrastructure

### 7.2 Transaction-Scoped Event Collection

During a command execution, recorded domain events must be collected into a transaction-scoped event collector.

Rules:

- one collector per unit-of-work execution
- collectors gather events from one or more aggregates
- collection is explicit in the application service after persistence
- publication does not happen inside the transaction

### 7.3 Post-Commit Publication

After the transaction completes successfully, the system publishes the collected events in order.

Rules:

- no publish before commit
- no publish on transaction failure
- events are published sequentially in collection order
- publication fails fast on the first publish error
- no rollback is attempted after commit
- event publication is infrastructure responsibility, not application service responsibility

### 7.4 Thin Event Handlers

Handlers exist to react to committed business facts.

Rules:

- one handler per reaction
- handlers should be small and explicit
- handlers should dispatch a command or call a public facade when business work is needed
- handlers should not contain rich business logic
- handlers must log failures through the app logging stack and avoid corrupting the original request path
- from the request perspective, handlers are best-effort post-commit reactions
- handlers should be designed to be idempotency-ready

---

## 8. Proposed Components

The following components will be introduced or updated.

### 8.1 Core domain event contract

Suggested location:

- `src/core/domain/events/domain-event.ts`

Responsibility:

- define the standard event shape / metadata contract

### 8.2 Aggregate root base

Suggested location:

- `src/core/domain/aggregate-root.base.ts`

Responsibility:

- hold in-memory recorded domain events
- provide `recordDomainEvent(...)`
- provide `pullDomainEvents()`

### 8.3 Domain events collector

Suggested location:

- `src/core/domain/events/domain-events.collector.ts`

Responsibility:

- collect domain events during one transaction
- drain them after commit

### 8.4 In-memory collector implementation

Suggested location:

- `src/core/domain/events/in-memory-domain-events.collector.ts`

Responsibility:

- concrete collector for the current in-process implementation

### 8.5 Domain event publisher abstraction

Suggested location:

- `src/core/domain/events/domain-event.publisher.ts`

Responsibility:

- abstract event dispatch away from EventEmitter2 specifics

### 8.6 EventEmitter-backed publisher

Suggested location:

- `src/core/domain/events/event-emitter-domain-event.publisher.ts`

Responsibility:

- implement the publisher using `@nestjs/event-emitter`

### 8.6.1 Shared provider wiring

Suggested location:

- `src/core/domain/events/domain-events.module.ts`

Responsibility:

- register `DomainEventPublisher` as a shared core provider
- expose the EventEmitter-backed implementation for use by `PrismaUnitOfWork` and future handlers

### 8.7 Prisma unit of work enhancement

Existing location:

- `src/core/database/prisma-unit-of-work.ts`

Responsibility:

- create transaction scope
- create per-transaction collector
- expose transaction context
- publish events only after successful commit

---

## 9. Event Contract Requirements

Every domain event must be immutable and serializable.

### Required fields

- `eventId`
- `eventName`
- `aggregateId`
- `aggregateType`
- `occurredAt`

### Required when applicable

- `tenantId`

### Optional metadata

- `correlationId`
- `causationId`
- `version`
- additional event-specific primitive payload fields

### Event content rules

- payload must contain IDs and simple values, not entities
- `eventName` is explicit on every event and must not be derived implicitly from `constructor.name`
- event names must be past tense
- event classes must contain no behavior
- event classes must remain domain concepts, not transport wrappers

---

## 10. Aggregate Rules

Aggregate roots are the only place where domain events originate.

Requirements:

- aggregate methods may call `recordDomainEvent(...)`
- recording must happen after state mutation
- aggregate reconstitution from persistence must not re-record historical events
- aggregate event queues must be drainable
- draining events must avoid duplicate publication in the same command flow

Aggregates must not:

- inject infrastructure
- publish events directly
- depend on Nest classes
- depend on Prisma
- depend on `EventBus` or `EventEmitter2`

---

## 11. Application Service Rules

Application Services remain orchestration-only.

Requirements:

- load aggregates
- invoke domain behavior
- persist through repositories
- execute in a transaction when domain events are involved
- explicitly call `events.collectFrom(aggregate)` after successful aggregate persistence
- rely on unit of work for post-commit publication

Application services must not:

- manually call `eventBus.publish(...)`
- manually call `eventEmitter.emit(...)`
- manually decide publication timing for domain events

Standard command-side rule:

- commands that mutate state and produce domain events should use `PrismaUnitOfWork` as the standard execution path
- commands that do not use `PrismaUnitOfWork` must not emit domain events during the rollout to this pattern

---

## 12. Repository Rules

Repositories remain responsible for aggregate persistence.

Requirements:

- save/load aggregates
- use mappers normally
- participate in transaction execution

Repositories must not:

- publish events directly
- collect events implicitly as part of the standard pattern
- own post-commit timing decisions
- embed event transport logic

---

## 13. Unit of Work Rules

`PrismaUnitOfWork` becomes the standard command-side orchestration mechanism for robust domain event publication.

Responsibilities:

- open the transaction
- create the per-transaction event collector
- provide transaction context to the command flow
- ensure no domain events publish if the transaction fails
- publish collected events after successful commit

### Semantics

If transaction fails:

- state change is rolled back
- no domain events are published

If transaction succeeds and publish fails:

- state change remains committed
- publication happens sequentially in collection order
- publication stops at the first publish error
- failure is operational, not transactional
- no rollback is attempted
- failure must be logged with event metadata

---

## 14. Handler Rules

Handlers will be implemented using `@OnEvent(...)`.

Requirements:

- one handler per reaction
- use `@nestjs/event-emitter`
- explicitly catch and log failures
- remain thin
- invoke application-layer entrypoints for follow-up work

Preferred reaction style:

- `Command -> Event -> Command`
- `Command -> Event -> Public Facade`

Handlers must not:

- perform core domain logic inline
- bypass application-layer orchestration for significant business work
- reach into another module's private internals

---

## 15. Module Boundary Rules

Domain events must respect bounded context boundaries.

### Private domain events

Domain events are private to the producing module unless intentionally exposed otherwise.

### Cross-module reactions

If another module must react:

- the handler must depend on the producing module's public contract
- cross-module logic must not import private module internals
- private domain events should not automatically become public integration contracts

### Public event reuse rule

One event class may serve as both the recorded domain event and the public module event only when all of the following are true:

- the same business fact is what both internal and cross-module consumers need
- no internal-only payload must be hidden from consumers
- the event is intentionally exposed from the producing module's public surface

If those conditions are not true, use separate internal and public event contracts.

For this feature, `TenantRegisteredEvent` is intentionally treated as a public module event.

---

## 16. Failure Semantics

### 16.1 Transaction failure

If persistence fails:

- no event must be published
- no handler must run

### 16.2 Publish failure after commit

If persistence succeeds but publication fails:

- committed state stays committed
- publication stops at the failing event
- later collected events are not published in that attempt
- no rollback is attempted
- this is treated as an operational failure
- logs must include enough metadata to diagnose the failure

### 16.3 Handler failure

If a handler fails:

- the original write remains committed
- the request must not be corrupted
- the failure is logged
- future outbox/replay support may address missed follow-up work

---

## 17. Edge Cases

The implementation must explicitly consider the following cases.

### Multiple aggregates changed in one command

- all events from all aggregates must be collected
- all events publish only after commit

### Multiple events from one aggregate

- publication must preserve recording order

### Aggregate saved multiple times in one transaction

- event draining must avoid duplicate collection from the same recorded event set

### Command without explicit transaction today

- commands that emit domain events should migrate to unit-of-work execution
- direct publication is not the standard for domain events in this design

### Handler throws exception

- error must be logged
- committed state remains valid
- original request must not be invalidated

### Crash after commit before in-process publish

- accepted limitation in v1
- this is the primary reason the design remains outbox-ready

### Cross-module reaction requires business action

- handler must dispatch command or call public facade
- it must not directly execute another module's internals

---

## 18. Impact on Current System

### 18.1 Tenant registration flow

Current file:

- `src/modules/tenant/application/commands/register-tenant/register-tenant.service.ts`

Changes expected:

- remove manual event publishing
- move event origin to the `Tenant` aggregate
- use standardized post-commit publication flow

### 18.2 Tenant aggregate

Current file:

- `src/modules/tenant/domain/entities/tenant.entity.ts`

Changes expected:

- allow tenant aggregate to record domain events
- record `TenantRegisteredEvent` in `Tenant.create(...)`

### 18.3 Existing event class

Current file:

- `src/modules/tenant/public/events/tenant-registered.event.ts`

Changes expected:

- align with standard event metadata contract
- serve as the public module event contract

### 18.4 Application bootstrap

Current file:

- `src/app.module.ts`

Changes expected:

- wire in `EventEmitterModule`
- import the shared domain-events module that provides `DomainEventPublisher`

### 18.5 Documentation

Expected updates:

- `docs/agent-rules/architecture.md`
- `docs/agent-rules/domain-event.md`

---

## 19. Rollout Strategy

Implementation should happen incrementally.

### Phase 1: Core primitives

Introduce:

- aggregate root base
- event contract
- collector contract and implementation
- publisher abstraction
- EventEmitter-backed publisher

### Phase 2: Unit of work integration

Enhance:

- `PrismaUnitOfWork`

Add support for:

- transaction-scoped event collection
- post-commit publication

### Phase 3: Reference migration

Migrate the tenant registration flow as the first end-to-end example.

### Phase 4: Listener introduction

Add first real event handlers using the standard reaction style.

### Phase 5: Documentation alignment

Update architecture docs so code and guidance match.

### Phase 6: Gradual adoption

Use the pattern for future domain events and migrate existing command flows as needed.

---

## 20. Testing Strategy

### 20.1 Unit tests

Test aggregate behavior:

- event is recorded when state transition happens
- no event recorded on invalid transition
- recorded events drain correctly
- reconstituted aggregates do not re-emit historical events

### 20.2 Unit tests for unit of work

Test that:

- events publish only after successful transaction
- events do not publish if transaction throws
- multiple events are published in collected order
- drained collectors do not republish stale events

### 20.3 Repository tests

Test that:

- repositories persist aggregates correctly
- repositories do not own event publication behavior

### 20.4 Integration tests

Test end-to-end flow:

- command persists state
- event publishes after commit
- handlers react successfully
- handler failure does not roll back original write

### 20.5 Boundary tests

Test that:

- handlers use public contracts for cross-module work
- no private module internals leak into cross-module reactions

### 20.6 Observability tests

Test that failure logs contain:

- eventName
- eventId
- aggregateId
- aggregateType
- tenantId when applicable
- handler name for handler failures

---

## 21. Acceptance Criteria

This feature is complete when all of the following are true:

- aggregate roots can record domain events without infrastructure dependencies
- command-side application services no longer publish domain events manually
- application services explicitly collect recorded events after successful aggregate persistence
- domain events are published only after successful persistence
- no domain events are published if the transaction fails
- collected events are published sequentially in collection order
- publisher failures stop publication, are logged with event metadata, and do not roll back committed state
- the publishing mechanism is abstracted behind a custom publisher contract
- the in-process implementation uses `@nestjs/event-emitter`
- event handlers can react through `@OnEvent(...)`
- handler failures are logged and do not corrupt the original committed request
- the tenant registration flow is migrated to the new pattern
- architectural docs are updated to match the implementation
- the design remains outbox-ready for future durability needs

---

## 22. Risks

- increased plumbing in command-side execution
- application services must remember to collect events explicitly after persistence
- inconsistent adoption could reintroduce partial manual patterns during rollout
- in-process publication remains non-durable in crash scenarios
- teams may overuse events for flows that should remain synchronous

---

## 23. Deferred Decisions

The following are intentionally deferred:

- transactional outbox implementation
- durable retry workers
- handler execution tracking tables
- replay tooling
- dead-letter handling
- whether to model separate internal and public event classes for public events beyond the cases that clearly need them

---

## 24. Future Evolution

The design should support a later transition toward:

- transactional outbox for must-not-lose side effects
- durable handler execution tracking
- replay/recovery tooling
- clearer distinction between:
  - private domain events
  - public module events
  - integration events

This future evolution should not require rewriting aggregate behavior or application service orchestration. It should only require extending the publication mechanism and operational tooling.

---

## 25. Appendix: Example Reference Flow

### Tenant registration target flow

```text
RegisterTenantCommand
  -> RegisterTenantService
  -> PrismaUnitOfWork.runInTransaction(...)
       -> Tenant.create(...)
            -> Tenant records TenantRegisteredEvent
       -> TenantRepository.save(tenant)
       -> events.collectFrom(tenant)
       -> UsersPublicApi.bootstrapTenantAdmin(...)
  -> transaction commits
  -> DomainEventPublisher publishes TenantRegisteredEvent
  -> handlers react
```

### Important note

`bootstrapTenantAdmin` remains part of the command transaction and is not moved into an event handler because it is required correctness, not a post-commit side effect.

---

## 26. Final Policy Statement

This feature standardizes post-commit domain events.

For this application:

- domain events represent committed business facts
- aggregate roots record them
- unit of work is the standard command-side publication path
- application services explicitly collect them after persistence
- handlers react after commit
- in-process dispatch is acceptable in v1
- outbox remains the future durability path when required
