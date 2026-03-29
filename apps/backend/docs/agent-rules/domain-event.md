# Domain Event and Event Handler

## Role

A Domain Event is an immutable record that a meaningful business fact happened in the domain.

In this codebase, Domain Events are used for **post-commit side effects inside a modular monolith**. They are not generic pub/sub messages and they do not make the system a distributed event-driven architecture.

The key idea is:

- an Aggregate Root changes state
- the Aggregate Root records a Domain Event
- the command-side infrastructure publishes the event only after persistence succeeds
- one or more Event Handlers may react to that committed fact

Domain Events are used for **decoupling side effects** from the primary use case. If a follow-up step is required for correctness and must succeed or fail together with the main state change, it belongs in the same Application Service and transaction, not in an event handler.

We use **EventEmitter2** via `@nestjs/event-emitter` for in-process event dispatching.

---

## Event Types

### Private domain events

Private domain events are the default.

- They belong to the producing module's internal domain model.
- They express something meaningful that happened inside that bounded context.
- Other modules must not import them through private module paths.

Use a private domain event when the event exists primarily because the Aggregate Root needs to express a business fact inside its own module.

### Public module events

A Public Module Event is an explicit cross-module async contract.

- It is still a domain-level business fact.
- It is intentionally exposed through the producing module's public surface.
- Other modules may depend on it only through that public contract.

Use a public module event when another bounded context is intentionally allowed to react asynchronously to that fact after commit.

Domain events are **private by default**. Promote one to a public module event only intentionally.

### Integration events

Integration events are a separate concept used for durable or external delivery concerns.

- They are for boundaries such as external services, brokers, webhooks, background workers, or other must-not-lose delivery scenarios.
- They are not the default pattern in this app.
- They are out of scope for the standard in-process domain event mechanism described here.

If durable delivery is required later, a private domain event or public module event may be mapped to an integration event or outbox flow.

---

## Rules

### Event object

- A Domain Event is a plain class with `readonly` properties. No methods, no logic.
- Properties describe what happened and carry the data handlers need.
- Pass IDs and simple values, not full entities or Prisma records.
- Events are immutable.
- Name events in the **past tense**: `BookingConfirmedEvent`, `EquipmentAssignedEvent`, `TenantRegisteredEvent`.
- Include at minimum the affected aggregate ID and `tenantId` when the domain concept is tenant-scoped.
- Prefer metadata that keeps the design outbox-ready, such as `eventId`, `aggregateId`, `aggregateType`, `tenantId`, and `occurredAt`.

### Where events originate

- Only Aggregate Roots record domain events.
- The aggregate updates its state first, then records the event.
- Aggregates do not publish events directly.
- Aggregates must not depend on NestJS, EventEmitter2, Prisma, or transport concerns.

### Publishing and timing

- Domain Events are published only after successful persistence.
- If the transaction fails, no Domain Event is published.
- On the command side, `PrismaUnitOfWork` is the standard publication path for Domain Events.
- Repositories may help collect events from saved aggregates, but final publication timing belongs to the surrounding infrastructure.

### Application service rule

- Application Services must not manually publish Domain Events.
- They must not call `eventEmitter.emit(...)`, `eventEmitter.emitAsync(...)`, or `eventBus.publish(...)` for Domain Events.
- Their role is orchestration: load -> act -> persist -> return.

### Repository and unit of work responsibilities

- Repositories persist aggregates and may pull recorded events from them.
- Repositories must not publish Domain Events directly.
- `PrismaUnitOfWork` owns the transaction boundary, event collection lifecycle, and post-commit publication.

### Boundary rules

- Domain Events are private to their module by default.
- Other modules must not import another module's private event classes from `domain/events` or other private folders.
- If another module needs to react asynchronously, expose a Public Module Event through an explicit public surface.
- Public module events are allowed cross-module contracts. They are not accidental reuse of private domain event classes.
- Event Handlers that react across module boundaries must use public contracts, facades, or other approved boundary patterns.

### Event handler

- Decorated with `@OnEvent('EventClassName')` from `@nestjs/event-emitter`.
- One handler per reaction. If two different things should happen, create two handlers.
- Handlers react **after commit** to an already-persisted business fact.
- Handlers may trigger the next application-layer action via an injected Application Service, public facade, or the `CommandBus`.
- Handlers follow the **Command -> Event -> Command** pattern when a follow-up action should be started asynchronously.
- Handlers must be resilient. Use try/catch and log failures.
- Handlers should be idempotency-ready. Do not assume durable exactly-once delivery semantics.
- Handlers must not contain rich business logic or bypass application-layer orchestration for significant work.

### Failure semantics

- If persistence fails, no Domain Event is published.
- If publish fails after commit, the original state change remains committed. Do not attempt rollback through event infrastructure.
- If a handler fails, the original write remains committed. The failure is operational and must be logged.
- In-process Domain Events are non-durable in this default pattern. Do not treat them as guaranteed external delivery.

