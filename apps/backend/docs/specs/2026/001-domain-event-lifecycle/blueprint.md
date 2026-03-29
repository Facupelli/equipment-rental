# Domain Event Lifecycle Blueprint

## Status

Draft

## Owner

Backend

## Created

2026-03-28

## Updated

2026-03-28

## Companion Spec

- `docs/specs/2026/001-domain-event-lifecycle/spec.md`

## Purpose

This document translates the Domain Event Lifecycle spec into a concrete implementation blueprint for this repository.

It defines:

- the exact technical pattern to implement
- the core classes and file locations
- the responsibility split between layers
- the transaction and publication sequence
- the first reference migration for tenant registration
- the testing expectations for the implementation

This document is implementation-oriented. The feature goals, scope, risks, and acceptance criteria live in `spec.md`.

---

## 1. Final Decisions

The following decisions are fixed for this implementation.

### 1.1 Event model

- domain events are recorded by aggregate roots
- domain events are published only after successful persistence
- event handlers react after commit

### 1.2 Transport

- `@nestjs/event-emitter` is the in-process transport
- application and domain code will not depend on EventEmitter2 directly
- dispatch goes through a custom `DomainEventPublisher`

### 1.3 Command-side execution path

- `PrismaUnitOfWork` is the standard command-side path for state-changing flows that produce domain events
- the unit of work owns transaction scope and post-commit publication

### 1.4 Event collection strategy

- application services explicitly call `events.collectFrom(aggregate)` after successful repository persistence
- repository-side implicit collection is not part of the standard pattern in v1

### 1.5 Public event strategy

- domain events are private by default
- `TenantRegisteredEvent` is intentionally treated as a public module event
- its contract is exposed from the tenant module public surface

### 1.6 Publish semantics

- events are published sequentially in collection order
- publication fails fast on the first publish error
- no rollback is attempted after commit
- later collected events are not published in the failing attempt

### 1.7 Event contract strategy

- every event has an explicit `eventName`
- `eventName` is not derived implicitly from `constructor.name`
- shared metadata is required from day one so the design stays outbox-ready

### 1.8 Tenant event origin

- `Tenant.create(...)` records `TenantRegisteredEvent`
- for this domain, tenant creation is treated as tenant registration in v1

### 1.9 Provider ownership

- `DomainEventPublisher` is a shared core infrastructure provider
- its EventEmitter-backed implementation is registered in `src/core/domain/events/domain-events.module.ts`
- `AppModule` imports that module

### 1.10 Durability scope

- this implementation is in-process and non-durable
- outbox/integration event support is deferred

---

## 2. Target Lifecycle

### Success path

```text
Controller
  -> CommandBus.execute(command)
  -> Application Service
  -> PrismaUnitOfWork.runInTransaction(async ({ tx, events }) => ...)
       -> load aggregate(s)
       -> invoke domain behavior
       -> aggregate(s) record domain event(s)
       -> persist aggregate(s) through repository.save(..., tx)
       -> events.collectFrom(aggregate)
       -> return application result
  -> transaction commits
  -> DomainEventPublisher.publish(drain(events))
  -> @OnEvent handlers react
  -> handlers dispatch commands or call public facades
```

### Failure path

```text
Controller
  -> CommandBus.execute(command)
  -> Application Service
  -> PrismaUnitOfWork.runInTransaction(...)
       -> persistence or domain flow fails
  -> transaction rolls back
  -> no event publication
  -> no handler execution
```

### Publish failure after commit

```text
transaction commits
  -> publisher starts sequential publication
  -> one event publish fails
  -> publisher emits one explicit failure log and enriches canonical request telemetry
  -> later collected events are not published in that attempt
  -> original write remains committed
  -> no rollback attempted
```

### Request-path expectation

- handlers are post-commit reactions from the request perspective
- handler failures must never invalidate the already committed write
- the request path must not rely on handler success for correctness

---

## 3. Core Building Blocks

### 3.1 Domain event contract

Suggested file:

- `src/core/domain/events/domain-event.ts`

Responsibility:

- define the common shape all domain events must satisfy

Recommended shape:

