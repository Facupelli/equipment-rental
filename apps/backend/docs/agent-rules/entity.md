# Entity

## Role

An Entity is a domain object with stable identity that persists through its lifecycle. Entities are the primary holders of business logic. Two entities are equal if they share the same `id`, regardless of other properties.

Entities know nothing about the outside world. No NestJS decorators, Prisma types, or HTTP concepts belong here.

---

## Rules

### Identity and equality

- Every entity has an `id: string`.
- `id` is `readonly` and never changes after creation.
- Equality is determined by identity, not by full property comparison.

### Construction

- Never use an empty constructor. All required data must be present at construction time.
- Define explicit props types for construction: `CreateXProps` for new instances and `ReconstituteXProps` for persistence rehydration.
- Use `static create()` for new entities. It generates the `id` and enforces invariants.
- Use `static reconstitute()` for loading from persistence. It restores an existing `id` and assumes persisted data is already valid.
- Prefer props objects over long positional argument lists.

### Encapsulation

- Every field should have an explicit visibility modifier.
- Avoid public setters.
- Mutable state changes happen only through expressive domain methods such as `confirm()`, `cancel()`, or `assignEquipment()`.
- Make fields `readonly` when they should never change after creation.

### Business logic

- Logic that concerns only this entity's own state belongs here.
- Logic that spans multiple entities or aggregates belongs in a Domain Service.
- Entities do not orchestrate workflows, perform I/O, or know about persistence.

### Domain Events

- Aggregate Roots may publish Domain Events.
- Record the event inside a state-changing method after state has been updated.
- Plain child entities do not publish Domain Events directly.

### Aggregate composition

- Entities do not map raw persistence data.
- Mappers compose child entities and value objects first, then pass those domain objects into `reconstitute()`.
- An entity should never contain Prisma-shaped mapping logic.

### What never belongs in an entity

- Prisma types or infrastructure libraries
- NestJS decorators
- HTTP or transport concepts
- Logging or side effects

---

## Structure

```typescript
import { randomUUID } from 'node:crypto';

import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { DomainException } from 'src/core/exceptions/domain.exception';

interface BookingProps {
  tenantId: string;
  equipmentId: string;
  customerId: string;
  status: BookingStatus;
  period: BookingPeriod;
}

interface CreateBookingProps {
  tenantId: string;
  equipmentId: string;
  customerId: string;
  period: BookingPeriod;
}

interface ReconstituteBookingProps extends BookingProps {
  id: string;
}

export class BookingEntity extends AggregateRoot<BookingProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }

  get status(): BookingStatus {
    return this.props.status;
  }

  get period(): BookingPeriod {
    return this.props.period;
  }

  static create(props: CreateBookingProps): BookingEntity {
    if (props.equipmentId.trim().length === 0) {
      throw new DomainException('equipmentId cannot be empty');
    }

    return new BookingEntity({
      id: randomUUID(),
      props: {
        ...props,
        status: BookingStatus.PENDING,
      },
    });
  }

  static reconstitute(props: ReconstituteBookingProps): BookingEntity {
    return new BookingEntity({
      id: props.id,
      props: {
        tenantId: props.tenantId,
        equipmentId: props.equipmentId,
        customerId: props.customerId,
        status: props.status,
        period: props.period,
      },
    });
  }

  confirm(): void {
    if (this.props.status !== BookingStatus.PENDING) {
      throw new DomainException(`Booking ${this.id} cannot be confirmed from status ${this.props.status}`);
    }

    this.props.status = BookingStatus.CONFIRMED;
    this.addEvent(new BookingConfirmedEvent({ bookingId: this.id, tenantId: this.props.tenantId }));
  }

  cancel(reason: string): void {
    if (this.props.status === BookingStatus.CANCELLED) {
      throw new DomainException(`Booking ${this.id} is already cancelled`);
    }

    this.props.status = BookingStatus.CANCELLED;
    this.addEvent(new BookingCancelledEvent({ bookingId: this.id, reason }));
  }
}
```

---

## Examples

### Correct: state changes go through named domain methods

```typescript
booking.confirm();
```

### Wrong: mutating state directly from outside

```typescript
booking.props.status = BookingStatus.CONFIRMED;
```

---

### Correct: creating a new entity via `create()`

```typescript
const booking = BookingEntity.create({
  tenantId,
  equipmentId,
  customerId,
  period: new BookingPeriod(startDate, endDate),
});
```

### Wrong: constructing directly with `new`

```typescript
const booking = new BookingEntity({ ... });
```

---

### Correct: rehydrating through `reconstitute()` in the mapper

```typescript
BookingEntity.reconstitute({
  id: record.id,
  tenantId: record.tenantId,
  equipmentId: record.equipmentId,
  customerId: record.customerId,
  status: record.status as BookingStatus,
  period: BookingPeriod.fromDates(record.periodStart, record.periodEnd),
});
```

### Correct: mapper composes children before reconstituting the aggregate

```typescript
const lines = record.lines.map(OrderLineMapper.toDomain);

return OrderEntity.reconstitute({
  id: record.id,
  tenantId: record.tenantId,
  status: record.status,
  lines,
});
```

### Wrong: entity maps persistence children itself

```typescript
static reconstitute(raw: PrismaOrderWithLines): OrderEntity {
  const lines = raw.lines.map(OrderLineMapper.toDomain);
  return new OrderEntity({ ... });
}
```
