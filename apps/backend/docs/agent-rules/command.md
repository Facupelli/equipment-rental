# Command

## Role

A Command is a plain object that represents a user's intent to change state. It carries the input data needed to execute a single use case. It is created by the controller and dispatched to the `CommandBus`, which routes it to the corresponding Application Service (`@CommandHandler`).

Commands are application-layer objects. They are not domain objects and not DTOs — they sit between the two.

---

## Rules

### One command per use case

- Each state-changing use case has its own Command class.
- A Command describes a single, atomic intent: `CreateBookingCommand`, `CancelBookingCommand`, `AssignEquipmentCommand`.

### Shape

- Commands are plain classes with `readonly` properties and a single constructor.
- No methods, no business logic, no validation.
- Properties should use domain types where appropriate (e.g. `BookingPeriod` instead of two raw `Date` fields). The controller is responsible for constructing domain types before building the Command.
- Properties that are already primitives in the domain (IDs, strings, enums) stay as primitives.

### No return data

- Commands signal intent to change state. They do not return business data.
- The corresponding handler returns at most a minimal confirmation: the `id` of a created resource, or `void`.
- Use a `Result` type as the return if the use case can fail with a known domain error.

### Naming

- File: `[use-case-name].command.ts`
- Class: `[UseCaseName]Command`

### Separation from DTOs

- A Command is not a DTO. Do not reuse the DTO class as a Command.
- The controller maps the DTO to a Command. They may look similar but serve different purposes and evolve independently.

---

## Structure

```typescript
import { BookingPeriod } from '../../domain/booking-period.value-object';

export class CreateBookingCommand {
  constructor(
    public readonly tenantId: string,
    public readonly equipmentId: string,
    public readonly customerId: string,
    public readonly period: BookingPeriod,
  ) {}
}
```

For commands with many properties, a props object can be used instead of positional arguments:

```typescript
export class CreateBookingCommand {
  public readonly tenantId: string;
  public readonly equipmentId: string;
  public readonly customerId: string;
  public readonly period: BookingPeriod;

  constructor(props: { tenantId: string; equipmentId: string; customerId: string; period: BookingPeriod }) {
    this.tenantId = props.tenantId;
    this.equipmentId = props.equipmentId;
    this.customerId = props.customerId;
    this.period = props.period;
  }
}
```

---

## Examples

### ✅ Correct: controller builds domain type before constructing the command

```typescript
// In the controller
const command = new CreateBookingCommand({
  tenantId: this.getTenantId(),
  equipmentId: dto.equipmentId,
  customerId: dto.customerId,
  period: new BookingPeriod(dto.startDate, dto.endDate), // domain type constructed here
});
```

### ❌ Wrong: passing raw primitives when a domain type exists

```typescript
// The command now leaks the BookingPeriod construction concern into the handler
const command = new CreateBookingCommand({
  tenantId: this.getTenantId(),
  equipmentId: dto.equipmentId,
  customerId: dto.customerId,
  startDate: dto.startDate, // raw primitives — handler now has to know how to build BookingPeriod
  endDate: dto.endDate,
});
```

---

### ✅ Correct: command carries only what the use case needs

```typescript
export class CancelBookingCommand {
  constructor(
    public readonly bookingId: string,
    public readonly tenantId: string,
    public readonly reason: string,
  ) {}
}
```

### ❌ Wrong: command carries the full entity or DTO

```typescript
export class CancelBookingCommand {
  constructor(
    public readonly booking: BookingEntity, // entities are not command payload
  ) {}
}
```
