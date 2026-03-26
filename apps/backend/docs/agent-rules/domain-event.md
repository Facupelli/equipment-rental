# Domain Event and Event Handler

## Role

A Domain Event is an immutable record that something meaningful happened in the domain. It is published by an Aggregate Root after a state change is committed. Other parts of the system can react to it through Event Handlers.

Domain Events are used for **decoupling side effects** from the primary use case. When a booking is confirmed, the primary use case is the confirmation itself. Sending a notification or generating an invoice are side effects — they belong in event handlers, not in the Application Service that confirmed the booking.

We use **EventEmitter2** via `@nestjs/event-emitter` for in-process domain event dispatching.

---

## Rules

### Domain Event object

- A Domain Event is a plain class with `readonly` properties. No methods, no logic.
- Properties describe what happened and carry the data that handlers need. Pass IDs, not full entities.
- Events are immutable — all properties are `readonly`.
- Name events in the **past tense**: `BookingConfirmedEvent`, `EquipmentAssignedEvent`, `TenantCreatedEvent`.
- Include at minimum the `id` of the affected aggregate and its `tenantId` if the domain is multitenant.

### Publishing events

- Only Aggregate Roots publish events, by calling `this.addEvent(new SomethingHappenedEvent(...))` inside a domain method, after the state has been updated.
- Events are dispatched by the infrastructure after the aggregate is persisted. The Application Service should not dispatch events manually.
- Events are dispatched in order, after a successful write. An event is never dispatched for a state change that was not persisted.

### Event Handler

- Decorated with `@OnEvent('EventClassName')` from `@nestjs/event-emitter`.
- One handler per reaction. If two different things need to happen when a booking is confirmed, create two handlers — not one handler that does both.
- Handlers may trigger the next application-layer action via an injected Application Service or the `CommandBus`.
- Handlers follow the **Command → Event → Command** chain: they react to an event by dispatching a new command, not by directly executing business logic.
- Handlers must be resilient. If a handler fails, it should not crash the original request. Use try/catch and log failures.

### What events are not for

- Do not use events for the primary flow of a use case. If step B must always happen as part of step A, they belong in the same Application Service or transaction — not chained through events.
- Do not pass full domain entities in event payloads. Pass IDs. The handler fetches what it needs.
- Do not use events to replace direct service calls within the same bounded context when the coupling is intentional and the ordering is critical.

### Naming

- Event file: `[something-happened].event.ts` — class: `[SomethingHappened]Event`
- Handler file: `[do-something-when-something-happened].event-handler.ts` — class: `[DoSomethingWhenSomethingHappened]EventHandler`

---

## Structure

### Domain Event

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

### Event Handler

```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { BookingConfirmedEvent } from '../../domain/events/booking-confirmed.event';
import { SendBookingConfirmationCommand } from '../../../notification/commands/send-booking-confirmation/send-booking-confirmation.command';

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
      this.logger.error(`Failed to send confirmation for booking ${event.bookingId}`, error);
    }
  }
}
```

---

## Examples

### ✅ Correct: event published inside the domain method, after state change

```typescript
// Inside BookingEntity
confirm(): void {
  if (this.props.status !== BookingStatus.PENDING) {
    throw new DomainException(`Booking ${this.id} cannot be confirmed`);
  }
  this.props.status = BookingStatus.CONFIRMED; // state changes first
  this.addEvent(new BookingConfirmedEvent(   // then event is recorded
    this.id,
    this.props.tenantId,
    this.props.customerId,
    this.props.equipmentId,
  ));
}
```

### ❌ Wrong: event dispatched manually from the Application Service before persisting

```typescript
// In the Application Service
booking.confirm();
await this.eventEmitter.emit('BookingConfirmedEvent', new BookingConfirmedEvent(...)); // too early
await this.prisma.booking.update(...); // if this fails, event was already emitted
```

---

### ✅ Correct: handler dispatches a command, does not execute business logic directly

```typescript
@OnEvent(BookingConfirmedEvent.name)
async handle(event: BookingConfirmedEvent): Promise<void> {
  await this.commandBus.execute(new SendBookingConfirmationCommand({ ... }));
}
```

### ❌ Wrong: handler executes business logic directly

```typescript
@OnEvent(BookingConfirmedEvent.name)
async handle(event: BookingConfirmedEvent): Promise<void> {
  // Business logic and Prisma calls directly in the handler — bypasses the application layer
  await this.prisma.notification.create({ data: { ... } });
  await this.emailService.send({ to: event.customerId, ... });
}
```

---

### ✅ Correct: handler is resilient — failures are logged, not propagated

```typescript
@OnEvent(BookingConfirmedEvent.name)
async handle(event: BookingConfirmedEvent): Promise<void> {
  try {
    await this.commandBus.execute(new SendBookingConfirmationCommand({ ... }));
  } catch (error) {
    this.logger.error(`Failed to handle BookingConfirmedEvent for ${event.bookingId}`, error);
  }
}
```

### ❌ Wrong: unhandled failure in handler crashes the original request

```typescript
@OnEvent(BookingConfirmedEvent.name)
async handle(event: BookingConfirmedEvent): Promise<void> {
  // If this throws, it may propagate and corrupt the response of the original use case
  await this.commandBus.execute(new SendBookingConfirmationCommand({ ... }));
}
```
