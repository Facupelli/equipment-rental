# Domain Error

## Role

A Domain Error represents an expected, recoverable business rule violation. It is a normal part of domain operation — not an exceptional failure. Domain Errors are **returned**, not thrown, using the `Result` type from `neverthrow`.

Examples of Domain Errors: equipment is not available for the requested period, a booking cannot be cancelled because it has already started, a tenant has exceeded their credit limit.

Examples of what is NOT a Domain Error: database connection failure, an invariant violated by a bug, a missing required configuration value. Those are exceptional failures and should be thrown as standard exceptions.

---

## Rules

### Return, do not throw

- Domain Errors are returned as `err(new SomeDomainError())` wrapped in a `Result` type.
- The function signature explicitly declares which errors it can return, making all failure cases visible to the caller.
- Never use `throw` for an expected business failure.

### Class hierarchy

- All domain errors extend a base `DomainError` class.
- Each module defines a module-level base error (e.g. `BookingError`) that extends `DomainError`.
- Specific errors extend the module-level base (e.g. `EquipmentUnavailableError extends BookingError`).
- This hierarchy allows callers to catch at different levels of granularity.

### Error message

- Include enough context in the error message to make debugging straightforward: include relevant IDs or values.
- Messages are for developers and logs, not for end users. The controller maps domain errors to user-facing HTTP responses.

### Naming

- File: `[module-name].errors.ts` (all errors for a module in one file)
- Classes: descriptive past-tense or noun phrases — `EquipmentUnavailableError`, `BookingAlreadyConfirmedError`, `InsufficientCreditError`

### What never belongs here

- HTTP status codes.
- User-facing messages.
- Logging calls.

---

## Structure

### Base classes (defined once in core)

```typescript
// src/core/exceptions/domain.error.ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

### Module errors file

```typescript
// modules/booking/domain/errors/booking.errors.ts
import { DomainError } from 'src/core/exceptions/domain.error';

export class BookingError extends DomainError {}

export class EquipmentUnavailableError extends BookingError {
  constructor(equipmentId: string) {
    super(`Equipment ${equipmentId} is not available for the requested period`);
  }
}

export class BookingAlreadyConfirmedError extends BookingError {
  constructor(bookingId: string) {
    super(`Booking ${bookingId} is already confirmed`);
  }
}

export class BookingCannotBeCancelledError extends BookingError {
  constructor(bookingId: string, currentStatus: string) {
    super(`Booking ${bookingId} cannot be cancelled from status '${currentStatus}'`);
  }
}
```

### Using Result in a domain service or entity method

```typescript
import { Result, ok, err } from 'neverthrow';
import { EquipmentUnavailableError } from '../errors/booking.errors';

checkAvailability(
  period: BookingPeriod,
  existingBookings: BookingEntity[],
): Result<void, EquipmentUnavailableError> {
  const hasConflict = existingBookings.some((b) => b.period.overlaps(period));
  if (hasConflict) {
    return err(new EquipmentUnavailableError(this.equipmentId));
  }
  return ok(undefined);
}
```

### Handling Result in the Application Service

```typescript
const result = this.bookingAvailability.checkAvailability(command.period, existingBookings);
if (result.isErr()) {
  return err(result.error); // propagate up to the controller
}
```

### Mapping to HTTP in the Controller

```typescript
const result = await this.commandBus.execute(command);

if (result.isErr()) {
  const error = result.error;
  if (error instanceof EquipmentUnavailableError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof BookingCannotBeCancelledError) {
    throw new UnprocessableEntityException(error.message);
  }
  throw error; // unknown error — propagates as 500
}

return new CreateBookingResponseDto({ id: result.value.id });
```

---

## Examples

### ✅ Correct: expected business failure returned as Result

```typescript
if (hasConflict) {
  return err(new EquipmentUnavailableError(equipmentId));
}
```

### ❌ Wrong: expected business failure thrown as exception

```typescript
if (hasConflict) {
  throw new EquipmentUnavailableError(equipmentId); // invisible to caller at compile time
}
```

---

### ✅ Correct: HTTP mapping only in the controller

```typescript
// Controller maps domain errors to HTTP status codes
if (error instanceof EquipmentUnavailableError) {
  throw new ConflictException(error.message);
}
```

### ❌ Wrong: HTTP concerns inside the domain error class

```typescript
export class EquipmentUnavailableError extends BookingError {
  readonly httpStatus = 409; // domain layer must not know about HTTP
}
```

---

### ✅ Correct: error message includes context for debugging

```typescript
export class EquipmentUnavailableError extends BookingError {
  constructor(equipmentId: string) {
    super(`Equipment ${equipmentId} is not available for the requested period`);
  }
}
```

### ❌ Wrong: vague error message with no context

```typescript
export class EquipmentUnavailableError extends BookingError {
  constructor() {
    super('Equipment not available'); // which equipment? what period?
  }
}
```
