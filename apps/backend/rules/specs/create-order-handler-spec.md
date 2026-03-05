# Spec: Create Order

## What

The primary booking use case. A customer selects a location, a period, and one or more items (products or bundles). The system validates the request, reserves assets, calculates prices, and persists the order atomically.

This handler orchestrates three modules: inventory (asset reservation), pricing (price calculation), and order (persistence). All three operations happen inside a single Prisma transaction to guarantee that AssetAssignment records and the Order are never in an inconsistent state.

---

## Architectural Decision Record: Cross-Module Transaction

**Decision:** `InventoryPublicApi.reserveAsset()` accepts a `PrismaTransactionClient` parameter. The `CreateOrderHandler` opens the transaction and passes it to both `reserveAsset` and the order repository.

**Why:** AssetAssignment (owned by inventory) and Order (owned by order module) must be created atomically. Without a shared transaction, a failure after asset reservation but before order persistence leaves orphaned AssetAssignment records blocking availability with no corresponding order.

**The tradeoff:** `PrismaTransactionClient` is an infrastructure type. Passing it through a PublicApi method is a deliberate violation of the strict layer rule — application layer should not know about infrastructure concerns. This is acceptable in an MVP monolith where true module independence is not required. It would not be acceptable in a microservices architecture.

**What this is not:** this is not the same as splitting `reserveAsset` into `findAvailableAssetId` + `createAssignment` on the PublicApi. The inventory module still owns the full reservation operation as a single unit. It only participates in the caller's transaction rather than managing its own.

**Future escape hatch:** if modules are ever extracted into separate services, the transaction parameter is removed, and the saga/outbox pattern replaces it. The impact is localized to `CreateOrderHandler` and `InventoryPublicApi`.

---

## Layers Touched

- `order-module` > Domain (Order aggregate, OrderItem entity, BundleSnapshot entity)
- `order-module` > Application (CreateOrderCommand, CreateOrderHandler, OrderRepositoryPort)
- `order-module` > Infrastructure (OrderRepository, OrderMapper)
- `inventory-module` > Application (InventoryPublicApi — signature change to accept tx)
- `inventory-module` > Infrastructure (InventoryApplicationService, AssetAssignmentRepository — use tx)
- `pricing-module` > Application (PricingPublicApi — no changes)

---

## Implementation Plan

### 1. Order domain

**`order/domain/value-objects/order-item-type.vo.ts`** — already an enum in Prisma, reference from `@repo/types`

**`order/domain/entities/bundle-snapshot.entity.ts`**

```typescript
// Immutable record of bundle composition at booking time.
// No create() — assembled inline during order item creation.
// reconstitute() used by mapper.
type BundleSnapshotProps = {
  id: string;
  bundleId: string;
  bundleName: string;
  bundlePrice: Money;
  components: BundleSnapshotComponentProps[];
};

type BundleSnapshotComponentProps = {
  productTypeId: string;
  productTypeName: string;
  quantity: number;
};
```

**`order/domain/entities/order-item.entity.ts`**

Props: `id`, `orderId`, `type`, `productTypeId?`, `bundleId?`, `priceSnapshot: Money`, `bundleSnapshot?: BundleSnapshot`, `assetAssignmentIds: string[]`

Note: `OrderItem` holds `assetAssignmentIds` — the IDs of the AssetAssignment records created during reservation. These are stored on the OrderItem so the order module can reference them without crossing into inventory's tables. The actual AssetAssignment records are owned by inventory.

**`order/domain/aggregates/order.aggregate.ts`**

Props: `id`, `tenantId`, `locationId`, `customerId?`, `status: OrderStatus`, `items: OrderItem[]`

State transitions go through the state machine — never set status directly.

Methods:

```typescript
// Called once per item during order creation
addProductItem(props: AddProductItemProps): void
addBundleItem(props: AddBundleItemProps): void
```

Both methods create an `OrderItem` internally and push it onto `this.items`. Invariant: an order must have at least one item before it can be confirmed — enforced in the state machine, not here.

Static factories:

```typescript
// Creates a new order in PENDING_SOURCING status.
// Status is immediately advanced to SOURCED by the handler after all assets are reserved.
static create(props: CreateOrderProps): Order

static reconstitute(props: ReconstituteOrderProps): Order
```

Domain event: `OrderCreatedEvent` emitted from `Order.create()`.

