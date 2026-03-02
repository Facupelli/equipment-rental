# Testing Rules

## Philosophy

Test the logic, not the framework. The most valuable tests are unit tests on Application
and Domain layer services — pure TypeScript, no database, no HTTP, fast feedback.

E2E tests are reserved for critical user journeys only (e.g., full booking creation flow).
They are slow and expensive to maintain; use them sparingly.

## Stack

- **Runner:** Jest
- **File convention:** `<filename>.spec.ts` co-located with the file under test
- **E2E convention:** `test/e2e/<feature>.e2e-spec.ts`

---

## Unit Tests — Application Layer Services

The goal is to test Use Case logic in isolation. Mock all external dependencies
(repositories, engines, event emitters) so tests run without a database.

### Pattern: Mock the Port, Test the Use Case

```typescript
// bookings/application/create-booking.use-case.spec.ts

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;
  let bookingRepo: jest.Mocked<BookingRepositoryPort>;
  let priceEngine: jest.Mocked<PriceEngine>;

  beforeEach(() => {
    bookingRepo = {
      checkOverlap: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<BookingRepositoryPort>;

    priceEngine = {
      calculate: jest.fn(),
    } as jest.Mocked<PriceEngine>;

    useCase = new CreateBookingUseCase(bookingRepo, priceEngine);
  });

  it('should throw ConflictException when equipment is already booked', async () => {
    bookingRepo.checkOverlap.mockResolvedValue(true);

    await expect(
      useCase.execute({ equipmentId: 'eq-1', startAt: new Date(), endAt: new Date(), tenantId: 't-1' })
    ).rejects.toThrow(ConflictException);
  });

  it('should not call save when overlap exists', async () => {
    bookingRepo.checkOverlap.mockResolvedValue(true);

    await expect(useCase.execute({ ... })).rejects.toThrow();
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('should persist booking and return result when no overlap', async () => {
    bookingRepo.checkOverlap.mockResolvedValue(false);
    priceEngine.calculate.mockResolvedValue({ total: 150, currency: 'USD' });
    bookingRepo.save.mockResolvedValue({ id: 'booking-1', ...rest });

    const result = await useCase.execute({ ... });

    expect(result.id).toBe('booking-1');
    expect(bookingRepo.save).toHaveBeenCalledTimes(1);
  });
});
```

### What to Cover in Every Use Case Test

- [ ] Happy path — correct input produces expected output
- [ ] Domain rule violations — overlap, insufficient stock, invalid state transitions
- [ ] Side effects are NOT triggered on failure (save not called, event not emitted)
- [ ] External dependencies are called with correct arguments

---

## Unit Tests — Domain Layer (Pure Logic)

For Value Objects, domain calculations, or any pure function with no dependencies,
test directly without any mocking setup.

```typescript
describe('BookingRange', () => {
  it('should detect overlap between two ranges', () => {
    const a = new BookingRange(new Date('2025-01-01'), new Date('2025-01-10'));
    const b = new BookingRange(new Date('2025-01-05'), new Date('2025-01-15'));

    expect(a.overlaps(b)).toBe(true);
  });

  it('should not detect overlap for adjacent ranges', () => {
    const a = new BookingRange(new Date('2025-01-01'), new Date('2025-01-10'));
    const b = new BookingRange(new Date('2025-01-10'), new Date('2025-01-20'));

    expect(a.overlaps(b)).toBe(false);
  });
});
```

---

## E2E Tests — Critical Journeys Only

Reserved for flows that involve multiple layers working together end-to-end:
HTTP request → Controller → Use Case → DB → Response.

Use a dedicated test database. Seed and clean state in `beforeEach`.

Candidates for E2E coverage:

- Full booking creation (serialized item)
- Full booking creation (bulk item)
- Booking conflict rejection
- Authentication guard enforcement

---

## Anti-Patterns

- Do not test NestJS wiring (that decorators were applied, that modules are imported). Trust the framework.
- Do not write tests that only assert `toBeDefined()`. Test behavior, not existence.
- Do not use real Prisma/DB in unit tests. Mock the repository port.
- Do not skip tests for edge cases just because the happy path passes.
