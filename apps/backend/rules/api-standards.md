# API Standards

## Validation — DTOs with nestjs-zod

All input validation uses Zod schemas via `nestjs-zod`. Never use `class-validator`.

```typescript
// ✅ CORRECT
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateBookingSchema = z.object({
  equipmentId: z.string().uuid(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  quantity: z.number().int().positive().optional(),
});

export class CreateBookingDto extends createZodDto(CreateBookingSchema) {}
```

**Rule:** Infer types from Zod schemas. Never use `any`. Never define a separate TypeScript
interface that duplicates a Zod schema.

```typescript
// ✅ CORRECT — inferred from schema
type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// ❌ WRONG — manual duplication, will drift
interface CreateBookingInput {
  equipmentId: string;
  startAt: Date;
  endAt: Date;
}
```

---

## Response Formatting

A `ResponseInterceptor` wraps all controller responses automatically.

| Case           | Shape                                                           |
| -------------- | --------------------------------------------------------------- |
| Single entity  | `{ data: <entity> }`                                            |
| Paginated list | `{ data: <items[]>, meta: { total, page, limit, totalPages } }` |

**Rule:** Controllers return raw data. Never manually wrap in `{ data: ... }`.

```typescript
// ✅ CORRECT — interceptor handles wrapping
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.getBookingUseCase.execute(id);
}

// ❌ WRONG — manual wrapping
@Get(':id')
async findOne(@Param('id') id: string) {
  const booking = await this.getBookingUseCase.execute(id);
  return { data: booking };
}
```

---

## Error Handling — Problem Details (RFC 7807)

Errors are handled by a global Exception Filter that converts NestJS exceptions to
Problem Details format. Do not build custom error JSON structures in controllers or services.

**Rule:** Throw standard NestJS exceptions. The filter does the rest.

```typescript
// ✅ CORRECT
throw new NotFoundException(`Booking ${id} not found`);
throw new ConflictException(`Equipment already booked for this period`);
throw new ForbiddenException(`You do not have permission to cancel this booking`);

// ❌ WRONG — custom error structure bypasses the filter
return res.status(404).json({ error: true, message: 'Not found' });
```

---

## Anti-Patterns

- Do not put business logic in Controllers. Delegate to Use Cases.
- Do not use `any` type — use Zod inference or explicit types.
- Do not manually wrap responses in `{ data: ... }`.
- Do not throw raw `Error` objects — use NestJS exception classes.
