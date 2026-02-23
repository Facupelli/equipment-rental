# Database Schema Design Document

**Project:** Rental SaaS Platform
**Version:** 2.0
**Architectural Pattern:** Modular Monolith with Row-Level Security
**Database Engine:** PostgreSQL

---

## 1. Architectural Overview

This schema supports a B2B rental platform handling **serialized assets**, **bulk stock**, **over-rentals**, and **complex pricing logic**.

### Key Design Principles

1.  **Hybrid Booking Model:** Supports booking specific `inventory_items` (physical) or generic `products` (virtual/over-rental).
2.  **Temporal Availability:** Availability is derived from `bookings` AND `blackout_periods`.
3.  **Structured Pricing:** Tiered pricing is stored relationally for queryability; complex calculation results are stored as JSONB snapshots for transparency.
4.  **Financial Integrity:** Immutable snapshots ensure historical accuracy.

---

## 2. Entity-Relationship Schema

### 2.1. Core Entities (Tenancy, IAM & Organization)

#### **`tenants`**

- `id` (PK, UUID)
- `name` (VARCHAR)
- `slug` (VARCHAR, Unique)
- `plan_tier` (VARCHAR)
- `pricing_config` (JSONB) — _Stores `weekend_counts_as_one`, `over_rental_enabled`, `max_over_rent_threshold`._
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### **`users`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `role_id` (FK, UUID)
- `is_active` (BOOLEAN)

#### **`roles` & `permissions`**

_(Unchanged from previous version)_

#### **`locations`**

_(Unchanged from previous version)_

#### **`owners`**

_(Unchanged from previous version)_

---

### 2.2. Inventory Entities

#### **`products`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR)
- `tracking_type` (ENUM: `SERIALIZED`, `BULK`)
- `base_rental_price` (DECIMAL) — _Fallback rate if no tiers defined._
- `attributes` (JSONB)

#### **`pricing_tiers`** (NEW)

Defines price breaks based on duration.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `product_id` (FK, UUID, Nullable) — _Default pricing for product._
- `inventory_item_id` (FK, UUID, Nullable) — _Specific override for an item._
- `min_days` (DECIMAL) — _Start of tier (e.g., 0.0 for half-day)._
- `max_days` (DECIMAL, Nullable) — _End of tier (null for infinity)._
- `price_per_day` (DECIMAL)
- **Constraint:** CHECK (`min_days < max_days` OR `max_days IS NULL`)

#### **`inventory_items`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `product_id` (FK, UUID)
- `location_id` (FK, UUID)
- `owner_id` (FK, UUID)
- `status` (ENUM: `OPERATIONAL`, `MAINTENANCE`, `RETIRED`)
- `total_quantity` (INT)
- `serial_number` (VARCHAR, Nullable)
- `purchase_date` (DATE)
- `purchase_cost` (DECIMAL)

#### **`blackout_periods`** (NEW)

Blocks availability for specific items without creating a booking.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `inventory_item_id` (FK, UUID)
- `reason` (VARCHAR) — _e.g., "Maintenance", "Owner Use"_
- `blocked_period` (TSTZRANGE)
- `created_by` (FK, UUID -> users)

---

### 2.3. Transactional Entities

#### **`customers`**

_(Unchanged from previous version)_

#### **`bookings`**

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `customer_id` (FK, UUID)
- `rental_period` (TSTZRANGE)
- `status` (ENUM: `PENDING_CONFIRMATION`, `RESERVED`, `ACTIVE`, `COMPLETED`, `CANCELLED`) — _Added PENDING_CONFIRMATION._
- `subtotal` (DECIMAL)
- `total_discount` (DECIMAL)
- `total_tax` (DECIMAL)
- `grand_total` (DECIMAL)

#### **`booking_line_items`**

The intersection of Booking and Inventory/Products.

