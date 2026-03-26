# Query and Query Handler

## Role

A Query represents a user's intent to retrieve data. A Query Handler executes it and returns the requested read model.

Queries are read-only. They must never mutate state, write to the database, or trigger side effects.

Query Handlers are deliberately allowed to bypass aggregate repositories and read directly with Prisma. Read models do not need to pass through entities, aggregates, or mappers.

---

## Rules

### Query object

- A Query is a plain class with `readonly` properties and a single constructor.
- It has no methods and no business logic.
- Properties are primitives: IDs, strings, enums, filters, pagination params.

### Query Handler

- Decorated with `@QueryHandler(TheQuery)` and implements `IQueryHandler<TQuery, TResult>`.
- One handler per query.
- Inject `PrismaService` directly.
- Repositories are for aggregate persistence on the command side, not the default read path.
- Return data shaped for the caller.
- Select only the fields needed. Do not return raw Prisma records blindly.

### No domain objects in reads

- Do not instantiate aggregates in a Query Handler.
- Do not use domain mappers in a Query Handler by default.
- Do not call Domain Services in a Query Handler by default.
- Exception: if a read truly requires domain computation that cannot be expressed cleanly otherwise, use domain objects intentionally and sparingly.

### Pagination

- Queries that return lists should support pagination.
- Return both the data and the total count.

### Multitenancy

- Every tenant-scoped query must filter by `tenantId`.
- Never return data across tenant boundaries.

---

## Structure

```typescript
export class FindBookingsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
  ) {}
}
```

```typescript
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';

import { FindBookingsQuery } from './find-bookings.query';

export interface BookingListItem {
  id: string;
  equipmentId: string;
  customerId: string;
  status: string;
  startDate: Date;
  endDate: Date;
}

export interface FindBookingsResult {
  data: BookingListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@QueryHandler(FindBookingsQuery)
export class FindBookingsQueryHandler implements IQueryHandler<FindBookingsQuery, FindBookingsResult> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindBookingsQuery): Promise<FindBookingsResult> {
    const { tenantId, status, page, pageSize } = query;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        select: {
          id: true,
          equipmentId: true,
          customerId: true,
          status: true,
          periodStart: true,
          periodEnd: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: data.map((record) => ({
        id: record.id,
        equipmentId: record.equipmentId,
        customerId: record.customerId,
        status: record.status,
        startDate: record.periodStart,
        endDate: record.periodEnd,
      })),
      total,
      page,
      pageSize,
    };
  }
}
```

---

## Examples

### Correct: Query Handler reads directly from Prisma

```typescript
async execute(query: GetBookingByIdQuery): Promise<BookingDetail | null> {
  const record = await this.prisma.booking.findUnique({
    where: { id: query.bookingId, tenantId: query.tenantId },
    select: { id: true, status: true, periodStart: true, periodEnd: true },
  });

  if (!record) return null;

  return {
    id: record.id,
    status: record.status,
    startDate: record.periodStart,
    endDate: record.periodEnd,
  };
}
```

### Wrong: mapping aggregates just to build a read model

```typescript
const record = await this.prisma.booking.findUnique({ where: { id: query.bookingId } });
const entity = BookingMapper.toDomain(record);
return BookingPresenter.toResponse(entity);
```

---

### Correct: always filtering by `tenantId`

```typescript
const bookings = await this.prisma.booking.findMany({
  where: { tenantId: query.tenantId, status: query.status },
});
```

### Wrong: querying without tenant scope

```typescript
const bookings = await this.prisma.booking.findMany({
  where: { status: query.status },
});
```
