# Entity & Mapper Rules

## 1. DDD Trilemma

Priority: **Purity > Encapsulation > Performance**

Entities have zero dependencies on infrastructure. If a rule requires I/O, move it to a **Domain Service**. Performance is solved at the Infrastructure layer, never inside the domain.

---

## 2. Entity vs Value Object

| Criterion              | Entity                     | Value Object                |
| ---------------------- | -------------------------- | --------------------------- |
| Has its own lifecycle? | Yes                        | No                          |
| Equality by            | `id`                       | All field values            |
| Mutable?               | Yes (via methods)          | No                          |
| Examples               | `Order`, `Product`, `User` | `Email`, `Money`, `Address` |

- Entities live in `domain/entities/`
- Value Objects live in `domain/value-objects/`

---

## 3. Entity Structure

Private constructor. Object params. Two factories. Always.

```typescript
// domain/entities/order.entity.ts

export class Order {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private status: OrderStatus, // private: mutable internal state
    public readonly lines: OrderLine[], // public: readable, set once
  ) {}

  // New entity — generates id, runs all guard clauses
  static create(props: CreateOrderProps): Order {
    if (!props.lines || props.lines.length === 0) {
      throw new OrderMustHaveLinesException();
    }
    return new Order(randomUUID(), props.tenantId, OrderStatus.PENDING, props.lines);
  }

  // From DB — id already exists, skips guard clauses
  static reconstitute(props: ReconstituteOrderProps): Order {
    return new Order(props.id, props.tenantId, props.status, props.lines);
  }
}
```

**Rules:**

- `Props` types are always defined: `CreateXProps` and `ReconstituteXProps`
- Never pass more than one positional argument — always use a props object
- `id` is always generated inside `create()` via `randomUUID()`
- `reconstitute()` never re-runs guard clauses — trust the DB

---

## 4. Encapsulation

Every field must have an explicit visibility modifier. No implicit public.

| Field type                         | Modifier           |
| ---------------------------------- | ------------------ |
| Stable identity / readable outside | `public readonly`  |
| Mutable internal state             | `private`          |
| Immutable but internal             | `private readonly` |
| Constructor                        | `private`          |

```typescript
// ✅ CORRECT
private status: OrderStatus;
public readonly id: string;

// ❌ WRONG — no visibility modifier
status: OrderStatus;
id: string;
```

**No public setters, ever.** State changes only through expressive named methods:

```typescript
// ✅ CORRECT
cancel(): void {
  if (this.status !== OrderStatus.PENDING) {
    throw new CannotCancelNonPendingOrderException();
  }
  this.status = OrderStatus.CANCELLED;
}

// ❌ WRONG
set status(value: OrderStatus) { this.status = value; }
```

**No anemic models.** If a property can change, there must be a named method encoding the business intent of that change.

---

## 5. Aggregate Composition

Children are passed into `reconstitute()` as already-mapped domain objects. **The mapper composes, not the entity.** `OrderMapper.toDomain()` maps all children first, then passes domain objects to `Order.reconstitute()`.

```typescript
// ✅ CORRECT — entity receives domain objects, lines: OrderLine[]
static reconstitute(props: ReconstituteOrderProps): Order {
  return new Order(props.id, props.tenantId, props.status, props.lines);
}

// ❌ WRONG — entity maps its own children
static reconstitute(raw: any): Order {
  const lines = raw.lines.map(l => OrderLine.reconstitute(l)); // mapping is the mapper's job
}
```

---

## 6. Guard Clauses & Domain Exceptions

Guard clauses throw named domain exceptions. Never `throw new Error(...)`.

```typescript
// ✅ CORRECT
if (!props.name || props.name.trim().length === 0) {
  throw new InvalidProductNameException();
}

// ❌ WRONG
if (!props.name) throw new Error('Name is required');
```

Domain exceptions live in `domain/exceptions/`, extend `Error`, and set `this.name`:

```typescript
// domain/exceptions/invalid-product-name.exception.ts
export class InvalidProductNameException extends Error {
  constructor() {
    super('Product name cannot be empty.');
    this.name = 'InvalidProductNameException';
  }
}
```

Use Cases catch domain exceptions and translate them to HTTP exceptions. Domain exceptions never reach the HTTP response directly.

---

## 7. Value Objects

Single constructor with guard clauses. No factory split. Immutable. Implement `equals()`.

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  public readonly value: string;

  constructor(value: string) {
    if (!value.includes('@')) {
      throw new InvalidEmailException(value);
    }
    this.value = value.toLowerCase().trim();
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

- No id, no lifecycle, no two factories
- Equality is always by value, never by reference
- Always immutable — no mutation methods

---

## 8. Mappers

Mappers live in `infrastructure/mappers/`. Two static methods only: `toDomain` and `toPersistence`.

```typescript
// infrastructure/mappers/order.mapper.ts

export class OrderMapper {
  static toDomain(raw: PrismaOrder & { lines: PrismaOrderLine[] }): Order {
    const lines = raw.lines.map(OrderLineMapper.toDomain); // children mapped first
    return Order.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      status: raw.status as OrderStatus,
      lines,
    });
  }

  static toPersistence(entity: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      status: entity.status,
      lines: {
        create: entity.lines.map(OrderLineMapper.toPersistence),
      },
    };
  }
}
```

**Rules:**

- Mappers contain zero business logic — only field translation
- DB columns are snake_case, entity properties are camelCase — the mapper is the only place this translation happens
- Called only by the Repository implementation, never by Use Cases or Domain Services
- Aggregate mappers delegate child mapping to their respective child mappers

---

## 9. Layer Ownership

| Concern                                  | Layer          | Location                       |
| ---------------------------------------- | -------------- | ------------------------------ |
| Guard clauses, invariants                | Domain         | `domain/entities/`             |
| Cross-aggregate / I/O rules              | Domain Service | `domain/services/`             |
| Named exceptions                         | Domain         | `domain/exceptions/`           |
| Value Objects                            | Domain         | `domain/value-objects/`        |
| Field translation (DB ↔ Entity)          | Infrastructure | `infrastructure/mappers/`      |
| Persistence (Prisma)                     | Infrastructure | `infrastructure/repositories/` |
| Input validation (Zod / class-validator) | Presentation   | `presentation/dtos/`           |
| HTTP exception translation               | Application    | `application/use-cases/`       |
