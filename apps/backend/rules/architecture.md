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

Rules:

- Entities validate themselves on creation. Use static factory methods (`Entity.create(props)`), never empty constructors.
- Make properties that never change after creation `readonly`.
- Equality between entities is determined by identity (`id`), not by property values.
- Aggregates publish **Domain Events** when something meaningful happens. They do not call other services directly.
- Only Aggregate Roots are retrieved directly via repositories. Internal entities are accessed through the root.
- Cross-aggregate references use IDs only — never hold a direct object reference to another aggregate.

### Value Objects

Value Objects have no identity. Equality is structural. They are immutable and self-validating.

```typescript
// Wrap domain primitives in Value Objects to enforce invariants at the type level
export class RentalPeriod extends ValueObject<{ start: Date; end: Date }> {
  constructor(start: Date, end: Date) {
    if (end <= start) throw new InvalidRentalPeriodError();
    super({ start, end });
  }

  durationMinutes(): number {
    return (this.props.end.getTime() - this.props.start.getTime()) / 60000;
  }
}
```

Use Value Objects for: `RentalPeriod`, `Money`, `Email`, `TrackingMode`, and any primitive that carries business rules or behavior. This eliminates primitive obsession and enforces invariants at the boundary.

### Domain Events

Aggregates emit Domain Events to signal that something meaningful happened. Event handlers react to them — enabling loose coupling between aggregates without direct calls.

```typescript
// Inside the aggregate
this.addEvent(new OrderConfirmedEvent({ orderId: this.id, period: this.period }));

// Separate handler — no coupling to the Order aggregate
class NotifyCustomerOnOrderConfirmed implements IDomainEventHandler {
  handle(event: OrderConfirmedEvent) { ... }
}
```

Domain Events are published after the aggregate is persisted (in the repository base class). All changes triggered by a single command — across multiple aggregates — are wrapped in a single transaction.

Avoid long event chains (Event → Event → Event). When a workflow has many steps, use an orchestrating Application Service instead. Events are for broadcasting facts, not for sequencing complex flows.

### Domain Errors

Domain and Application layers never throw HTTP exceptions. They throw typed domain errors or return a `Result` type. The Presentation layer maps these to HTTP status codes.

```typescript
// Domain error
export class AssetNotAvailableError extends Error {
  constructor() { super('Asset is not available for the requested period'); }
}

// Application service returns Result, never throws HTTP errors
async execute(command: CreateBookingCommand): Promise<Result<string, BookingError>> {
  const asset = await this.assetRepo.load(command.assetId);
  if (!asset.isAvailableFor(command.period)) {
    return Err(new AssetNotAvailableError());
  }
  // ...
  return Ok(order.id);
}

// HTTP controller maps domain errors to status codes
const result = await this.commandBus.execute(command);
match(result, {
  Ok: (id) => new IdResponse(id),
  Err: (e) => {
    if (e instanceof AssetNotAvailableError) throw new ConflictHttpException(e.message);
    throw e;
  }
});
```

### Ports (Repository Ports)

Ports are interfaces (abstract classes) that define what infrastructure must provide. Domain and Application layers depend only on the port — never on the concrete implementation.

Repository Ports define persistence only. `load` and `save` exclusively. No query methods, no filtering, no pagination.

```typescript
export abstract class AssetRepositoryPort {
  abstract load(id: string): Promise<Asset | null>;
  abstract save(asset: Asset): Promise<void>;
}

export abstract class OrderRepositoryPort {
  abstract load(id: string): Promise<Order | null>;
  abstract save(order: Order): Promise<void>;
}
```

---

## Application Layer

### Application Services / Use Case Handlers

Application Services orchestrate domain logic. They do not contain business rules themselves.

Responsibilities:

- Load aggregates from repositories via ports
- Call domain methods on those aggregates
- Coordinate multiple aggregates via Domain Services when needed
- Persist changes back through repository ports
- Emit integration events to external systems if needed

```typescript
export class CreateBookingService implements ICommandHandler<CreateBookingCommand> {
  constructor(
    private readonly orderRepo: OrderRepositoryPort,
    private readonly inventoryApi: InventoryPublicApi,
  ) {}

  async execute(command: CreateBookingCommand): Promise<Result<string, BookingError>> {
    const asset = await this.inventoryApi.reserveAsset(command);
    if (!asset) return Err(new AssetNotAvailableError());

    const order = Order.create({ ...command, assetId: asset.id });
    await this.orderRepo.save(order);
    return Ok(order.id);
  }
}
```

One handler per use case. Handlers must not call other Application Services — this creates hidden coupling and potential cycles. Use Domain Events for side effects instead.

### Commands and Queries (CQS)

Every use case is either a **Command** or a **Query**. Never both.

**Commands** change state. They should not return business data beyond an ID or confirmation.

**Queries** are read-only and bypass the domain model entirely. Query handlers query the database directly, returning flat DTOs. No aggregates, no repositories.

