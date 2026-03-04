# Architecture Rules

## Project Structure

```
src/modules/<feature>/
├── domain/           # Entities, Aggregates, Value Objects, Domain Errors, Ports
├── application/      # Use Cases, Command Handlers, Query Handlers, PublicApi
├── infrastructure/   # Repository implementations, persistence models, mappers, adapters
├── <feature>.module.ts
```

---

## Layer Rules

Dependencies flow **inward only**. Domain knows nothing outside itself.

| Layer          | Can Depend On       | Never On                        |
| -------------- | ------------------- | ------------------------------- |
| Domain         | Nothing             | Application, Infrastructure     |
| Application    | Domain              | Infrastructure, Presentation    |
| Infrastructure | Domain, Application | Presentation                    |
| Presentation   | Application         | Domain, Infrastructure directly |

---

## Domain Layer

### Entities and Aggregates

Entities encapsulate business rules and protect their own invariants. An Aggregate is a cluster of entities and value objects under a single root. The Aggregate Root is the only entry point — no external code reaches inside.

```typescript
// Good — state changes go through methods that enforce invariants
order.confirm();
order.cancel(reason);

// Bad — direct property mutation bypasses invariants
order.status = OrderStatus.CONFIRMED;
```

Every entity has two static factories — never an empty constructor:

```typescript
// create() — called when the user initiates something new. Validates all inputs.
static create(props: CreateOrderProps): Order {
  if (!props.period) throw new InvalidRentalPeriodException();
  return new Order(randomUUID(), props.period, OrderStatus.PENDING);
}

// reconstitute() — called only by the repository mapper. Skips validation.
// Data from the DB is already trusted — re-validating it is incorrect and fragile.
static reconstitute(props: ReconstitutOrderProps): Order {
  return new Order(props.id, props.period, props.status);
}
```

Additional rules:

- Make properties that never change after creation `readonly`.
- Equality between entities is determined by identity (`id`), not property values.
- Aggregates publish **Domain Events** when something meaningful happens. They do not call services directly.
- Only Aggregate Roots are retrieved directly via repositories. Internal entities are accessed through the root.
- Cross-aggregate references use IDs only — never hold a direct object reference to another aggregate.

```typescript
// Bad — Order holds a direct reference to Asset (two aggregates coupled)
export class Order {
  constructor(public readonly asset: Asset) {}
}

// Good — Order references Asset by ID only
export class Order {
  constructor(public readonly assetId: string) {}
}
```

### Value Objects

Value Objects have no identity. Equality is structural. They are immutable and self-validating.

```typescript
export class RentalPeriod extends ValueObject<{ start: Date; end: Date }> {
  constructor(start: Date, end: Date) {
    if (end <= start) throw new InvalidRentalPeriodException();
    super({ start, end });
  }

  durationMinutes(): number {
    return (this.props.end.getTime() - this.props.start.getTime()) / 60000;
  }
}
```

Use Value Objects for: `RentalPeriod`, `Money`, `Email`, `TrackingMode`, and any primitive that carries business rules or behavior. This eliminates primitive obsession and enforces invariants at the boundary.

### Domain Services

Use a Domain Service when business logic spans multiple aggregates and doesn't naturally belong to either one.

```typescript
// PricingCalculator spans ProductType, PricingTiers, and PricingRules —
// it doesn't belong inside any single aggregate
export class PricingCalculator {
  calculate(period: RentalPeriod, productType: ProductType, rules: PricingRule[]): Money {
    const units = Math.ceil(period.durationMinutes() / productType.billingUnit.durationMinutes);
    const base = productType.resolveTier(units).pricePerUnit * units;
    return this.applyRules(base, rules);
  }
}
```

Domain Services contain domain logic only — no infrastructure, no repositories, no external calls.

### Domain Events

Aggregates emit Domain Events to signal that something meaningful happened. Event handlers react to them — enabling loose coupling between aggregates without direct calls.

```typescript
// Inside the aggregate
this.addEvent(new OrderConfirmedEvent({ orderId: this.id, period: this.period }));

// Separate handler reacts — no coupling to the Order aggregate
class SendConfirmationOnOrderConfirmed implements IDomainEventHandler {
  handle(event: OrderConfirmedEvent) { ... }
}
```

Domain Events are published by the **repository base class after saving** — not in the command handler. This guarantees events only fire after the aggregate is successfully persisted.

```typescript
// In the repository base class
async save(aggregate: AggregateRoot): Promise<void> {
  await this.persist(aggregate);
  await this.publishEvents(aggregate.pullDomainEvents()); // ← after persist
}
```

Avoid long event chains (Event → Event → Event). When a workflow has many ordered steps, use an orchestrating Application Service instead. Events broadcast facts — they don't sequence workflows.

### Guarding vs Validating — Two Different Error Mechanisms

These look similar but serve completely different purposes. Never conflate them.

**Entity exceptions** guard invariants. They represent illegal states — bugs or corrupted input that slipped past validation. They always `throw`. They live in `domain/exceptions/`.

