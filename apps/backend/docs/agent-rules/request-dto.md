# Request DTO

## Role

A Request DTO defines the shape and validation rules for data arriving from the outside world (HTTP body, query params, route params). It is the first line of defense against invalid input — data that passes DTO validation is considered safe to pass to the application layer.

Request DTOs are defined as Zod schemas using `nestjs-zod`. They are an API contract between the client and the server. They are **not** domain objects and must not contain business logic.

---

## Rules

### Validation is the only responsibility

- A Request DTO validates and types incoming data. Nothing else.
- Do not put business rules here. "Equipment must be available" is a domain rule. "startDate must be a valid ISO date" is a DTO validation rule.
- Do not import domain objects (entities, value objects, domain errors) into a DTO file.

### Use Zod schemas via nestjs-zod

- Always define a Zod schema first, then derive the class with `createZodDto()`.
- The schema is the single source of truth. The class is only needed for NestJS DI and pipe integration.
- Export both the schema (for reuse in tests or other schemas) and the DTO class (for use in the controller).

### Primitives only

- DTO properties must be primitives or plain objects/arrays of primitives. No domain objects, no Value Objects.
- Dates should be coerced with `z.coerce.date()` so that ISO string inputs from HTTP are automatically converted to `Date`.
- UUIDs should be validated with `z.string().uuid()`.

### Separation from Commands

- A Request DTO and a Command are different types and must not be merged into one.
- The controller maps the DTO to a Command. The DTO is transport-layer; the Command is application-layer.
- This allows the API contract (DTO) to evolve independently of the domain command structure.

### Naming

- File: `[use-case-name].request.dto.ts`
- Schema: `[UseCaseName]Schema`
- Class: `[UseCaseName]RequestDto`

---

## Structure

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBookingSchema = z.object({
  equipmentId: z.string().uuid(),
  customerId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export class CreateBookingRequestDto extends createZodDto(CreateBookingSchema) {}
```

For query params (GET requests), use the same pattern but note that all query params arrive as strings — always coerce types explicitly:

```typescript
export const FindBookingsSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export class FindBookingsRequestDto extends createZodDto(FindBookingsSchema) {}
```

---

## Examples

### ✅ Correct: schema validates format and type, not business rules

```typescript
export const CreateBookingSchema = z.object({
  equipmentId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
```

### ❌ Wrong: business rule inside the DTO schema

```typescript
export const CreateBookingSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(
    (data) => data.endDate > data.startDate,
    { message: 'endDate must be after startDate' }, // this is a domain invariant — belongs in BookingPeriod
  );
```

> **Note on the above**: the `endDate > startDate` rule is a domain invariant of `BookingPeriod`. It should be enforced there, not in the DTO. The DTO only guarantees both are valid dates.

---

### ✅ Correct: controller maps DTO to Command — they stay separate

```typescript
// In the controller
@Post()
async create(@Body() dto: CreateBookingRequestDto) {
  const command = new CreateBookingCommand({
    tenantId: this.getTenantId(),   // from request context, not in DTO
    equipmentId: dto.equipmentId,
    customerId: dto.customerId,
    period: new BookingPeriod(dto.startDate, dto.endDate),
  });
  const result = await this.commandBus.execute(command);
  // ...
}
```

### ❌ Wrong: passing the DTO directly to the command bus or service

```typescript
// DTO is not a Command — it carries HTTP-layer concerns and lacks domain typing
await this.commandBus.execute(dto);
```

---

### ✅ Correct: reusing the schema for composition

```typescript
// Shared sub-schema, reused across DTOs
const DateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const CreateBookingSchema = z
  .object({
    equipmentId: z.string().uuid(),
    customerId: z.string().uuid(),
  })
  .merge(DateRangeSchema);
```
