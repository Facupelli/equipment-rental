# Domain Service

## Role

A Domain Service encapsulates business logic that does not naturally belong to a single entity or aggregate. It is used when a rule or operation involves multiple entities, requires coordination across aggregate boundaries, or would force an entity to know about things outside its own scope.

Domain Services are pure domain objects. They operate only on domain types and have no infrastructure dependencies.

---

## Rules

### Use it only when the logic does not fit an entity

- Before creating a Domain Service, ask: does this logic belong to one of the entities involved? If yes, put it there.
- Domain Services are for logic that genuinely spans multiple aggregates or requires information from multiple sources that no single entity should own.
- A Domain Service that is just an excuse to keep entities anemic is an anti-pattern. Entities must hold their own business logic.

### Stateless

- Domain Services have no mutable instance state. They do not hold data between calls.
- All input comes through method parameters. All output is returned.
- If a Domain Service is stateless and has no collaborators, prefer a plain class over framework-managed wiring.

### No infrastructure dependencies

- Domain Services do not inject or call `PrismaService`, EventEmitter2, or any NestJS service.
- If the logic requires fetching data, the Application Service or a repository loads the data and passes it to the Domain Service as parameters.
- If the logic requires persisting data, the Application Service handles persistence after the Domain Service returns.

### Return Result for recoverable failures

- If the domain service can produce an expected, recoverable domain error, return a `Result` type.
- Do not throw for expected business failures.
- Pure calculation or validation services may also return plain values when there is no meaningful recoverable failure to model.

### NestJS integration

- Domain Services are domain-layer constructs first, not framework constructs.
- If a Domain Service is stateless, pure, and has no dependencies, prefer a plain class with no `@Injectable()`.
- If a Domain Service benefits from dependency injection for composition, reuse, or wiring consistency, it may be decorated with `@Injectable()` and registered as a module provider.
- Do not introduce `@Injectable()` purely to satisfy convention when direct instantiation is simpler.
- Whether plain or injectable, Domain Services remain internal to the module unless there is a clear, intentional reason to expose them.

### Naming

- File: `[concept-name].service.ts` (within the `domain/` folder to distinguish from Application Services)
- Class: `[ConceptName]Service` — e.g. `BookingAvailabilityService`, `PricingService`, `RentalPeriodCalculatorService`

---

## Structure

```typescript
import { Result, ok, err } from 'neverthrow';
import { BookingEntity } from './booking.entity';
import { BookingPeriod } from './booking-period.value-object';
import { EquipmentUnavailableError } from './errors/booking.errors';

export class BookingAvailabilityService {
  /**
   * Checks whether a given period is available for an equipment item,
   * given its existing non-cancelled bookings.
   *
   * This logic spans multiple BookingEntity instances and does not
   * belong to any single one of them.
   */
  checkAvailability(period: BookingPeriod, existingBookings: BookingEntity[]): Result<void, EquipmentUnavailableError> {
    const hasConflict = existingBookings.some((booking) => booking.period.overlaps(period));

    if (hasConflict) {
      return err(new EquipmentUnavailableError());
    }

    return ok(undefined);
  }
}
```

When dependency injection genuinely adds value, an injectable Domain Service is also acceptable:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class BookingAvailabilityService {
  checkAvailability(period: BookingPeriod, existingBookings: BookingEntity[]) {
    // same pure domain logic
  }
}
```

### Application Service using a Domain Service

```typescript
// Application Service loads aggregates, passes them to the Domain Service, handles the result
@CommandHandler(CreateBookingCommand)
export class CreateBookingService implements ICommandHandler<CreateBookingCommand> {

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly bookingAvailability: BookingAvailabilityService,
  ) {}

  async execute(command: CreateBookingCommand) {
    // 1. Load what the Domain Service needs
    const existingBookings = await this.bookingRepository.findActiveForEquipment(
      command.tenantId,
      command.equipmentId,
    );

    // 2. Delegate domain logic to the Domain Service
    const availabilityResult = this.bookingAvailability.checkAvailability(
      command.period,
      existingBookings,
    );
    if (availabilityResult.isErr()) {
      return err(availabilityResult.error);
    }

    // 3. Continue with the use case
    const booking = BookingEntity.create({ ... });
    await this.bookingRepository.save(booking);
    return ok({ id: booking.id });
  }
}
```

---

## Examples

### ✅ Correct: logic that spans multiple entities goes in a Domain Service

```typescript
// Availability depends on comparing a period against multiple existing bookings —
// no single BookingEntity can own this check
checkAvailability(period: BookingPeriod, existingBookings: BookingEntity[]): Result<void, EquipmentUnavailableError> {
  const hasConflict = existingBookings.some((b) => b.period.overlaps(period));
  if (hasConflict) return err(new EquipmentUnavailableError());
  return ok(undefined);
}
```

### ❌ Wrong: logic that belongs to a single entity extracted into a Domain Service

```typescript
// confirm() is BookingEntity's own responsibility — not a cross-entity concern
confirmBooking(booking: BookingEntity): void {
  if (booking.status !== BookingStatus.PENDING) { ... }
  // This should be booking.confirm()
}
```

---

### ✅ Correct: Domain Service receives loaded data as parameters — no Prisma inside

```typescript
// The Application Service loads the data, the Domain Service receives it
checkAvailability(period: BookingPeriod, existingBookings: BookingEntity[]): Result<...> { ... }
```

### ❌ Wrong: Domain Service fetches data from the database directly

```typescript
@Injectable()
export class BookingAvailabilityService {
  constructor(private readonly prisma: PrismaService) {} // infrastructure in domain — wrong

  async checkAvailability(equipmentId: string, period: BookingPeriod) {
    const records = await this.prisma.booking.findMany({ ... }); // domain must not do this
  }
}
```
