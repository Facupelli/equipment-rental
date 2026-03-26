# Value Object

## Role

A Value Object represents a domain concept that is defined entirely by its properties, not by an identity. Two Value Objects are equal if all their properties are equal. They have no `id`.

Value Objects are **immutable**. Once created, their state never changes. If a different value is needed, a new Value Object is created.

We use Value Objects for **complex, multi-field domain concepts** where the combination of values carries invariants and behavior. We do not create Value Object wrappers for single primitive values.

---

## Rules

### When to create a Value Object

- The concept involves **multiple fields** that always belong together and carry a combined meaning.
- There are **invariants** that involve the relationship between those fields (e.g. end must be after start).
- There is **behavior** that naturally belongs to the concept (e.g. overlap check, serialization, formatting).
- A plain `email: string` or `price: number` does not qualify. Keep those as primitives.

### Immutability

- All properties are `readonly`.
- No setters. No mutation methods.
- Methods that would "change" the value return a new instance instead.

### Construction

- Use a constructor or a `static create()` factory method.
- Validate all invariants in the constructor. Throw a `DomainException` on violation — fail fast.
- Value Objects must always be in a valid state.

### Equality

- Implement an `equals()` method that compares all properties structurally.
- Do not rely on reference equality (`===`) for Value Objects.

### No infrastructure concerns

- Value Objects are pure domain objects. No Prisma, no NestJS, no HTTP.
- If a Value Object needs to be serialized for persistence (e.g. `tstzrange`), it exposes a method for that (e.g. `toPostgresRange()`). The method belongs on the Value Object, but it is called by the mapper — not by the Value Object itself reaching into infrastructure.

### Naming

- File: `[concept-name].value-object.ts`
- Class: `[ConceptName]` (no suffix needed — the name should be expressive on its own, e.g. `BookingPeriod`, `Address`, `MoneyAmount`)

---

## Structure

```typescript
import { DomainException } from 'src/core/exceptions/domain.exception';

export class BookingPeriod {
  readonly start: Date;
  readonly end: Date;

  constructor(start: Date, end: Date) {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      throw new DomainException('BookingPeriod: start must be a valid date');
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      throw new DomainException('BookingPeriod: end must be a valid date');
    }
    if (end <= start) {
      throw new DomainException('BookingPeriod: end must be after start');
    }
    this.start = start;
    this.end = end;
  }

  // Behavior: domain concept logic belongs here
  overlaps(other: BookingPeriod): boolean {
    return this.start < other.end && this.end > other.start;
  }

  contains(date: Date): boolean {
    return date >= this.start && date < this.end;
  }

  durationInDays(): number {
    return Math.ceil((this.end.getTime() - this.start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Serialization for persistence — called by the mapper, not by infrastructure directly
  toPostgresRange(): string {
    return `[${this.start.toISOString()},${this.end.toISOString()})`;
  }

  // Deserialization — used in the mapper when rehydrating from a Prisma record
  static fromDates(start: Date, end: Date): BookingPeriod {
    return new BookingPeriod(start, end);
  }

  // Equality
  equals(other: BookingPeriod): boolean {
    return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
  }
}
```

---

## Examples

### ✅ Correct: Value Object enforces its own invariant on construction

```typescript
const period = new BookingPeriod(startDate, endDate);
// If endDate <= startDate, throws DomainException immediately
```

### ❌ Wrong: invariant checked outside the Value Object

```typescript
// This check belongs inside BookingPeriod, not scattered across services
if (endDate <= startDate) {
  throw new DomainException('end must be after start');
}
const period = new BookingPeriod(startDate, endDate); // now accepts invalid state if check is missed
```

---

### ✅ Correct: "mutation" returns a new instance

```typescript
// Extending a period returns a new Value Object — original is untouched
extendBy(days: number): BookingPeriod {
  const newEnd = new Date(this.end);
  newEnd.setDate(newEnd.getDate() + days);
  return new BookingPeriod(this.start, newEnd);
}
```

### ❌ Wrong: mutating the Value Object's state

```typescript
extend(days: number): void {
  this.end.setDate(this.end.getDate() + days); // breaks immutability
}
```

---

### ✅ Correct: equality via equals()

```typescript
if (existingPeriod.equals(newPeriod)) {
  // same period
}
```

### ❌ Wrong: reference equality

```typescript
if (existingPeriod === newPeriod) {
  // always false for two different object instances, even with identical values
}
```
