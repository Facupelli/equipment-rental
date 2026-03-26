# Mapper

## Role

A Mapper translates between the domain model and the persistence model. It is the bridge between a domain entity and the Prisma record shape.

Mappers are infrastructure-adjacent. They know about both domain objects and Prisma types, but they contain no business logic. On the command side, repositories use mappers when loading and saving aggregates. On the query side, Query Handlers normally do not use mappers.

---

## Rules

### Two directions, always both

- Every mapper should support both persistence-to-domain and domain-to-persistence translation.
- Use explicit methods such as `toDomain()`, `toPersistence()`, and optionally `toUpdateData()` when needed.

### Static and stateless

- Mappers are stateless utility classes with static methods.
- They are not NestJS providers and are not decorated with `@Injectable()`.

### `toDomain()` uses `reconstitute()`

- When mapping from Prisma to a domain entity, call `Entity.reconstitute()`, not `Entity.create()`.
- `create()` is for new domain objects. `reconstitute()` is for restoring an existing aggregate from persistence.

### `toPersistence()` serializes domain types

- Value Objects must be serialized into Prisma-compatible primitives or structured shapes.
- Domain enums must be mapped or cast to their persistence equivalents when needed.
- Do not include computed properties or domain methods in persistence shapes.

### Aggregate composition

- Aggregate mappers map child entities and value objects first, then pass them to the aggregate root's `reconstitute()`.
- Delegate child translation to child mappers where appropriate.
- Do not push raw Prisma objects into entity constructors.

### Naming translation lives here

- If the persistence model and domain model differ in field naming or shape, the mapper is where that translation happens.
- Keep snake_case or Prisma-specific concerns out of entities and Application Services.

### No business logic

- Mappers only translate data.
- They do not enforce domain rules, call domain methods, or make business decisions.
- If persisted data is invalid, let `reconstitute()` or Value Object construction fail naturally.

### Ownership

- Repositories call mappers on aggregate persistence flows.
- Application Services should not scatter inline Prisma-to-domain mapping logic.
- Query Handlers normally return read models directly and do not instantiate aggregates through mappers.

---

## Structure

```typescript
import { Booking as PrismaBooking, Prisma } from '@prisma/client';

import { BookingEntity } from '../domain/booking.entity';
import { BookingPeriod } from '../domain/booking-period.value-object';
import { BookingStatus } from '../domain/booking-status.enum';

export class BookingMapper {
  static toDomain(record: PrismaBooking): BookingEntity {
    return BookingEntity.reconstitute({
      id: record.id,
      tenantId: record.tenantId,
      equipmentId: record.equipmentId,
      customerId: record.customerId,
      status: record.status as BookingStatus,
      period: BookingPeriod.fromDates(record.periodStart, record.periodEnd),
    });
  }

  static toPersistence(entity: BookingEntity): Prisma.BookingCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      equipmentId: entity.equipmentId,
      customerId: entity.customerId,
      status: entity.status,
      periodStart: entity.period.start,
      periodEnd: entity.period.end,
    };
  }

  static toUpdateData(entity: BookingEntity): Prisma.BookingUpdateInput {
    return {
      status: entity.status,
      periodStart: entity.period.start,
      periodEnd: entity.period.end,
    };
  }
}
```

---

## Examples

### Correct: `toDomain()` uses `reconstitute()`

```typescript
static toDomain(record: PrismaBooking): BookingEntity {
  return BookingEntity.reconstitute({
    id: record.id,
    tenantId: record.tenantId,
    status: record.status as BookingStatus,
    period: BookingPeriod.fromDates(record.periodStart, record.periodEnd),
  });
}
```

### Wrong: `toDomain()` uses `create()`

```typescript
static toDomain(record: PrismaBooking): BookingEntity {
  return BookingEntity.create({
    equipmentId: record.equipmentId,
    customerId: record.customerId,
    period: BookingPeriod.fromDates(record.periodStart, record.periodEnd),
  });
}
```

---

### Correct: repository uses mapper after loading from Prisma

```typescript
const record = await this.prisma.booking.findUniqueOrThrow({ where: { id } });
return BookingMapper.toDomain(record);
```

### Wrong: inline mapping logic scattered through repository or service code

```typescript
return BookingEntity.reconstitute({
  id: record.id,
  tenantId: record.tenantId,
  status: record.status as BookingStatus,
  period: new BookingPeriod(record.periodStart, record.periodEnd),
});
```

---

### Correct: aggregate mapper delegates child mapping first

```typescript
const lines = record.lines.map(OrderLineMapper.toDomain);

return OrderEntity.reconstitute({
  id: record.id,
  tenantId: record.tenantId,
  status: record.status,
  lines,
});
```

### Wrong: query handler instantiates aggregates through mappers for a read model

```typescript
const record = await this.prisma.booking.findUnique({ where: { id: query.bookingId } });
const entity = BookingMapper.toDomain(record);
return BookingPresenter.toResponse(entity);
```