### What events are not for

- Do not use events for the primary flow of a use case.
- Do not use events for steps that must happen inside the same transaction for correctness.
- Do not pass full domain entities in event payloads.
- Do not use events to replace direct synchronous collaboration when a public facade/API is the correct boundary.
- Do not treat an in-process public module event as an integration event or as a durable delivery guarantee.

### Naming

- Event file: `[something-happened].event.ts` - class: `[SomethingHappened]Event`
- Handler file: `[do-something-when-something-happened].event-handler.ts` - class: `[DoSomethingWhenSomethingHappened]EventHandler`
- Public module events should be exposed from the module's explicit public surface, for example `src/modules/<module>/public/events/*` or `<module>.public-api`.

---

## Structure

### Private domain event

```typescript
export class BookingConfirmedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly equipmentId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

### Public module event

```typescript
// src/modules/tenant/public/events/tenant-registered.event.ts
export class TenantRegisteredEvent {
  constructor(
    public readonly tenantId: string,
    public readonly adminUserId: string,
    public readonly adminEmail: string,
    public readonly slug: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

Use a public module event when another bounded context is intentionally allowed to react asynchronously to the fact that a tenant was registered.

### Event handler

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';

import { BookingConfirmedEvent } from '../../domain/events/booking-confirmed.event';
import { SendBookingConfirmationCommand } from '../../../notification/application/commands/send-booking-confirmation/send-booking-confirmation.command';

@Injectable()
export class SendConfirmationWhenBookingConfirmedEventHandler {
  private readonly logger = new Logger(SendConfirmationWhenBookingConfirmedEventHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent(BookingConfirmedEvent.name)
  async handle(event: BookingConfirmedEvent): Promise<void> {
    try {
      await this.commandBus.execute(
        new SendBookingConfirmationCommand({
          tenantId: event.tenantId,
          customerId: event.customerId,
          bookingId: event.bookingId,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to handle BookingConfirmedEvent for ${event.bookingId}`, error);
    }
  }
}
```

### Publication flow

```typescript
await this.unitOfWork.runInTransaction(async ({ tx, events }) => {
  const booking = Booking.load(...);

  booking.confirm();

  await this.bookingRepository.save(booking, tx);
  events.collectFrom(booking);
});
```

The transaction commits first. The collected events are published only after that commit succeeds.

---

## Examples

### Correct: aggregate records event after state change

```typescript
// Inside BookingEntity
confirm(): void {
  if (this.props.status !== BookingStatus.PENDING) {
    throw new DomainException(`Booking ${this.id} cannot be confirmed`);
  }

  this.props.status = BookingStatus.CONFIRMED;

  this.recordDomainEvent(
    new BookingConfirmedEvent(
      this.id,
      this.props.tenantId,
      this.props.customerId,
      this.props.equipmentId,
    ),
  );
}
```

### Correct: unit of work publishes after commit

```typescript
await this.unitOfWork.runInTransaction(async ({ tx, events }) => {
  order.confirm();
  await this.orderRepository.save(order, tx);
  events.collectFrom(order);
});
```

### Correct: public module event exposed intentionally

```typescript
// Allowed cross-module import
import { TenantRegisteredEvent } from 'src/modules/tenant/public/events/tenant-registered.event';
```

### Correct: handler reacts through command or facade

```typescript
@OnEvent(TenantRegisteredEvent.name)
async handle(event: TenantRegisteredEvent): Promise<void> {
  await this.commandBus.execute(new SendTenantWelcomeEmailCommand(event.tenantId, event.adminEmail));
}
```

### Wrong: manual publish from Application Service

```typescript
// In the Application Service
booking.confirm();
await this.bookingRepository.save(booking);
this.eventBus.publish(new BookingConfirmedEvent(...));
```

### Wrong: publish before persistence succeeds

```typescript
booking.confirm();
await this.eventEmitter.emitAsync(BookingConfirmedEvent.name, new BookingConfirmedEvent(...));
await this.bookingRepository.save(booking);
```

### Wrong: cross-module import from private path

```typescript
import { TenantRegisteredEvent } from 'src/modules/tenant/domain/events/tenant-registered.event';
```

### Wrong: handler executes business logic directly

```typescript
@OnEvent(BookingConfirmedEvent.name)
async handle(event: BookingConfirmedEvent): Promise<void> {
  await this.prisma.notification.create({ data: { bookingId: event.bookingId } });
  await this.emailService.send({ to: event.customerId });
}
```

### Wrong: treating in-process public module event as durable external delivery

```typescript
// Do not assume this guarantees durable email delivery.
@OnEvent(TenantRegisteredEvent.name)
async handle(event: TenantRegisteredEvent): Promise<void> {
  await this.emailProvider.sendWelcomeEmail(event.adminEmail);
}
```

If the delivery must not be lost, map the event to an integration event or outbox-backed flow instead.