```typescript
// Illegal state — this must never happen if the system works correctly
export class InvalidRentalPeriodException extends Error {
  constructor() { super('Rental period end must be after start'); }
}

// Throws inside the entity — loud and immediate
static create(props: CreateOrderProps): Order {
  if (props.period.end <= props.period.start) throw new InvalidRentalPeriodException();
}
```

**Business outcome errors** represent expected, valid situations where the answer is simply "no". They are returned via `Result` — never thrown. They live in `domain/errors/` or `application/errors/`.

```typescript
// Expected outcome — a user booking a taken slot is not a bug
export class AssetNotAvailableError extends Error {
  constructor() {
    super('Asset is not available for the requested period');
  }
}

// Returned, not thrown
if (!asset.isAvailableFor(command.period)) {
  return err(new AssetNotAvailableError());
}
```

The rule: if it can happen in normal business operation and the user might recover from it — return it. If it means something is broken — throw it.

### Domain Error Result Type

```typescript
export class Ok<T> {
  constructor(public readonly value: T) {}
  isOk(): this is Ok<T> {
    return true;
  }
  isErr(): this is Err<never> {
    return false;
  }
}

export class Err<E> {
  constructor(public readonly error: E) {}
  isOk(): this is Ok<never> {
    return false;
  }
  isErr(): this is Err<E> {
    return true;
  }
}

export type Result<T, E = Error> = Ok<T> | Err<E>;
export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E>(error: E): Err<E> => new Err(error);
```

### Ports (Repository Ports)

Ports are abstract classes that define what infrastructure must provide. Domain and Application depend only on the port — never on the concrete implementation.

Repository Ports define persistence only. `load` and `save` exclusively. No query methods, no filtering, no pagination.

```typescript
export abstract class AssetRepositoryPort {
  abstract load(id: string): Promise<Asset | null>;
  abstract save(asset: Asset): Promise<void>;
}
```

---

## Application Layer

### Command Handlers

Command Handlers orchestrate domain logic. They do not contain business rules themselves.

Responsibilities:

- Load aggregates from repositories via ports
- Call domain methods on those aggregates
- Coordinate multiple aggregates via Domain Services when needed
- Persist changes back through repository ports

```typescript
export class CreateBookingHandler implements ICommandHandler<CreateBookingCommand> {
  constructor(
    private readonly orderRepo: OrderRepositoryPort,
    private readonly inventoryApi: InventoryPublicApi,
  ) {}

  async execute(command: CreateBookingCommand): Promise<Result<string, BookingError>> {
    const reservation = await this.inventoryApi.reserveAsset(command);
    if (!reservation) return err(new AssetNotAvailableError());

    const order = Order.create({ ...command, assetId: reservation.assetId });
    await this.orderRepo.save(order);
    return ok(order.id);
  }
}
```

One handler per use case. Handlers must not call other Command Handlers — use Domain Events for side effects instead.

### Query Handlers

Queries are read-only and bypass the domain model entirely. Query handlers go directly to the database and return flat DTOs. No aggregates, no repositories, no mappers.

```typescript
export class FindAvailableAssetsQueryHandler implements IQueryHandler<FindAvailableAssetsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindAvailableAssetsQuery) {
    return this.prisma.asset.findMany({
      where: {
        productTypeId: query.productTypeId,
        locationId: query.locationId,
        assignments: {
          none: { period: { overlaps: query.period } },
        },
      },
    });
  }
}
```

Use **CommandBus** and **QueryBus** to dispatch. This decouples invokers from handlers and allows cross-module access without direct imports.

### Module Public API — Writes and Domain Decisions Only

The cross-module contract for writes and domain-level decisions. Lives in `application/`. Implemented by the module's Application Service.

```typescript
export abstract class InventoryPublicApi {
  abstract reserveAsset(dto: ReserveAssetDto): Promise<AssetDto | null>;
  abstract blockAsset(dto: BlockAssetDto): Promise<void>;
}
```

**Why this distinction matters:** module boundaries are about ownership of rules, not just separation of code. PublicApi forces domain logic to stay co-located with the data it governs.

Use **PublicApi** when the target module must apply its own domain rules or change its own state. Use **QueryBus** when you just need data and the calling module makes no domain decision from it.

```typescript
// QueryBus — InventoryModule is a passive data provider, no rules enforced
const assets = await this.queryBus.execute(new FindAvailableAssetsQuery(...));

// PublicApi — InventoryModule actively enforces availability rules,
// selects a unit based on tracking mode, creates an AssetAssignment
const reservation = await this.inventoryApi.reserveAsset(dto);
```

If you find yourself reading raw data from another module and making a domain decision from it in the caller — that logic belongs in the source module's PublicApi, not in the caller.

---

## Infrastructure Layer

### Repositories

Repositories implement the Repository Port. They map between domain aggregates and persistence models using a Mapper, and publish domain events after saving.

```typescript
export class OrderRepository implements OrderRepositoryPort {
  async load(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    return row ? OrderMapper.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    const row = OrderMapper.toPersistence(order);
    await this.prisma.order.upsert({ where: { id: row.id }, update: row, create: row });
    await this.publishEvents(order.pullDomainEvents());
  }
}
```

