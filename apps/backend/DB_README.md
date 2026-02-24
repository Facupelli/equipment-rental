# Database Schema Design Document

**Project:** Rental SaaS Platform
**Version:** 3.0
**Architectural Pattern:** Modular Monolith with Row-Level Security
**Database Engine:** PostgreSQL

---

## 1. Architectural Overview

This schema supports a B2B rental platform handling **serialized assets**, **bulk stock**, **over-rentals**, and **unit-aware tiered pricing**.

### Key Design Principles

1. **Hybrid Booking Model:** Supports booking specific `inventory_items` (physical) or generic `products` (virtual/over-rental). `product_id` is always required on a line item; `inventory_item_id` is optional.
2. **Temporal Availability:** Availability is derived from `bookings` AND `blackout_periods` using native PostgreSQL `tstzrange` and the `&&` overlap operator with GiST indexes.
3. **Unit-Aware Structured Pricing:** `BillingUnit` is a first-class tenant-configured concept. Tiers are defined per unit type, not per calendar day. Calculation results are stored as JSONB snapshots per line item.
4. **Financial Integrity:** Immutable `PriceBreakdown` snapshots on `booking_line_items` ensure historical accuracy without re-running pricing logic.

---

## 2. Entity-Relationship Schema

### 2.1. Core Entities (Tenancy, IAM & Organization)

#### **`tenants`**

- `id` (PK, UUID)
- `name` (VARCHAR)
- `slug` (VARCHAR, Unique)
- `plan_tier` (VARCHAR)
- `pricing_config` (JSONB) — stores `weekendCountsAsOne`, `roundingRule`, `overRentalEnabled`, `maxOverRentThreshold`. Populated with sensible defaults on tenant creation; no manual configuration required before renting.
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### **`billing_units`** (NEW)

Tenant-configured billing units. The engine normalizes all units to hours internally for comparison — tenants configure in natural units (half-day, full-day, week).

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR) — e.g., `"half_day"`, `"full_day"`, `"week"`
- `duration_hours` (DECIMAL 6,2) — e.g., `12`, `24`, `168`
- `sort_order` (INT) — higher = larger unit, determines greedy decomposition order
- `created_at`, `updated_at` (TIMESTAMP)
- **Constraint:** `UNIQUE (tenant_id, name)`

#### **`users`**, **`roles`**, **`permissions`**

_(Unchanged)_

#### **`locations`**, **`owners`**

_(Unchanged)_

---

### 2.2. Inventory Entities

#### **`products`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR)
- `tracking_type` (ENUM: `SERIALIZED`, `BULK`)
- `attributes` (JSONB) — flexible specs (weight, power source, etc.)
- `created_at`, `updated_at` (TIMESTAMP)

**Note:** `base_rental_price` has been removed. Every product must have at least one `PricingTier` with `fromUnit: 1` (the base tier). This invariant is enforced by the `Product` aggregate on creation — a product cannot be created without a `baseTier` parameter.

#### **`pricing_tiers`** (UPDATED)

Defines price breaks per billing unit type. Replaces the previous `min_days`/`max_days`/`price_per_day` model with a unit-aware, threshold-based model.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `product_id` (FK, UUID, **NOT NULL**) — always required; every tier belongs to a product
- `inventory_item_id` (FK, UUID, Nullable) — when set, this tier overrides product-level tiers for a specific item. Item-level tiers take full precedence — product-level tiers are ignored when any item-level tier exists.
- `billing_unit_id` (FK, UUID) — references `billing_units`
- `from_unit` (DECIMAL 5,2) — threshold in natural units (e.g., `4` = "from 4 units of this type onwards")
- `price_per_unit` (DECIMAL 10,2) — rate applied per billing unit at this tier
- `currency` (CHAR 3) — ISO 4217 code (e.g., `"USD"`). All tiers on a product must share the same currency; enforced by the `Product` aggregate.
- `created_at`, `updated_at` (TIMESTAMP)
- **Constraint:** `UNIQUE (tenant_id, product_id, inventory_item_id, billing_unit_id, from_unit)`

