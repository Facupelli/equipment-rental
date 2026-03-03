# Multi-Tenant Rental App — Domain Design

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Product & Asset Model](#2-product--asset-model)
3. [Availability & Conflict Detection](#3-availability--conflict-detection)
4. [Procurement-Backed Fulfillment](#4-procurement-backed-fulfillment)
5. [Bundles](#5-bundles)
6. [Pricing](#6-pricing)
7. [Locations](#7-locations)
8. [Multi-Tenancy](#8-multi-tenancy)
9. [Entity Summary](#9-entity-summary)

---

## 1. Core Concepts

### The fundamental separation

An **Order** is a promise to fulfill. An **AssetAssignment** is how the system fulfills it.

These are deliberately separate. An order can exist without an asset assignment (pending sourcing). An asset assignment without an order is an internal block (blackout, maintenance).

### Time representation

All periods are stored as `tstzrange` in Postgres. This unlocks the `EXCLUDE` constraint for overlap prevention and native range operators (`&&`, `@>`) for availability queries. The cost is raw SQL on asset assignment operations, contained to a single repository class.

---

## 2. Product & Asset Model

### Product Types

A `ProductType` defines a rentable item in the catalog. It belongs to a **Tenant** — the catalog is shared across all locations. Stock per location is determined by how many assets exist at that location for a given product type.

Every product type has a `trackingMode`:

| Mode         | Meaning                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- |
| `IDENTIFIED` | Individual units matter. Each asset has a serial number. A specific unit is assigned.         |
| `POOLED`     | Units are interchangeable. No serial number required. System auto-assigns any available unit. |

### Assets

Every physical unit is an `Asset` record — regardless of tracking mode. There is no quantity field anywhere. Availability is always derived by counting assets with no conflicting assignment.

| Field           | Notes                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| `productTypeId` | What type of equipment this is                                          |
| `locationId`    | Home base — where this asset lives when not rented                      |
| `ownerId`       | Who owns this asset (tenant or external party for sub-rented equipment) |
| `serialNumber`  | Nullable — required for IDENTIFIED, optional for POOLED                 |

### Auto-Assignment

Both IDENTIFIED and POOLED products support auto-assignment. When an order is placed without specifying an asset, the system picks any available unit of the correct product type at the correct location. For the MVP, auto-assignment is final. A future `assignmentType: AUTO_ASSIGNED | MANUALLY_SELECTED` flag can be added if admin review is needed.

---

## 3. Availability & Conflict Detection

### The EXCLUDE constraint

```sql
CONSTRAINT no_asset_overlap
  EXCLUDE USING gist (asset_id WITH =, period WITH &&)
```

This guarantees a physical asset can never be double-booked at the database level.

### AssetAssignment is the single source of truth

All availability queries check `AssetAssignment`. An asset is unavailable for a period if any assignment overlaps with it — regardless of type.

### Assignment types

| Type          | Meaning                                            | `orderId` |
| ------------- | -------------------------------------------------- | --------- |
| `ORDER`       | Assigned to a customer order                       | Required  |
| `BLACKOUT`    | Admin-defined unavailability (any external reason) | Null      |
| `MAINTENANCE` | Internal maintenance block                         | Null      |

Adding new block types is a new enum value — no structural changes.

### Availability query pattern

```sql
SELECT a.* FROM assets a
WHERE a.product_type_id = $productTypeId
  AND a.location_id = $locationId
  AND NOT EXISTS (
    SELECT 1 FROM asset_assignments aa
    WHERE aa.asset_id = a.id
      AND aa.period && $requestedPeriod
  )
```

---

## 4. Procurement-Backed Fulfillment

### Concept

A customer can place an order even when no owned asset is available. The business commits to fulfilling it by sourcing externally. This is not overbooking — it is a procurement-backed commitment.

### Order lifecycle

```
PENDING_SOURCING → SOURCED → CONFIRMED → ACTIVE → COMPLETED
                                  ↓
                              CANCELLED
```

| Status             | Meaning                                          |
| ------------------ | ------------------------------------------------ |
| `PENDING_SOURCING` | Order accepted, no asset assigned yet            |
| `SOURCED`          | Asset assigned (owned or externally sourced)     |
| `CONFIRMED`        | Business confirmed fulfillment with the customer |
| `ACTIVE`           | Rental period in progress                        |
| `COMPLETED`        | Equipment returned                               |
| `CANCELLED`        | Cancelled before ACTIVE                          |

### Two fulfillment paths

**Path A — Asset available (happy path)**

```
Order placed
  → system finds available owned asset
  → AssetAssignment created (source: OWNED)
  → Order: SOURCED → CONFIRMED
```

**Path B — Over-rental (procurement path)**

```
Order placed, no asset available
  → business accepts the order
  → Order created: PENDING_SOURCING (no assignment)
  → admin sources externally
  → AssetAssignment created (source: EXTERNAL)
  → Order: SOURCED → CONFIRMED
```

### Asset source tracking

`AssetAssignment.source: OWNED | EXTERNAL` — enables procurement cost tracking over time.

### State machine rule

All order status transitions must go through a **single state machine service**. Never set `status` directly in handlers.

---

## 5. Bundles

### Concept

A bundle is a fixed composition of product types at a promotional price. It is an `OrderItem` that the system expands into individual `AssetAssignment` records at order time — not a special entity with its own booking logic.

### Bundle composition

```
Bundle
  └── name, price, active
  └── BundleComponent[]
        └── productTypeId
        └── quantity   ← the only place quantity exists in the schema
```

### OrderItem as the expansion boundary

```
Order
  └── OrderItem (type: BUNDLE, bundleId: A, price: $200)
        └── AssetAssignment (Camera X1)
        └── AssetAssignment (Tripod)
        └── AssetAssignment (Lens Kit)
  └── OrderItem (type: PRODUCT, productTypeId: Tripod, price: $45)
        └── AssetAssignment (Tripod)  ← different unit, same product type
```

Mixed orders (bundle + standalone) are fully supported. A customer can add a bundle and also add a standalone item that already exists within that bundle — this is valid and intentional.

### Bundle availability

A bundle is available only if **all** component product types have at least one available asset for the period. AND condition across all components.

### Bundle snapshot

Bundle composition is snapshotted onto the order at booking time. Admin changes to a bundle definition do not affect existing orders.

---

## 6. Pricing

### Billing units

Atomic unit of time for pricing. System-level presets, tenants activate what they need.

| Label    | durationMinutes |
| -------- | --------------- |
| Hour     | 60              |
| Half Day | 720             |
| Day      | 1440            |
| Week     | 10080           |

Each `ProductType` selects one billing unit. Duration calculation:

```
units = ceil(durationMinutes / billingUnit.durationMinutes)
```

`ceil` is intentional — partial units bill as full units.

### Pricing tiers (base price)

Step function defining price per unit by duration. Belongs to `ProductType` or `Bundle`.

```
PricingTier
  └── productTypeId (or bundleId)
  └── locationId (nullable — null = all locations)
  └── fromUnit, toUnit (nullable = open-ended), pricePerUnit
```

`locationId` is nullable by design. MVP always null. Location-specific pricing is a future additive change — insert rows with a specific `locationId`, add fallback resolution logic. No schema changes required.

### Pricing rules (discounts)

```
PricingRule
  └── type: SEASONAL | VOLUME | COUPON | CUSTOMER_SPECIFIC
  └── scope: ORDER | PRODUCT_TYPE | CATEGORY | BUNDLE
  └── priority: Int       ← lower = higher priority
  └── stackable: Boolean
  └── condition: JSON     ← rule-specific applicability params
  └── effect: JSON        ← discount type and value
```

| Type                | MVP? | condition                      | effect                            |
| ------------------- | ---- | ------------------------------ | --------------------------------- |
| `SEASONAL`          | ✅   | `{ dateFrom, dateTo }`         | `{ type: PERCENTAGE, value: 10 }` |
| `VOLUME`            | ✅   | `{ categoryId, threshold: 5 }` | `{ type: PERCENTAGE, value: 5 }`  |
| `COUPON`            | ⏳   | `{ code: "SUMMER24" }`         | `{ type: FLAT, value: 20 }`       |
| `CUSTOMER_SPECIFIC` | ⏳   | `{ customerId }`               | `{ type: PERCENTAGE, value: 15 }` |

### Pricing calculation flow

```
tstzrange → durationMinutes
  ÷ billingUnit.durationMinutes → units (ceil)
  → resolve PricingTier → base price
  → evaluate PricingRules (priority + stackable)
  → final price
```

---

## 7. Locations

### Concept

A `Location` is an operational base — a physical place where the rental business operates, from which assets are dispatched and returned.

### Inventory isolation

Locations are **strictly isolated**. A customer selects a location at the entry point and only sees assets available there. Cross-location fulfillment is out of scope.

### Asset location

Each asset has a `locationId` representing its home base. Current position tracking is out of scope for the MVP.

### Catalog vs stock

`ProductType` belongs to the Tenant — catalog is shared. Stock per location is implicit: count of assets at that location for a given product type. No extra join table needed.

---

## 8. Multi-Tenancy

### Isolation model

Row-level isolation. Every tenant-specific table has a `tenantId` column. Tenant context is injected automatically via **Prisma middleware + AsyncLocalStorage** — never manually in handlers.

```typescript
prisma.$use(async (params, next) => {
  if (isTenantScopedModel(params.model)) {
    params.args.where = {
      ...params.args.where,
      tenantId: getTenantFromContext(),
    };
  }
  return next(params);
});
```

### Super-admin escape hatch

The middleware must support an explicit bypass for elevated contexts (super-admin, cross-tenant reporting). Design this intentionally — not as a future workaround.

### Tenant hierarchy

```
Tenant
  └── BillingUnits (activated from system presets)
  └── ProductTypes (shared catalog)
  └── PricingRules, Bundles
  └── Location: San Juan
        └── Assets, Orders
  └── Location: Buenos Aires
        └── Assets, Orders
```

---

## 9. Entity Summary

| Entity            | Belongs To                | Notes                                                 |
| ----------------- | ------------------------- | ----------------------------------------------------- |
| `Tenant`          | —                         | Top-level isolation boundary                          |
| `Location`        | Tenant                    | Operational base, strict inventory isolation          |
| `BillingUnit`     | System (tenant activates) | Preset time units for pricing                         |
| `ProductType`     | Tenant                    | Shared catalog, has trackingMode                      |
| `Asset`           | Location                  | Every physical unit. Carries ownerId, serialNumber    |
| `Bundle`          | Tenant                    | Fixed composition, has own PricingTiers               |
| `BundleComponent` | Bundle                    | ProductType + quantity                                |
| `BundleSnapshot`  | OrderItem                 | Immutable copy of bundle at order time                |
| `PricingTier`     | ProductType or Bundle     | Step function, locationId nullable for override       |
| `PricingRule`     | Tenant                    | SEASONAL and VOLUME in MVP, extensible                |
| `Order`           | Location                  | Promise to fulfill, references ProductType not Asset  |
| `OrderItem`       | Order                     | PRODUCT or BUNDLE, price snapshotted at order time    |
| `AssetAssignment` | Order (nullable)          | Source of truth for availability, tstzrange + EXCLUDE |

### Key constraints

- `AssetAssignment`: `EXCLUDE USING gist (asset_id WITH =, period WITH &&)`
- `PricingTier`: unique on `(productTypeId, locationId, fromUnit)`
- `AssetAssignment.orderId`: nullable — null means internal block
- `Asset.serialNumber`: nullable — required for IDENTIFIED, optional for POOLED