**`order/domain/services/order-state-machine.domain-service.ts`**

Single method:

```typescript
transition(order: Order, to: OrderStatus): void
```

Validates the transition is legal. Throws `InvalidOrderTransitionException` if not. Legal transitions:

```
PENDING_SOURCING → SOURCED
SOURCED          → CONFIRMED
CONFIRMED        → ACTIVE
ACTIVE           → COMPLETED
CONFIRMED        → CANCELLED
SOURCED          → CANCELLED
PENDING_SOURCING → CANCELLED
```

**`order/domain/errors/`**

- `order-item-unavailable.error.ts` — returned when any item cannot be reserved

**`order/domain/exceptions/`**

- `invalid-order-transition.exception.ts` — thrown when state machine receives illegal transition

---

### 2. Order repository port

**`order/domain/ports/order.repository-port.ts`**

```typescript
export abstract class OrderRepositoryPort {
  abstract load(id: string): Promise<Order | null>;
  abstract save(order: Order, tx: PrismaTransactionClient): Promise<void>;
}
```

`save` accepts a transaction client. `load` does not — reads are never part of the booking transaction.

---

### 3. Command and handler

**`order/application/commands/create-order.command.ts`**

```typescript
export type CreateOrderItemCommand =
  | { type: 'PRODUCT'; productTypeId: string; assetId?: string }
  | { type: 'BUNDLE'; bundleId: string };

export class CreateOrderCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly customerId: string | null,
    public readonly period: { start: Date; end: Date },
    public readonly items: CreateOrderItemCommand[],
    public readonly currency: string,
  ) {}
}
```

**`order/application/handlers/create-order.handler.ts`**

Full orchestration flow:

```
1. Validate: items array is non-empty
2. Build DateRange from command.period
3. Load item metadata (productType categoryIds, bundle component details)
   needed for: orderItemCountByCategory + bundle snapshots
4. Pre-compute orderItemCountByCategory from command items + loaded metadata
5. Open Prisma transaction
6. Inside transaction:
   a. Create Order aggregate via Order.create()
   b. For each item in command.items:
      - If PRODUCT:
        · reserveAsset(dto, tx) → err = return err(OrderItemUnavailableError)
        · calculateProductPrice(dto) — outside tx, pure read
        · order.addProductItem({ productTypeId, priceSnapshot, assetAssignmentId })
      - If BUNDLE:
        · For each component: reserveAsset(dto, tx) → err = return err(OrderItemUnavailableError)
        · calculateBundlePrice(dto) — outside tx, pure read
        · order.addBundleItem({ bundleId, priceSnapshot, snapshot, assetAssignmentIds })
   c. Transition order status: PENDING_SOURCING → SOURCED via state machine
   d. orderRepo.save(order, tx)
7. Return ok(order.id)
```

Important ordering note: pricing calls (`calculateProductPrice`, `calculateBundlePrice`) happen outside the transaction. They are pure reads with no side effects — there is no benefit to including them inside the transaction, and keeping them outside reduces transaction duration (which reduces lock contention).

Error handling inside the transaction: if any `reserveAsset` call returns `err`, the transaction is rolled back by throwing — which releases all asset assignments made so far in the same transaction.

**`order/application/queries/`** — no query handlers needed for this use case.

---

### 4. Item metadata loading

Before the transaction opens, the handler needs to load:

- For PRODUCT items: `categoryId` (for VOLUME rule context)
- For BUNDLE items: component list with `productTypeId`, `quantity`, `productTypeName` (for snapshot), and `bundleName`, `bundlePrice` (for snapshot)

This is a pre-flight read, not part of the domain. It uses the `OrderQueryService` (a concrete infrastructure service, same pattern as `PricingQueryService`).

**`order/infrastructure/services/order-query.service.ts`**

```typescript
@Injectable()
export class OrderQueryService {
  loadProductTypeMeta(productTypeId: string): Promise<{ categoryId: string | null }>;
  loadBundleWithComponents(bundleId: string): Promise<BundleWithComponents | null>;
}

type BundleWithComponents = {
  id: string;
  name: string;
  components: { productTypeId: string; productTypeName: string; quantity: number }[];
};
```

---

### 5. InventoryPublicApi signature change

**`inventory/application/inventory.public-api.ts`** — add `tx` parameter:

```typescript
abstract reserveAsset(
  dto: ReserveAssetDto,
  tx: PrismaTransactionClient,
): Promise<Result<ReservedAssetDto, AssetNotAvailableError>>
```

**`inventory/application/inventory.application-service.ts`** — pass `tx` through to `assignmentRepo.save(assignment, tx)`

**`inventory/domain/ports/asset-assignment.repository-port.ts`** — update `save`:

```typescript
abstract save(assignment: AssetAssignment, tx: PrismaTransactionClient): Promise<void>
```

**`inventory/infrastructure/repositories/asset-assignment.repository.ts`** — use `tx.$executeRaw` instead of `this.prisma.$executeRaw`

---

### 6. Order repository and mapper

**`order/infrastructure/repositories/order.repository.ts`** — implements `OrderRepositoryPort`

Uses `tx` for `save`. Upserts Order, OrderItems, BundleSnapshots, BundleSnapshotComponents in sequence within the passed transaction.

**`order/infrastructure/mappers/order.mapper.ts`**
**`order/infrastructure/mappers/order-item.mapper.ts`**
**`order/infrastructure/mappers/bundle-snapshot.mapper.ts`**

---

### 7. HTTP Controller

**`order/infrastructure/controllers/create-order.http.controller.ts`**

- Parses and validates request DTO
- Dispatches `CreateOrderCommand` via `CommandBus`
- Maps result to HTTP response:
  - `ok` → `201 Created` with `{ orderId }`
  - `OrderItemUnavailableError` → `409 Conflict`

---

### 8. Module wiring

**`order/order.module.ts`**

- Imports `InventoryModule`, `PricingModule`
- Provides `OrderQueryService`
- Provides `OrderRepositoryPort → OrderRepository`
- Registers `CreateOrderHandler` with `CommandBus`

---

## Edge Cases

- **Empty items array**: rejected before transaction opens. Returns `400`.
- **Any item unavailable**: first `reserveAsset` failure rolls back the entire transaction — no partial reservations persist. Returns `err(OrderItemUnavailableError)`.
- **Bundle partial availability**: each component is reserved sequentially inside the transaction. If component 2 of 3 fails, the transaction rolls back component 1's assignment as well.
- **Concurrent requests for the same asset**: `AssetAvailabilityService.findAvailableAssetId` may return the same assetId to two concurrent requests. The second `$executeRaw` INSERT hits the EXCLUDE constraint, `mapPostgresError` throws `PostgresExclusionViolationError`, which the application service catches and returns as `AssetNotAvailableError`, which causes the transaction to roll back. Correct behavior — one succeeds, one fails cleanly.
- **orderItemCountByCategory pre-computation**: computed before the transaction from command data + loaded metadata. BUNDLE items do not contribute to category counts — only PRODUCT items do, since bundle pricing uses bundle tiers, not category rules.
- **Period validation**: `DateRange.create()` throws `InvalidDateRangeException` before the transaction opens. Returns `400`.
- **Unknown productTypeId or bundleId**: caught during pre-flight metadata load. Returns `404` before transaction opens.
- **Pricing failure (no tier found)**: `NoPricingTierFoundException` is thrown — catalog misconfiguration. Rolls back transaction. Returns `500`.
- **Bundle snapshot**: captured from the pre-flight metadata load, not re-fetched inside the transaction. The snapshot reflects the bundle definition at request time, which is the correct semantics.
- **Tenant isolation**: `tenantId` is injected into `Order.create()` from the command. Asset isolation is guaranteed by `locationId` as established in the inventory spec.

---

## Acceptance Criteria

- [ ] Order and all AssetAssignments are created atomically — no partial state persists on failure
- [ ] If any item is unavailable, no AssetAssignments are created and no Order is persisted
- [ ] Bundle reservation fails atomically if any component is unavailable
- [ ] `priceSnapshot` on each OrderItem reflects the calculated price at booking time
- [ ] BundleSnapshot is created for every BUNDLE OrderItem
- [ ] Order status is `SOURCED` after successful creation (not `PENDING_SOURCING`)
- [ ] `OrderCreatedEvent` is published after the transaction commits
- [ ] Empty items array is rejected before the transaction opens
- [ ] Concurrent requests for the same asset — exactly one order succeeds
- [ ] Pricing is calculated outside the transaction

---

## Open Questions

None — all design decisions resolved above.