**Tier Resolution Logic (Flat Model):** Given a booking's total billable hours, each tier's `from_unit` is multiplied by its `billing_unit.duration_hours` to produce a threshold in hours. The tier with the highest threshold that the booking satisfies wins. That single rate applies to the entire booking.

#### **`inventory_items`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `product_id` (FK, UUID)
- `location_id` (FK, UUID)
- `owner_id` (FK, UUID)
- `status` (ENUM: `OPERATIONAL`, `MAINTENANCE`, `RETIRED`)
- `total_quantity` (INT) — `1` for `SERIALIZED`, `≥1` for `BULK`
- `serial_number` (VARCHAR, Nullable)
- `purchase_date` (DATE, Nullable)
- `purchase_cost` (DECIMAL, Nullable)
- `created_at`, `updated_at` (TIMESTAMP)

#### **`blackout_periods`**

Blocks availability for specific items without creating a booking.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `inventory_item_id` (FK, UUID)
- `reason` (VARCHAR) — e.g., `"Maintenance"`, `"Owner Use"`
- `blocked_period` (TSTZRANGE)
- `blocked_quantity` (INT, Default 1)
- `created_at`, `updated_at` (TIMESTAMP)
- **Index:** GiST on `blocked_period` (raw SQL migration required)

---

### 2.3. Transactional Entities

#### **`customers`**

_(Unchanged)_