### Persistence Models and Mappers

Domain models and database schemas are separate. A Mapper converts between them so that database changes never leak into domain logic.

```typescript
export class OrderMapper {
  static toDomain(row: OrderRow): Order {
    return Order.reconstitute({ id: row.id, period: new RentalPeriod(row.periodStart, row.periodEnd), status: row.status });
  }
  static toPersistence(order: Order): OrderRow { ... }
}
```

Note: mappers always call `Entity.reconstitute()` — never `Entity.create()`. Reconstitution skips creation validation since the data is already trusted from the database.

### Adapters

Adapters implement ports for out-of-process concerns: email, payment gateways, external APIs, message brokers. Never called directly — always through a port interface.

---

## Injection Pattern

Always use the abstract class as the injection token. Never use string tokens.

```typescript
// Module providers:
{ provide: AssetRepositoryPort, useClass: AssetRepository },
{ provide: InventoryPublicApi,  useClass: InventoryApplicationService },

// Consumer:
constructor(
  private readonly assetRepo: AssetRepositoryPort,
  private readonly inventoryApi: InventoryPublicApi,
) {}
```

---

## Controllers

Controllers parse requests, delegate to a handler via CommandBus or QueryBus, and map results to HTTP responses. No business logic in controllers.

One controller per use case per trigger type:

```
create-booking.http.controller.ts      ← REST
create-booking.cli.controller.ts       ← CLI
create-booking.message.controller.ts   ← Message broker
```

Controllers map domain errors to HTTP status codes:

```typescript
const result = await this.commandBus.execute(command);

if (result.isErr()) {
  const error = result.error;
  if (error instanceof AssetNotAvailableError) throw new ConflictException(error.message);
  throw error; // unknown errors become 500
}

return new BookingResponseDto(result.value);
```

---

## DTOs

**Request DTOs** define the inbound API contract. Validate with `class-validator`. First line of defense against invalid data.

**Response DTOs** whitelist what is returned. Never return an entity, aggregate, or persistence model directly — this prevents data leaks when internal models change.

Commands and DTOs are distinct. A DTO is a data contract for the API boundary. A Command is a serializable intent for the domain. They may look similar but must be kept separate — DTOs ensure API backward compatibility independent of domain model changes.

---

## Module Map

| Module             | Responsibility                                                            |
| ------------------ | ------------------------------------------------------------------------- |
| `tenant-module`    | Tenant onboarding, locations, billing unit activation                     |
| `catalog-module`   | ProductTypes, ProductCategories, Bundles, BundleComponents                |
| `pricing-module`   | PricingTiers, PricingRules — isolated to prevent catalog ↔ order coupling |
| `inventory-module` | Assets, AssetAssignments, availability, blackout and maintenance blocks   |
| `order-module`     | Orders, OrderItems, booking lifecycle, order state machine                |
| `customer-module`  | Customer lifecycle                                                        |
| `user-module`      | Users, Roles, Permissions (CASL)                                          |
| `auth-module`      | JWT, sessions, refresh tokens, guards                                     |

Cross-module rule: **PublicApi for writes and domain decisions, QueryBus for reads**. Never access another module's tables, repositories, or internal services directly.

---

## Availability & Booking — Critical Domain Rules

- `AssetAssignment` is the single source of truth for availability. All availability queries target it — regardless of assignment type (`ORDER`, `BLACKOUT`, `MAINTENANCE`).
- The `EXCLUDE USING gist (asset_id WITH =, period WITH &&)` constraint is the database-level safety net. Domain validation runs first; the constraint catches anything that slips through concurrent writes.
- All Order status transitions go through a **single state machine service**. Never set `order.status` directly in a handler or controller.
- Bundle availability = AND condition across all component product types. If one component has no available asset, the entire bundle is unavailable.
- Bundle composition is **snapshotted onto the OrderItem at booking time**. Changes to a Bundle definition never affect existing Orders.

---

## Multi-Tenancy

Row-level isolation. Every tenant-scoped table has a `tenantId` column. Injected automatically via **Prisma middleware + AsyncLocalStorage**. Never pass `tenantId` manually through handlers, services, or repositories.

The middleware must support an explicit super-admin bypass — designed intentionally from the start, not added later as a workaround.

---

## Anti-Patterns

- Business logic in Controllers or Command Handlers — logic belongs in domain objects
- Query methods on a RepositoryPort — repositories are `load`/`save` only
- Direct imports between modules — use PublicApi or QueryBus
- PublicApi used for reads — reads go through QueryBus
- Reading another module's raw data and making a domain decision from it in the caller — push that logic into the source module's PublicApi
- One Command Handler calling another — use Domain Events for side effects
- Setting Order status directly — always go through the state machine
- Returning entities or persistence models from controllers — always use Response DTOs
- String injection tokens — use abstract class as token
- Calling `Entity.create()` inside a repository mapper — always use `Entity.reconstitute()`
- Throwing business outcome errors — return them via Result
- Returning entity exception types via Result — throw them
- Skipping the spec for non-trivial tasks