```typescript
// Query handlers go straight to DB — no domain objects, no repositories
export class FindAvailableAssetsQueryHandler implements IQueryHandler<FindAvailableAssetsQuery> {
  async execute(query: FindAvailableAssetsQuery) {
    return this.db.query(
      `
      SELECT a.id, a.serial_number, a.product_type_id
      FROM assets a
      WHERE a.product_type_id = $1
        AND a.location_id     = $2
        AND NOT EXISTS (
          SELECT 1 FROM asset_assignments aa
          WHERE aa.asset_id = a.id
            AND aa.period && $3
        )
    `,
      [query.productTypeId, query.locationId, query.period],
    );
  }
}
```

Use a **CommandBus** and **QueryBus** to dispatch. This decouples invokers from handlers and allows cross-module reads without direct imports.

```typescript
// Cross-module read — no coupling, no PublicApi needed for reads
const available = await this.queryBus.execute(new FindAvailableAssetsQuery(productTypeId, locationId, period));
```

### Module Public API

The cross-module **write** contract. Exposed to other modules for commands only. Lives in `application/`. Implemented by the module's Application Service.

```typescript
export abstract class InventoryPublicApi {
  abstract reserveAsset(dto: ReserveAssetDto): Promise<AssetDto | null>;
  abstract blockAsset(dto: BlockAssetDto): Promise<void>;
}
```

Never use PublicApi for reads — use QueryBus instead. This prevents the PublicApi from growing methods shaped by consumers rather than by the module's own domain.

---

## Infrastructure Layer

### Repositories

Repositories implement the Repository Port. They map between domain aggregates and persistence models, and publish domain events after saving.

```typescript
export class OrderRepository implements OrderRepositoryPort {
  async load(id: string): Promise<Order | null> {
    const row = await this.db.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    return row ? OrderMapper.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    const row = OrderMapper.toPersistence(order);
    await this.db.query(`INSERT INTO orders ... ON CONFLICT DO UPDATE ...`, [...row]);
    await this.publishEvents(order.pullDomainEvents());
  }
}
```

### Persistence Models and Mappers

Domain models and database schemas are separate. A Mapper converts between them. This means database changes (normalization, column renames, table splits) do not leak into domain logic.

```typescript
export class OrderMapper {
  static toDomain(row: OrderRow): Order { ... }
  static toPersistence(order: Order): OrderRow { ... }
}
```

### Adapters

Adapters implement ports for out-of-process concerns: email, payment gateways, external APIs, message brokers. They are never called directly — always through a port interface.

---

## Injection Pattern

Always use the abstract class as the injection token. Never use string tokens.

```typescript
// Module providers:
{ provide: AssetRepositoryPort,  useClass: AssetRepository },
{ provide: InventoryPublicApi,   useClass: InventoryApplicationService },

// Consumer (constructor injection):
constructor(
  private readonly assetRepo: AssetRepositoryPort,
  private readonly inventoryApi: InventoryPublicApi,
) {}
```

---

## Controllers

Controllers parse requests, delegate to a Use Case (via CommandBus or QueryBus or directly), and map results back to HTTP responses. No business logic ever lives in a controller.

One controller per use case per trigger type:

```
create-booking.http.controller.ts      ← REST
create-booking.cli.controller.ts       ← CLI
create-booking.message.controller.ts   ← Message broker / microservice event
```

---

## DTOs

**Request DTOs** define the API contract inbound. Validate with `class-validator`. Sanitize inputs. These are the first line of defense against invalid data.

**Response DTOs** whitelist what is returned. Never return an entity or persistence model directly. This prevents data leaks when internal models change.

Commands and DTOs are different things. A DTO is a data contract for the API boundary. A Command is a serializable intent passed to the domain. They may look similar but serve different purposes and must be kept separate.

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

Cross-module rule: use the target module's **PublicApi for writes**, **QueryBus for reads**. Never access another module's tables, repositories, or internal services directly.

---

## Availability & Booking — Critical Domain Rules

- `AssetAssignment` is the single source of truth for availability. All availability queries target it — regardless of assignment type (`ORDER`, `BLACKOUT`, `MAINTENANCE`).
- The `EXCLUDE USING gist (asset_id WITH =, period WITH &&)` constraint is the database-level safety net against double-booking. Domain validation runs first; the constraint catches anything that slips through concurrent writes.
- All Order status transitions go through a **single state machine service**. Never set `order.status` directly in a handler or controller.
- Bundle availability = AND condition across all component product types. If one component has no available asset, the entire bundle is unavailable.
- Bundle composition is **snapshotted onto the OrderItem at booking time**. Changes to a Bundle definition never affect existing Orders.

---

## Multi-Tenancy

Row-level isolation. Every tenant-scoped table has a `tenantId` column. Injected automatically via **Prisma middleware + AsyncLocalStorage**. Never pass `tenantId` manually through handlers, services, or repositories.

The middleware must support an explicit super-admin bypass — designed intentionally from the start, not added later as a workaround.

---

## Anti-Patterns

- Business logic in Controllers or Application Services — logic belongs in domain objects
- Query methods on a RepositoryPort — repositories are `load`/`save` only
- Direct imports between modules — use PublicApi or QueryBus
- PublicApi used for reads — reads go through QueryBus
- One Application Service calling another — use Domain Events for side effects
- Setting Order status directly — always go through the state machine
- Returning entities or persistence models from controllers — always use Response DTOs
- String injection tokens (`@Inject('REPO_TOKEN')`) — use abstract class as token
- Skipping the spec for non-trivial tasks
