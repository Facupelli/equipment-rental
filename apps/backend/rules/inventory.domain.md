# Inventory Domain Rules

## Concepts & Relationships

```
Tenant
 └── Category
 └── Location
 └── Product (BULK or SERIALIZED)
      ├── PricingTier[]          — product-level tiers (default pricing)
      ├── BundleComponent[]      — this product appears in these bundles
      └── InventoryItem[]        — only for SERIALIZED products
           ├── PricingTier[]     — item-level tiers (override product pricing)
           ├── BlackoutPeriod[]  — unavailability windows (maintenance, damage, etc.)
           └── Owner?            — third-party owner, if not the tenant
```

---

## Product

A `Product` is the catalog definition of a rentable item. It does not represent a
physical unit — it represents the concept (e.g. "Canon EOS R5", "XLR Cable").

The `trackingType` field is the most important property on a Product. It determines
how availability is calculated, how pricing is resolved, and whether physical units
are tracked. Always read it before writing any inventory or booking logic.

### BULK Product

- Units are interchangeable. The tenant does not care which specific unit goes out.
- Stock is tracked as a number (`totalStock`) on the product itself.
- Location is on the product — all bulk stock is in one place.
- Has no `InventoryItem` rows.
- Availability = `totalStock - bookedQuantity - blockedQuantity`.

**Creation rules:**

- `totalStock` must be set and > 0.
- `locationId` must be set.
- No `InventoryItem` rows are created.

### SERIALIZED Product

- Each physical unit is tracked individually via `InventoryItem`.
- `totalStock` is null — stock is implicitly the count of active `InventoryItem` rows.
- Location is null at the product level — each `InventoryItem` carries its own location.
- Availability = is this specific unit already booked or blacked out?

**Creation rules:**

- `totalStock` must be null.
- `locationId` must be null.
- `InventoryItem` rows are created to represent each physical unit.

---

## InventoryItem

An `InventoryItem` is a single physical unit of a SERIALIZED product.

Key fields:

- `serialNumber` — unique identifier for the physical unit within a tenant.
- `status` — independent lifecycle: `OPERATIONAL`, `MAINTENANCE`, `RETIRED`.
  A unit can be `MAINTENANCE` without a BlackoutPeriod, and vice versa. Status is
  informational; BlackoutPeriod is what blocks availability in booking queries.
- `ownerId` — null means the tenant owns it. Set means a third-party owner.
- `locationId` — where this specific unit currently lives.

**Rule:** If a tenant wants to rent out third-party equipment, it must be a
SERIALIZED product. BULK products cannot have owners because there is no way to
know which specific unit was out.

---

## BlackoutPeriod

A `BlackoutPeriod` blocks an `InventoryItem` from being booked during a `tstzrange`.
It is separate from booking — it represents non-booking unavailability (maintenance,
damage, personal use, etc.).

- Stored as `blocked_period tstzrange` — managed via raw SQL, same as `booking_range`.
- `blockedQuantity` is always 1 for SERIALIZED items (there is only one unit).
- The availability check must subtract active BlackoutPeriods before confirming a booking.
  See `rules/domain.md` — Overlap Detection for the raw SQL pattern.

---

## PricingTier

A `PricingTier` defines the price per billing unit for a given duration threshold.
The "longer you rent, the cheaper it gets" logic is expressed as multiple tiers
with increasing `fromUnit` values and decreasing `pricePerUnit` values.

### Tier Scope

A tier is scoped to either a product OR an inventory item — never both, never neither.
This is enforced by a check constraint in the DB.

| `productId` | `inventoryItemId` | Meaning                                      |
| ----------- | ----------------- | -------------------------------------------- |
| set         | null              | Default pricing for all units of the product |
| null        | set               | Override pricing for this specific unit only |

### Tier Resolution (PriceEngine responsibility)

1. Check if the `InventoryItem` has item-level tiers for the requested `BillingUnit`.
2. If yes — use item-level tiers.
3. If no — fall back to product-level tiers for the same `BillingUnit`.

### BillingUnit

A `BillingUnit` defines the unit of time that pricing is expressed in
(e.g. "half_day" = 4h, "full_day" = 8h, "week" = 40h). It is tenant-defined,
meaning each tenant can configure their own billing units and sort order.

PriceEngine receives the `booking_range` duration, converts it to units using
`BillingUnit.durationHours`, then selects the applicable tier.

---

## ProductBundle

A `ProductBundle` is a marketing grouping of products sold together. It has no
stock of its own. It cannot contain another bundle — components are always plain
products.

### BundleComponent

Each component has a `quantity` — how many units of that product are included.
A bundle with a camera and 2 lenses has two `BundleComponent` rows.

### Bundle Pricing

Bundle pricing uses `BundlePricingTier` rows, which follow the same structure as
`PricingTier` (billingUnit + fromUnit + pricePerUnit). The bundle has its own
independent price — it does not automatically derive from the sum of components.

---

## Creation Checklist

### Creating a BULK Product

- [ ] `trackingType` = BULK
- [ ] `totalStock` is set and > 0
- [ ] `locationId` is set
- [ ] PricingTier rows created for each BillingUnit the tenant supports
- [ ] No InventoryItem rows created

### Creating a SERIALIZED Product

- [ ] `trackingType` = SERIALIZED
- [ ] `totalStock` is null
- [ ] `locationId` is null
- [ ] Product-level PricingTier rows created (serve as default for all units)
- [ ] InventoryItems added via a separate Use Case after product creation

### Adding an InventoryItem

- [ ] `serialNumber` is unique within the tenant
- [ ] `locationId` is set
- [ ] `status` defaults to OPERATIONAL
- [ ] `ownerId` set if third-party owned
- [ ] Item-level PricingTier rows are optional — product-level tiers are the fallback

### Creating a ProductBundle

- [ ] At least one BundleComponent
- [ ] No component is itself a bundle
- [ ] BundlePricingTier rows created for each BillingUnit the tenant supports
