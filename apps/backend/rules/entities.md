# Entity & Mapper Rules

## The DDD Trilemma Decision

This project prioritizes: **Purity > Encapsulation > Performance**

Purity means a domain entity has zero dependencies on external services, libraries,
or infrastructure. It depends on nothing outside the Domain layer.

When encapsulation and purity conflict — i.e. enforcing a business rule requires I/O
(a DB query, an API call) — purity wins. The rule moves out of the entity into a
**Domain Service**. The entity stays clean.

Performance is never a reason to compromise either. If a use case has performance
requirements, solve them at the Infrastructure layer (query optimization, indexes,
caching) — not by injecting repositories into entities.

---

## What Belongs Inside an Entity

An entity is responsible for:

- **Enforcing format and structural invariants** — rules that can be checked with
  the data already in memory (e.g. email must contain @, quantity must be > 0,
  percentage must be between 0 and 100).
- **Encapsulating state transitions** — methods like `cancel()`, `activate()`,
  `updateStock()` that mutate state while enforcing the rules of that transition.
- **Protecting its own identity** — entities are identified by `id`, not by value.

An entity is NOT responsible for:

- **Uniqueness checks** — requires a DB query. Belongs in a Domain Service.
- **Cross-aggregate rules** — belongs in a Domain Service or Use Case.
- **Persistence** — belongs in a Repository (Infrastructure).
- **HTTP input parsing** — belongs in DTOs (Presentation).

---

## Validation: Entities

Entities enforce invariants with explicit guard clauses that throw named domain
exceptions. This keeps the domain expressive and exceptions catchable specifically
in Use Cases.

```typescript
// ✅ CORRECT — pure guard clause, domain-named exception
if (!email.includes('@')) {
  throw new InvalidEmailException(email);
}

// ❌ WRONG — Zod in the domain layer
const result = EmailSchema.safeParse(email);
if (!result.success) throw new Error('Invalid email');
```

**Why re-validate in the entity if the DTO already validated?**

Because entities are constructed from more than HTTP requests. Seeding scripts,
internal services, event handlers, and migration jobs all bypass DTOs. The entity
is the last line of defense — its invariants must hold regardless of how it was
constructed.

DTO validation is a convenience for the caller. Entity validation is a guarantee
for the system.

---

## Entity Structure

Entities are created exclusively via a static factory method. Direct construction
(`new Entity(...)`) is never called outside the entity itself.

```typescript
// domain/entities/product.entity.ts

export class Product {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly trackingType: TrackingType,
    public readonly totalStock: number | null,
  ) {}

  // Factory for creating a new product (generates id, enforces invariants)
  static create(props: CreateProductProps): Product {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidProductNameException();
    }

    if (props.trackingType === TrackingType.BULK && props.totalStock == null) {
      throw new BulkProductRequiresStockException();
    }

    if (props.trackingType === TrackingType.SERIALIZED && props.totalStock != null) {
      throw new SerializedProductCannotHaveStockException();
    }

    return new Product(
      crypto.randomUUID(),
      props.tenantId,
      props.name.trim(),
      props.trackingType,
      props.totalStock ?? null,
    );
  }

  // Factory for reconstituting from persistence (id already exists, no invariant re-check)
  static reconstitute(props: ReconstitueProductProps): Product {
    return new Product(props.id, props.tenantId, props.name, props.trackingType, props.totalStock);
  }
}
```

Two factories, always:

- `create()` — for new entities. Generates the `id`. Runs all guard clauses.
- `reconstitute()` — for entities loaded from the DB. Skips guard clauses —
  the data was already valid when it was persisted. Trust the DB, skip the checks.

---

## Domain Exceptions

Every invariant violation throws a named domain exception, never a generic `Error`.
Domain exceptions live in `domain/exceptions/`.

```typescript
// domain/exceptions/invalid-product-name.exception.ts
export class InvalidProductNameException extends Error {
  constructor() {
    super('Product name cannot be empty.');
    this.name = 'InvalidProductNameException';
  }
}
```

Use Cases catch domain exceptions and translate them to HTTP exceptions at the
Presentation layer. Domain exceptions never leak to the HTTP response directly.

```typescript
// application — Use Case catches and translates
try {
  const product = Product.create(props);
} catch (e) {
  if (e instanceof InvalidProductNameException) {
    throw new BadRequestException(e.message);
  }
  throw e;
}
```

---

## Domain Services

When a business rule requires I/O, it moves out of the entity into a Domain Service.
Domain Services live in `domain/services/`.

Domain Services are pure orchestrators: they depend on Repository Ports (interfaces),
never on Prisma directly.

```typescript
// domain/services/product-uniqueness.service.ts

@Injectable()
export class ProductUniquenessService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepositoryPort,
  ) {}

  async assertNameIsUnique(tenantId: string, name: string): Promise {
    const exists = await this.productRepo.existsByName(tenantId, name);
    if (exists) {
      throw new DuplicateProductNameException(name);
    }
  }
}
```

The Use Case calls the Domain Service before calling the entity factory:

```typescript
// application — Use Case orchestrates
await this.productUniquenessService.assertNameIsUnique(tenantId, name);
const product = Product.create({ tenantId, name, trackingType, totalStock });
await this.productRepo.save(product);
```

---

## Mappers

A Mapper translates between two representations: the Prisma DB record and the
Domain Entity. Mappers live in `infrastructure/mappers/`.

**Rule: Never use a raw Prisma record directly in the Application or Domain layer.
Always map first.**

```typescript
// infrastructure/mappers/product.mapper.ts

export class ProductMapper {
  // Prisma record → Domain Entity (uses reconstitute, not create)
  static toDomain(raw: PrismaProduct): Product {
    return Product.reconstitute({
      id: raw.id,
      tenantId: raw.tenant_id,
      name: raw.name,
      trackingType: raw.tracking_type as TrackingType,
      totalStock: raw.total_stock,
    });
  }

  // Domain Entity → Prisma create/update input
  static toPersistence(entity: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      name: entity.name,
      tracking_type: entity.trackingType,
      total_stock: entity.totalStock,
    };
  }
}
```

Mappers never contain business logic. They only translate field names and types.
If a mapping requires a decision, that decision belongs upstream in the entity or
Use Case.

---

## Summary: Decision Table

| Question                                   | Answer                     |
| ------------------------------------------ | -------------------------- |
| Can it be checked with in-memory data?     | Guard clause inside entity |
| Does it require a DB query?                | Domain Service             |
| Does it require calling another aggregate? | Domain Service or Use Case |
| Where does Zod live?                       | Presentation layer only    |
| Where do Prisma types live?                | Infrastructure layer only  |
| Who translates Prisma ↔ Entity?            | Mapper (Infrastructure)    |
| Who calls the Mapper?                      | Repository implementation  |
