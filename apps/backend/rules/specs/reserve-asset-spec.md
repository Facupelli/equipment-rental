# Spec: ReserveAsset

## What

An inventory module operation that checks availability for a rental period and, if available, creates an `AssetAssignment` that blocks the asset for that period. Called by the order module during order creation via `InventoryPublicApi`.

This is the most concurrency-sensitive operation in the system. Domain-level availability check runs first as a fast fail. The database `EXCLUDE` constraint is the final safety net — if two concurrent requests pass the domain check simultaneously, the constraint catches the second one. The repository maps that constraint violation to a typed domain error so the caller never sees a raw DB exception.

---

## Layers Touched

- `inventory-module` > Domain (Asset entity, AssetAssignment entity, AssetNotAvailableError)
- `inventory-module` > Application (InventoryPublicApi, ReserveAssetHandler)
- `inventory-module` > Infrastructure (AssetAssignmentRepository — raw SQL for tstzrange, PostgresErrorMapper utility)

---

## Implementation Plan

### 1. Domain errors

**`inventory/domain/errors/asset-not-available.error.ts`**

```typescript
export class AssetNotAvailableError extends Error {
  constructor() {
    super('Asset is not available for the requested period.');
  }
}
```

Returned via `Result`, never thrown. Represents a valid business outcome — the customer asked for something that cannot be fulfilled right now.

---

### 2. Asset entity

**`inventory/domain/entities/asset.entity.ts`** — create or modify

Needs one domain method:

```typescript
// Returns true if this asset has no conflicting assignment for the given period.
// This is the domain-level check — runs before attempting DB write.
// The DB EXCLUDE constraint is the authoritative guard against concurrent writes.
isAvailableFor(period: DateRange, existingAssignments: AssetAssignment[]): boolean
```

`existingAssignments` are loaded by the repository before calling this method. The entity does not reach out — it receives what it needs.

---

### 3. AssetAssignment entity

**`inventory/domain/entities/asset-assignment.entity.ts`** — create

Props: `id`, `assetId`, `orderItemId?`, `orderId?`, `type: AssignmentType`, `source?: AssignmentSource`, `reason?`, `period: DateRange`

Two static factories:

```typescript
// Called when creating a new ORDER assignment during booking
static createForOrder(props: CreateForOrderProps): AssetAssignment

// Called by repository mapper when loading from DB
static reconstitute(props: ReconstituteProps): AssetAssignment
```

`createForOrder` validates:

- `orderId` and `orderItemId` must be provided
- `source` must be provided (`OWNED` or `EXTERNAL`)

No other business methods needed on this entity — it is a record of a fact, not an actor.

---

### 4. Port

**`inventory/domain/ports/asset.repository-port.ts`**

```typescript
export abstract class AssetRepositoryPort {
  abstract load(id: string): Promise<Asset | null>;
  abstract save(asset: Asset): Promise<void>;
}
```

**`inventory/domain/ports/asset-assignment.repository-port.ts`**

```typescript
export abstract class AssetAssignmentRepositoryPort {
  // Finds one available asset for the given product type, location, and period.
  // If assetId is provided, checks only that specific asset (IDENTIFIED with caller preference).
  // If assetId is omitted, picks any available asset (POOLED or IDENTIFIED auto-assign).
  abstract findAvailable(params: FindAvailableParams): Promise<Asset | null>;

  // Persists a new AssetAssignment using raw SQL (tstzrange).
  // Throws PostgresExclusionViolationError if the EXCLUDE constraint fires.
  abstract save(assignment: AssetAssignment): Promise<void>;
}

export type FindAvailableParams = {
  productTypeId: string;
  locationId: string;
  period: DateRange;
  assetId?: string; // if provided, checks only this asset
};
```

Note: `findAvailable` returns an `Asset`, not an `AssetAssignment`. It answers "which asset can we assign?" — not "what is assigned?". The assignment is created after this call.

---

### 5. Public API contract

**`inventory/application/inventory.public-api.ts`**

```typescript
export abstract class InventoryPublicApi {
  abstract reserveAsset(dto: ReserveAssetDto): Promise<Result<ReservedAssetDto, AssetNotAvailableError>>;
}

export type ReserveAssetDto = {
  productTypeId: string;
  locationId: string;
  orderId: string;
  orderItemId: string;
  period: { start: Date; end: Date };
  trackingMode: TrackingMode;
  assetId?: string; // caller-preferred asset for IDENTIFIED mode
};

export type ReservedAssetDto = {
  assetId: string;
  assignmentId: string;
};
```

Returns `Result<ReservedAssetDto, AssetNotAvailableError>` — never throws for availability failures.

---

### 6. Application service

**`inventory/application/inventory.application-service.ts`** — implements `InventoryPublicApi`

```
reserveAsset(dto):
  1. Build DateRange from dto.period — throws InvalidDateRangeException if invalid
  2. Call assetAssignmentRepo.findAvailable({ productTypeId, locationId, period, assetId? })
  3. If null → return err(new AssetNotAvailableError())
  4. Build AssetAssignment via AssetAssignment.createForOrder(...)
  5. Call assetAssignmentRepo.save(assignment)
     - If PostgresExclusionViolationError → return err(new AssetNotAvailableError())
  6. Return ok({ assetId: asset.id, assignmentId: assignment.id })
```