- `id` (PK, UUID)
- `booking_id` (FK, UUID)
- `inventory_item_id` (FK, UUID, **Nullable**) — _Null if over-rental._
- `product_id` (FK, UUID, **Nullable**) — _Set if over-rental. Null if standard._
- `owner_id` (FK, UUID, Nullable) — **SNAPSHOT** (Null if externally sourced).\_
- `is_externally_sourced` (BOOLEAN, Default FALSE) — _Flag for Billing logic._
- `quantity_rented` (INT)
- `unit_price` (DECIMAL) — **SNAPSHOT**
- `line_total` (DECIMAL)
- `price_breakdown` (JSONB) — **SNAPSHOT** of calculation (e.g., `[{date, type, rate}]`).
- **Constraint:** `CHECK ( (inventory_item_id IS NOT NULL AND product_id IS NULL) OR (inventory_item_id IS NULL AND product_id IS NOT NULL) )`

#### **`booking_discounts`**

_(Unchanged from previous version)_

---

## 3. Design Rationale

### 3.1. Hybrid Booking Reference (Over-Rental)

**Decision:** Nullable `inventory_item_id` with XOR constraint.
**Why:** This allows the system to distinguish between "I am renting Item A" (Standard) and "I need a Camera (Product X), find one later" (Over-Rental).
**Concurrency:** The existing Exclusion Constraint (see below) ignores rows where `inventory_item_id` is NULL, automatically enabling soft-blocking for over-rentals.

### 3.2. Pricing Tier Hierarchy

**Decision:** Separate table for tiers.
**Why:** Allows relational queries (e.g., "Find all products with a day-rate < $50"). Supports decimal days (0.5) for half-day logic.

### 3.3. Price Breakdown Snapshots

**Decision:** Store calculation details in `booking_line_items.price_breakdown` (JSONB).
**Why:** In B2B, disputes are common. Being able to show "Day 1: $100, Day 2 (Weekend): $0" justifies the `grand_total` without re-running complex historic logic.

---

## 4. Normalization Analysis

- **1NF/2NF/3NF:** Compliant (with intentional deviations for snapshots).
- **4NF:** Violated by `price_breakdown` (JSONB) and `pricing_config` (JSONB) for flexibility and audit trails.

---

## 5. Implementation Notes

### Indexing Strategy

1.  **Tenant Indexing:** Index `tenant_id` on all tables.
2.  **Temporal Lookup (GiST):**
    - GiST index on `bookings.rental_period`.
    - GiST index on `blackout_periods.blocked_period`.
3.  **Pricing Lookup:** Index on `pricing_tiers` (`product_id`, `inventory_item_id`).

### Concurrency Control

**Updated Exclusion Constraint:**
This constraint only fires when `inventory_item_id` is present. It allows multiple NULL references (over-rentals).

```sql
ALTER TABLE booking_line_items
ADD CONSTRAINT prevent_double_booking
EXCLUDE USING GIST (
    inventory_item_id WITH =,
    daterange(lower(booking.rental_period), upper(booking.rental_period)) WITH &&
);
```

_(Note: This requires a trigger or join logic to access `bookings.rental_period` or denormalizing the range onto the line item table)._

### Availability Query Pattern (Updated)

Availability must now account for blackouts.

```sql
SELECT
    ii.id,
    ii.total_quantity - (
        -- Booked Quantity
        COALESCE(SUM(bli.quantity_rented), 0) +
        -- Blacked Out Quantity (Assuming quantity 1 for serialized, or a qty column on blackout)
        (SELECT COUNT(*) FROM blackout_periods bp
         WHERE bp.inventory_item_id = ii.id
         AND bp.blocked_period && '[2023-10-01, 2023-10-05]'::tstzrange)
    ) as available_quantity
FROM inventory_items ii
LEFT JOIN booking_line_items bli ON bli.inventory_item_id = ii.id
LEFT JOIN bookings b ON b.id = bli.booking_id
    AND b.rental_period && '[2023-10-01, 2023-10-05]'::tstzrange
    AND b.status NOT IN ('CANCELLED', 'COMPLETED')
WHERE ii.product_id = '...'
GROUP BY ii.id;
```