```ts
export interface DomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly tenantId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly version?: number;
}
```

Notes:

- keep this as an interface or type contract, not an abstract base class
- individual events remain plain immutable classes

### 3.2 Aggregate root base

Suggested file:

- `src/core/domain/aggregate-root.base.ts`

Responsibility:

- hold recorded domain events in memory
- provide a consistent API for recording and draining them

Recommended shape:

```ts
export abstract class AggregateRootBase {
  private readonly domainEvents: DomainEvent[] = [];

  protected recordDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
```

Rules:

- only aggregate roots extend this base
- non-root entities do not record events directly

### 3.3 Collector contract

Suggested file:

- `src/core/domain/events/domain-events.collector.ts`

Responsibility:

- collect recorded domain events during one transaction scope

Recommended shape:

```ts
export interface DomainEventsCollector {
  collect(events: DomainEvent[]): void;
  collectFrom(aggregate: AggregateRootBase): void;
  drain(): DomainEvent[];
}
```

### 3.4 In-memory collector implementation

Suggested file:

- `src/core/domain/events/in-memory-domain-events.collector.ts`

Responsibility:

- maintain one in-memory queue of events for the current transaction

Recommended behavior:

- `collectFrom(aggregate)` calls `aggregate.pullDomainEvents()`
- `drain()` returns all currently collected events and empties the queue

### 3.5 Publisher abstraction

Suggested file:

- `src/core/domain/events/domain-event.publisher.ts`

Responsibility:

- isolate application/infrastructure code from the actual event transport

Recommended shape:

```ts
export interface DomainEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
```

### 3.6 EventEmitter publisher

Suggested file:

- `src/core/domain/events/event-emitter-domain-event.publisher.ts`

Responsibility:

- publish domain events in-process through EventEmitter2

Recommended behavior:

- publish each event individually
- use `event.eventName` as the emitted topic
- publish sequentially in collection order
- enrich canonical request telemetry for successful publications
- stop at the first publish error
- emit explicit failure logs with event metadata through the app logging stack

### 3.7 Prisma unit of work

Existing file:

- `src/core/database/prisma-unit-of-work.ts`

Responsibility:

- open transaction scope
- create event collector
- expose `tx` and `events`
- publish drained events only after successful commit

Recommended API shape:

```ts
runInTransaction<T>(
  work: (ctx: { tx: PrismaTransactionClient; events: DomainEventsCollector }) => Promise<T>,
): Promise<T>
```

### 3.8 Domain events module

Suggested file:

- `src/core/domain/events/domain-events.module.ts`

Responsibility:

- provide the `DomainEventPublisher` token
- bind it to `EventEmitterDomainEventPublisher`
- export the publisher for shared command-side infrastructure use

---

## 4. Responsibility Map

### 4.1 Aggregate Root

Responsibilities:

- apply domain state changes
- decide which domain events occurred
- record events in memory

Must not:

- publish events
- know about transactions
- know about EventEmitter2
- know about repositories or infrastructure

### 4.2 Application Service

Responsibilities:

- orchestrate the use case
- open the transaction through `PrismaUnitOfWork`
- load aggregates
- invoke domain behavior
- persist aggregates
- explicitly collect events with `events.collectFrom(aggregate)`
- return the use case result

Must not:

- manually publish domain events
- bypass unit of work for event-producing command flows
- embed domain rules that belong in the aggregate

### 4.3 Repository

Responsibilities:

- load and persist aggregates
- use mappers
- operate with transaction client when provided

Must not:

- publish events
- decide post-commit timing
- collect events implicitly as part of the standard pattern
- embed event transport logic

### 4.4 PrismaUnitOfWork

Responsibilities:

- own transaction boundary
- create transaction-scoped event collector
- publish events after successful commit

Must not:

- know domain-specific business rules
- decide which events should be recorded

### 4.5 DomainEventPublisher

Responsibilities:

- bridge domain events to the event transport
- publish post-commit
- provide a swap point for future outbox support

### 4.6 Event Handler

Responsibilities:

- react to an already committed business fact
- log failures
- trigger follow-up application-layer work

Must not:

- run significant business logic inline
- reach into another module's private internals
- be treated as a transactional continuation