#### **`bookings`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `customer_id` (FK, UUID)
- `rental_period` (TSTZRANGE) — canonical date range for the booking; used for overlap detection
- `status` (ENUM: `PENDING_CONFIRMATION`, `RESERVED`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
- `subtotal` (DECIMAL 10,2) — sum of all `booking_line_items.line_total`
- `total_discount` (DECIMAL 10,2, Default 0) — populated by `PromotionEngine` (v2)
- `total_tax` (DECIMAL 10,2, Default 0)
- `grand_total` (DECIMAL 10,2) — `subtotal − total_discount + total_tax`
- `notes` (VARCHAR, Nullable)
- `created_at`, `updated_at` (TIMESTAMP)
- **Index:** GiST on `rental_period` (raw SQL migration required), B-tree on `tenant_id`, `customer_id`

#### **`booking_line_items`**

The intersection of `Booking` and `Inventory/Products`.

- `id` (PK, UUID)
- `booking_id` (FK, UUID)
- `product_id` (FK, UUID, **NOT NULL**) — always required; every line belongs to a product
- `inventory_item_id` (FK, UUID, Nullable) — set for `SERIALIZED` items; null for over-rentals
- `status` (ENUM: `BookingStatus`, Default `RESERVED`) — line-level status; enables future granular state machine
- `quantity_rented` (INT)
- `unit_price` (DECIMAL 10,2) — **SNAPSHOT** of `tierApplied.pricePerUnit` at booking time
- `line_total` (DECIMAL 10,2) — **SNAPSHOT** of `priceBreakdown.total` at booking time
- `owner_id` (FK, UUID, Nullable) — **SNAPSHOT** resolved from `InventoryItem.ownerId`; null for over-rentals
- `is_externally_sourced` (BOOLEAN, Default false) — flag for `BillingModule` payout exclusion
- `price_breakdown` (JSONB) — **SNAPSHOT** of the full `PriceBreakdown` VO: `entries[]`, `tierApplied`, `calendarAdjustments[]`, `rawDurationHours`, `totalBillableHours`
- **Constraint (CHECK):** `product_id IS NOT NULL` (always); `inventory_item_id` nullable for over-rentals
- **Constraint (EXCLUDE):** Prevents double-booking of physical items (see §4)
- **Indexes:** `booking_id`, `product_id`, `inventory_item_id`, `owner_id`

#### **`booking_discounts`**

_(Unchanged — populated by PromotionEngine in v2)_

---

## 3. Design Rationale

### 3.1. `product_id` Non-Nullable on `booking_line_items`

Every line item is always traceable to a product for reporting, pricing, and payout logic. The previous design had both `product_id` and `inventory_item_id` nullable (XOR). We made `product_id` non-nullable because an over-rental line references a product directly, and a standard line references both a product and a specific item. No valid line item exists without a product.

### 3.2. `BillingUnit` as First-Class Entity

The previous `min_days`/`max_days`/`price_per_day` model encoded an implicit assumption that all billing happens in days. `BillingUnit` removes that assumption: a week is genuinely a week unit with its own rate, not 7 days. The engine normalizes to hours internally so tenants configure in human-readable units while the engine operates precisely.

### 3.3. Flat Tier Model

The entire booking is priced at the matched tier's rate (not progressive/bracket pricing). This is the standard commercial model for equipment rental — hitting a volume threshold rewards the entire booking with a better rate, incentivizing longer rentals.

### 3.4. `PriceBreakdown` JSONB Snapshot

The `price_breakdown` JSONB on each line item stores the complete, self-contained calculation audit trail. It is written once at booking creation and never updated. Disputes are resolved from the snapshot — the pricing engine is never re-run against historical bookings.

---

## 4. Concurrency Control

### EXCLUDE Constraint (Double-Booking Prevention)

Prevents two confirmed bookings from assigning the same physical `InventoryItem` to overlapping periods. Implemented via raw SQL migration (Prisma does not support EXCLUDE constraints natively):

```sql
ALTER TABLE booking_line_items
ADD CONSTRAINT prevent_double_booking
EXCLUDE USING GIST (
  inventory_item_id WITH =,
  (SELECT rental_period FROM bookings WHERE id = booking_id) WITH &&
)
WHERE (inventory_item_id IS NOT NULL);
```

The `WHERE (inventory_item_id IS NOT NULL)` clause ensures over-rental rows (null `inventory_item_id`) are excluded from the constraint, allowing multiple virtual bookings against the same product.

### XOR Integrity (Over-Rental vs Physical)

```sql
ALTER TABLE booking_line_items
ADD CONSTRAINT chk_booking_line_item_source
CHECK (
  inventory_item_id IS NOT NULL
  OR (inventory_item_id IS NULL AND product_id IS NOT NULL)
);
```

---

## 5. Availability Query Pattern

Availability accounts for both confirmed bookings and blackout periods. All temporal overlap uses PostgreSQL's native `&&` range operator on `tstzrange` columns with GiST indexes for performance.

```sql
SELECT
  ii.id,
  ii.total_quantity - (
    COALESCE(SUM(bli.quantity_rented), 0) +
    COALESCE((
      SELECT SUM(bp.blocked_quantity)
      FROM blackout_periods bp
      WHERE bp.inventory_item_id = ii.id
        AND bp.blocked_period && '[2024-10-01, 2024-10-05)'::tstzrange
    ), 0)
  ) AS available_quantity
FROM inventory_items ii
LEFT JOIN booking_line_items bli ON bli.inventory_item_id = ii.id
LEFT JOIN bookings b
  ON b.id = bli.booking_id
  AND b.rental_period && '[2024-10-01, 2024-10-05)'::tstzrange
  AND b.status IN ('RESERVED', 'ACTIVE')
WHERE ii.product_id = '<product_id>'
  AND ii.status != 'RETIRED'
GROUP BY ii.id;
```

**Note:** Rental period ranges use half-open intervals `[start, end)` — the end date is exclusive. A booking ending Monday morning does not conflict with one starting Monday morning.

---

## 6. Indexing Strategy

| Table                | Index Type | Columns                                         | Purpose                    |
| -------------------- | ---------- | ----------------------------------------------- | -------------------------- |
| All tables           | B-tree     | `tenant_id`                                     | Row-level security scoping |
| `bookings`           | GiST       | `rental_period`                                 | Temporal overlap queries   |
| `blackout_periods`   | GiST       | `blocked_period`                                | Temporal overlap queries   |
| `booking_line_items` | B-tree     | `booking_id`, `product_id`, `inventory_item_id` | Join performance           |
| `pricing_tiers`      | B-tree     | `product_id`, `inventory_item_id`               | Tier lookup                |
| `billing_units`      | B-tree     | `tenant_id`                                     | Tenant unit lookup         |

GiST indexes must be added via raw SQL migration — Prisma does not generate them automatically for `Unsupported("tstzrange")` columns.
