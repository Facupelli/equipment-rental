# Repository

## Role

A Repository is a concrete Prisma-backed persistence component responsible for loading and saving aggregates.

Repositories sit on the command side. They encapsulate aggregate persistence concerns, use mappers to translate between Prisma records and domain entities, and keep persistence details out of Application Services and entities.

This codebase uses repositories, but it does not place repository ports or interfaces on top of them.

---

## Rules

### One repository per aggregate root

- Create repositories for aggregate roots, not every internal entity.
- Child entities are persisted through the root aggregate's repository.

### Concrete classes, no ports

- Repositories are concrete classes.
- Do not introduce `IRepository`, `OrderRepositoryPort`, or similar abstractions unless there is a very specific architectural reason.
- The goal is aggregate persistence clarity, not database swapability theatre.

### Command side only by default

- Repositories are the default persistence path for command-side Application Services.
- Query Handlers should usually read directly with `PrismaService` instead of routing read models through repositories.

### Load and save aggregates

- Repository methods should load aggregates as domain entities and save aggregates back to persistence.
- Use straightforward aggregate persistence methods such as `findById()`, `load()`, `save()`, or focused aggregate-loading helpers when needed.
- Add domain-shaped helper methods when they genuinely help a command-side use case load the aggregate state it needs.

### Use mappers

- Repositories use mappers to translate Prisma records to domain entities and back.
- Do not scatter mapping logic inline throughout repository methods.

### No business logic

- Repositories do not enforce domain rules.
- They persist, load, and translate.
- Business decisions remain in entities, Domain Services, and Application Services.

### Transactions

- Repositories may participate in Prisma transactions.
- When an Application Service opens a transaction, repository methods should accept the transaction client when needed.

---

## Structure

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/core/database/prisma.service';

import { BookingEntity } from '../domain/booking.entity';
import { BookingMapper } from './booking.mapper';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<BookingEntity | null> {
    const record = await this.prisma.booking.findFirst({
      where: { id, tenantId },
    });

    return record ? BookingMapper.toDomain(record) : null;
  }

  async findActiveForEquipment(tenantId: string, equipmentId: string): Promise<BookingEntity[]> {
    const records = await this.prisma.booking.findMany({
      where: {
        tenantId,
        equipmentId,
        status: { not: 'CANCELLED' },
      },
    });

    return records.map(BookingMapper.toDomain);
  }

  async save(entity: BookingEntity): Promise<void> {
    await this.prisma.booking.upsert({
      where: { id: entity.id },
      create: BookingMapper.toPersistence(entity),
      update: BookingMapper.toUpdateData(entity),
    });
  }

  async saveWithinTransaction(entity: BookingEntity, tx: Prisma.TransactionClient): Promise<void> {
    await tx.booking.upsert({
      where: { id: entity.id },
      create: BookingMapper.toPersistence(entity),
      update: BookingMapper.toUpdateData(entity),
    });
  }
}
```

---

## Examples

### Correct: one repository per aggregate root

```typescript
export class OrderRepository {
  async findById(id: string, tenantId: string): Promise<OrderEntity | null> { ... }
  async save(order: OrderEntity): Promise<void> { ... }
}
```

### Wrong: repository per child entity inside the same aggregate

```typescript
export class OrderLineRepository {}
export class OrderNoteRepository {}
export class OrderRepository {}
```

---

### Correct: repository uses mapper

```typescript
const record = await this.prisma.order.findUniqueOrThrow({ where: { id } });
return OrderMapper.toDomain(record);
```

### Wrong: Application Service owns persistence translation details

```typescript
const record = await this.prisma.order.findUniqueOrThrow({ where: { id } });
const order = OrderEntity.reconstitute({ ...record });
```

---

### Correct: Query Handler bypasses repository for a read model

```typescript
const rows = await this.prisma.order.findMany({
  where: { tenantId },
  select: { id: true, status: true, createdAt: true },
});
```

### Wrong: forcing a read model through an aggregate repository without need

```typescript
const orders = await this.orderRepository.findAllForDashboard(tenantId);
return orders.map(OrderPresenter.toDashboardRow);
```