---

## 5. Event Contract Design

All event classes should remain plain immutable classes.

Required metadata:

- `eventId`
- `eventName`
- `aggregateId`
- `aggregateType`
- `occurredAt`

Required when applicable:

- `tenantId`

Optional metadata:

- `correlationId`
- `causationId`
- `version`

Event payload rules:

- use IDs and simple values
- avoid passing domain entities
- avoid passing Prisma records
- include only what handlers need
- make `eventName` explicit on every event

Example:

```ts
export class TenantRegisteredEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventName = 'TenantRegisteredEvent';
  public readonly aggregateType = 'Tenant';

  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly slug: string,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = randomUUID();
  }
}
```

Note:

- for tenant events, `aggregateId` and `tenantId` will often be the same value
- that duplication is acceptable because the contract remains consistent across aggregate types

---

## 6. Transaction and Publication Sequence

### 6.1 Standard command pattern

Recommended command-side pattern:

```ts
return this.unitOfWork.runInTransaction(async ({ tx, events }) => {
  const aggregate = ...;

  aggregate.doSomething();

  await this.repository.save(aggregate, tx);
  events.collectFrom(aggregate);

  return result;
});
```

### 6.2 Why explicit `events.collectFrom(...)`

This blueprint chooses explicit collection in application services because it is:

- easier to read
- easier to review
- easier to test
- less magical than implicit repository-side collection

This keeps repository responsibilities narrower in v1.

### 6.3 Publish ordering

- events are published in the order they were collected
- events recorded by one aggregate preserve their recording order
- no special global ordering guarantees are required beyond collection order

### 6.4 Duplicate prevention

- `pullDomainEvents()` drains the aggregate queue
- once collected, those events must not be re-collected unless newly recorded later
- application services collect after persistence, not before

---

## 7. Public Module Event Strategy

### 7.1 Default rule

- domain events are private by default

### 7.2 Exception for this feature

- `TenantRegisteredEvent` is intentionally public

Reason:

- tenant registration is a meaningful cross-boundary fact
- other bounded contexts may need to react asynchronously
- email/notification concerns are expected future consumers

### 7.3 Public contract location

Recommended file:

- `src/modules/tenant/public/events/tenant-registered.event.ts`

Recommended exposure:

- direct import from `src/modules/tenant/public/events/*`
- optionally re-export from `src/modules/tenant/tenant.public-api.ts`

Consumers in other modules must import only from the public surface.

### 7.4 One-class reuse rule

One event class may serve as both the recorded domain event and the public module event only when all of the following are true:

- the same business fact is what both internal and cross-module consumers need
- no internal-only payload must be hidden from consumers
- the event is intentionally exposed from the producing module's public surface

This blueprint allows `TenantRegisteredEvent` itself to be the public event contract.

That split can be introduced later if a stronger internal/public separation becomes necessary.

---

## 8. Handler Execution Model

Handlers use:

- `@OnEvent(EventName)`

Recommended file naming:

- `[do-something-when-something-happened].event-handler.ts`

Recommended structure:

```ts
@Injectable()
export class SomeEventHandler {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: AppLogger,
  ) {}

  @OnEvent(SomeEvent.name)
  async handle(event: SomeEvent): Promise<void> {
    try {
      await this.commandBus.execute(...);
    } catch (error) {
      LogContext.increment('domainEventHandlerFailures');
      this.logger.error('...', error instanceof Error ? error.stack : undefined, SomeEventHandler.name);
    }
  }
}
```

Allowed dependencies:

- `CommandBus`
- producing module public facades
- other modules' public facades

Not allowed:

- direct private cross-module repositories
- direct private application services from another module
- large business workflows inline in the handler

Idempotency expectation:

- handlers should be written to be idempotency-ready
- this version does not implement durable deduplication infrastructure yet

Operational expectation:

- handler failures must never invalidate the already committed write
- handlers are best-effort post-commit reactions from the request perspective
- successful event publication is observed through canonical request enrichment, not standalone success log lines

---

## 9. Reference Migration: Tenant Registration

### 9.1 Current flow

Current behavior:

- `RegisterTenantService` creates tenant
- persists tenant in transaction
- bootstraps tenant admin in transaction
- manually publishes `TenantRegisteredEvent` after transaction

Problems:

- event is published manually from the application service
- event origin is outside the aggregate
- event flow is not reusable

### 9.2 Target flow

Target behavior:

```text
RegisterTenantCommand
  -> RegisterTenantService
  -> PrismaUnitOfWork.runInTransaction(...)
       -> Tenant.create(...)
            -> Tenant records TenantRegisteredEvent
       -> TenantRepository.save(tenant, tx)
       -> events.collectFrom(tenant)
       -> UsersPublicApi.bootstrapTenantAdmin(...)
  -> commit
  -> DomainEventPublisher.publish(TenantRegisteredEvent)
  -> handlers react
```

### 9.3 Required implementation changes

#### Tenant aggregate

File:

- `src/modules/tenant/domain/entities/tenant.entity.ts`

Changes:

- extend `AggregateRootBase`
- record `TenantRegisteredEvent` in `Tenant.create(...)`

#### TenantRegisteredEvent

Recommended file:

- `src/modules/tenant/public/events/tenant-registered.event.ts`

Changes:

- make it the public event contract
- align with standard event metadata

#### RegisterTenantService

File:

- `src/modules/tenant/application/commands/register-tenant/register-tenant.service.ts`

Changes:

- remove direct `EventBus` dependency
- use unit-of-work transaction context
- call `events.collectFrom(createdTenant)` after persistence
- keep `bootstrapTenantAdmin` inside the transaction

#### App bootstrap

File:

- `src/app.module.ts`

Changes:

- register `EventEmitterModule`
- import `DomainEventsModule`

### 9.4 Important non-change

`bootstrapTenantAdmin` stays synchronous and transactional.

It is part of required tenant-registration correctness, not a post-commit side effect. It must not be moved to an event handler.

---

## 10. Testing Blueprint

### 10.1 Aggregate tests

Test:

- aggregate records event on valid creation/transition
- aggregate does not record event on invalid transition
- `pullDomainEvents()` drains exactly once

### 10.2 UnitOfWork tests

Test:

- successful transaction publishes drained events
- failing transaction publishes nothing
- multiple collected events publish after commit in order
- publication stops and logs metadata on first publish failure

### 10.3 Application service tests

Test:

- service uses unit of work
- service collects events explicitly
- service no longer manually publishes domain events

### 10.4 Integration tests

Test:

- tenant registration persists tenant and admin bootstrap correctly
- `TenantRegisteredEvent` is emitted after commit
- canonical request telemetry captures published domain event names/counts when the request succeeds

### 10.5 Failure-path tests

Test:

- handler failure does not roll back tenant registration
- publisher failure is logged after commit without rollback

---

## 11. Operational Logging Requirements

Successful event publication should:

- enrich the canonical request log instead of emitting one standalone success log line per event
- update `domainEventsPublished`
- update `domainEventNames`

Publisher failure logs must include:

- `eventName`
- `eventId`
- `aggregateId`
- `aggregateType`
- `tenantId` when present

Handler failure logs must include:

- `eventName`
- `eventId`
- `aggregateId`
- `aggregateType`
- `tenantId` when present
- handler class name

Correlation and causation fields should be logged when present.

Canonical request telemetry should also track:

- `domainEventPublishFailures`
- `domainEventHandlerFailures`

---

## 12. Deferred Follow-Up

Deferred beyond this implementation:

- transactional outbox
- durable retries
- handler execution tracking
- replay tooling
- dead-letter handling
- mandatory separation of internal and public event classes for every public event

---

## 13. Implementation Checklist

The implementation should be considered aligned with this blueprint when:

- core event abstractions exist under `src/core/domain/events/`
- aggregate roots can record and drain domain events
- `PrismaUnitOfWork` exposes transaction and collector context
- events publish only after successful commit
- publication is sequential and fail-fast
- `TenantRegisteredEvent` is exposed as a public module event
- `RegisterTenantService` no longer publishes manually
- EventEmitter2 is wired into the app
- at least one event handler exists using the standard pattern