Note: steps 2 and 5 both guard against unavailability — step 2 catches the obvious case, step 5 catches the concurrent case. This is intentional and necessary.

---

### 7. Infrastructure

**`inventory/infrastructure/utils/postgres-error.mapper.ts`** — new utility

```typescript
// Postgres error code for exclusion constraint violation
const PG_EXCLUSION_VIOLATION = '23P01';

export class PostgresExclusionViolationError extends Error {}

export function mapPostgresError(error: unknown): never {
  if (isPostgresError(error) && error.code === PG_EXCLUSION_VIOLATION) {
    throw new PostgresExclusionViolationError();
  }
  throw error; // unknown errors are re-thrown as-is
}
```

This utility is the single place in the codebase that knows about Postgres error codes. Any future repository dealing with `tstzrange` reuses it.

**`inventory/infrastructure/repositories/asset-assignment.repository.ts`** — implements `AssetAssignmentRepositoryPort`

`findAvailable` — raw SQL availability query:

```sql
SELECT a.*
FROM assets a
WHERE a.product_type_id = $productTypeId
  AND a.location_id     = $locationId
  AND a.is_active       = true
  AND a.deleted_at      IS NULL
  AND ($assetId IS NULL OR a.id = $assetId)
  AND NOT EXISTS (
    SELECT 1 FROM asset_assignments aa
    WHERE aa.asset_id = a.id
      AND aa.period && $period::tstzrange
  )
LIMIT 1
```

`save` — raw SQL insert for the `tstzrange` period column, wrapped in `try/catch` → `mapPostgresError`:

```sql
INSERT INTO asset_assignments (id, asset_id, order_item_id, order_id, type, source, reason, period, created_at, updated_at)
VALUES ($id, $assetId, $orderItemId, $orderId, $type, $source, $reason, $period::tstzrange, now(), now())
```

Both methods use `prisma.$queryRaw` / `prisma.$executeRaw`. No Prisma model client for these operations — `tstzrange` is unsupported by Prisma's type system.

---

### 8. Module wiring

**`inventory/inventory.module.ts`**

- Provides `AssetAssignmentRepositoryPort → AssetAssignmentRepository`
- Provides `InventoryPublicApi → InventoryApplicationService`
- Exports `InventoryPublicApi`

---

## Edge Cases

- **Concurrent requests passing domain check simultaneously**: both pass `findAvailable`, both attempt `save`. The second insert hits the `EXCLUDE` constraint. `mapPostgresError` catches `23P01`, application service returns `err(new AssetNotAvailableError())`. No raw DB error reaches the caller.
- **IDENTIFIED with specific assetId**: `findAvailable` filters to that asset only. If it's unavailable, returns null → `AssetNotAvailableError`. No substitution.
- **IDENTIFIED without assetId**: treated identically to POOLED — system picks any available unit of that product type.
- **POOLED**: same auto-assignment path. `trackingMode` does not change the reservation logic, only whether `serialNumber` matters — which is irrelevant to assignment.
- **Period boundary precision**: `DateRange` uses half-open `[start, end)` semantics, matching the `tstzrange` default. A rental ending at 10:00 does not conflict with one starting at 10:00.
- **Soft-deleted assets**: `findAvailable` filters `is_active = true AND deleted_at IS NULL`. Inactive assets are never assigned.
- **BLACKOUT / MAINTENANCE assignments**: these are existing `AssetAssignment` rows. The `NOT EXISTS` check in `findAvailable` catches them — assignment type is irrelevant to the overlap query.
- **Tenant isolation**: `findAvailable` does not filter by `tenantId` directly — assets are scoped to a `locationId`, and locations belong to a tenant. The Prisma middleware AsyncLocalStorage tenant filter applies to Prisma client calls but not to `$queryRaw`. The raw SQL query must therefore include an explicit tenant scope via a join or subquery. **Flagged as open question.**

---

## Acceptance Criteria

- [ ] `reserveAsset` returns `err(AssetNotAvailableError)` when no asset is available
- [ ] `reserveAsset` returns `ok(ReservedAssetDto)` when an asset is available and assignment is created
- [ ] Two concurrent requests for the same asset and overlapping period — exactly one succeeds, the other returns `err(AssetNotAvailableError)` (no exception thrown to caller)
- [ ] IDENTIFIED with specific `assetId` — only that asset is checked, no substitution on failure
- [ ] IDENTIFIED without `assetId` — any available unit of that product type is assigned
- [ ] A rental ending at T does not conflict with one starting at T (half-open interval)
- [ ] Soft-deleted and inactive assets are never assigned
- [ ] BLACKOUT and MAINTENANCE assignments block availability identically to ORDER assignments
- [ ] Raw Postgres exclusion violation never surfaces as an unhandled exception

---
