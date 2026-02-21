# Database Schema Design Document

**Project:** Rental SaaS Platform  
**Version:** 1.2  
**Architectural Pattern:** Modular Monolith with Row-Level Security  
**Database Engine:** PostgreSQL

---

## 1. Architectural Overview

This schema is designed to support a B2B rental platform that handles both **serialized assets** (heavy machinery) and **bulk stock** (event gear), across multiple locations and ownership structures.

### Key Design Principles

1.  **Hybrid Inventory Model:** A unified structure that accommodates both unique asset tracking (1-to-1) and bulk quantity tracking (1-to-many).
2.  **Allocatable Batches:** Ownership is tied to physical stock "batches" rather than abstract product definitions, ensuring precise financial settlements.
3.  **Financial Integrity:** Immutable snapshots in booking records ensure historical data accuracy even if current inventory, pricing, or promotions change.
4.  **Temporal Availability:** Availability is treated as a derived calculation based on time ranges, rather than a static cached state, ensuring accurate future booking capabilities.
5.  **Flexible Promotion Engine:** A rule-based discount system using JSONB configuration to support diverse promotional strategies (combos, duration-based, codes) without schema rigidness.

---

## 2. Entity-Relationship Schema

### 2.1. Core Entities (Tenancy & Organization)

#### **`tenants`**

The root entity for multi-tenancy.

- `id` (PK, UUID)
- `name` (VARCHAR)
- `slug` (VARCHAR, Unique)
- `plan_tier` (VARCHAR)

#### **`locations`**

Physical sites where inventory is stored or operated from.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID) — _Index for RLS_
- `name` (VARCHAR)
- `address` (JSONB) — _Flexible structure for street, city, geo-coordinates_
- `is_active` (BOOLEAN)

#### **`owners`**

Individuals or entities that hold equity ownership of the inventory (Founders, Investors).

- `id` (PK, UUID)
- `tenant_id` (FK, UUID) — _Index for RLS_
- `name` (VARCHAR)
- `payout_details` (JSONB) — _Flexible storage for bank account info, PayPal, or split rules_

---

### 2.2. Inventory Entities

#### **`products`**

The definition layer (SKU). Describes _what_ the item is, not _where_ it is or _who_ owns it.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR)
- `tracking_type` (ENUM: `SERIALIZED`, `BULK`)
- `base_rental_price` (DECIMAL) — _Default price, can be overridden_
- `attributes` (JSONB) — _Flexible specs (e.g., `{ "weight": "2t", "power": "100hp" }`)_

#### **`inventory_items`**

The physical layer. Represents a specific batch of items at a specific location owned by a specific owner.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `product_id` (FK, UUID)
- `location_id` (FK, UUID)
- `owner_id` (FK, UUID) — _Links to the Owner entity_
- `status` (ENUM: `OPERATIONAL`, `MAINTENANCE`, `RETIRED`) — _Physical condition only_
- `total_quantity` (INT) — _Always 1 for SERIALIZED; >=1 for BULK_
- `serial_number` (VARCHAR, Nullable) — _Only for SERIALIZED type_
- `purchase_date` (DATE)
- `purchase_cost` (DECIMAL) — _For depreciation tracking_

---

### 2.3. Transactional Entities

#### **`customers`**

Individuals or companies renting equipment.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name`, `email`, `phone`

#### **`promotions`**

Defines discount rules and validity periods. Uses JSONB for flexible rule definition.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR) — _Display name (e.g., "Summer Sale")_
- `code` (VARCHAR, Nullable) — _Optional promo code for checkout (Unique per tenant)_
- `is_active` (BOOLEAN)
- `valid_from` (TIMESTAMP)
- `valid_to` (TIMESTAMP)
- `rules` (JSONB) — _Condition logic (e.g., product inclusion, duration minimums, combo triggers)_
- `reward` (JSONB) — _Benefit definition (e.g., percentage discount, fixed amount)_

#### **`bookings`**

The header record for a rental transaction.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `customer_id` (FK, UUID)
- `rental_period` (TSTZRANGE) — _Native PostgreSQL time range with timezone support_
- `status` (ENUM: `RESERVED`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
- `subtotal` (DECIMAL) — _Sum of line item base prices_
- `total_discount` (DECIMAL) — _Sum of applied discounts_
- `total_tax` (DECIMAL) — _Calculated tax amount_
- `grand_total` (DECIMAL) — _Final amount payable (`subtotal` - `total_discount` + `total_tax`)_

#### **`booking_line_items`**

The intersection of Booking and Inventory. This is where ownership allocation happens.

- `id` (PK, UUID)
- `booking_id` (FK, UUID)
- `inventory_item_id` (FK, UUID) — _Links to the specific batch rented_
- `owner_id` (FK, UUID) — **SNAPSHOT:** Copied from `inventory_item` at time of booking
- `quantity_rented` (INT)
- `unit_price` (DECIMAL) — **SNAPSHOT:** Copied from `product` or custom price
- `line_total` (DECIMAL)

#### **`booking_discounts`**

Immutable ledger of applied discounts to ensure historical financial integrity.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `booking_id` (FK, UUID)
- `promotion_id` (FK, UUID, Nullable) — _Links to the rule (Nullable if manually applied)_
- `description` (VARCHAR) — **SNAPSHOT:** Text description of the discount at time of application
- `discount_amount` (DECIMAL) — **SNAPSHOT:** The calculated monetary value
- `affected_line_items` (JSONB) — _Metadata: IDs of line items that contributed to/received the discount_

---

## 3. Design Rationale

### 3.1. The "Allocatable Batch" Pattern

**Decision:** We placed `owner_id` on the `inventory_items` table rather than the `products` table.
**Why:** Rental inventory is not an abstract concept; it is physical capital. If Founder A owns 5 chairs and Founder B owns 5 chairs, and Founder A's chairs are broken or rented out, the system must know that only Founder B's chairs are available for the next rental. By attaching ownership to the "Batch" (`inventory_item`), we enable the application code to perform an "Allocation Strategy" (e.g., FIFO or Location Priority) that attributes earnings precisely to the correct owner based on actual availability.

### 3.2. Availability as a Derived Value

**Decision:** Removed the `available_quantity` column from `inventory_items`.
**Why:** In a rental business, "Availability" is a function of time, not a static state. A cached `available_quantity` column only represents "on-hand" stock _now_, failing to account for future returns or upcoming reservations.
**Implementation:** Availability is calculated dynamically by querying the overlap between the requested time range and existing `booking_line_items`. This prevents "phantom availability" (where items show as available but are booked for the requested dates) and eliminates the complexity of keeping a cached column in sync with future bookings.

### 3.3. Financial Snapshots

**Decision:** Storing `owner_id` and `unit_price` in `booking_line_items`, and `discount_amount`/`description` in `booking_discounts`.
**Why:** Financial records must be immutable. If an item changes ownership next month, previous bookings must still attribute revenue to the _previous_ owner. Similarly, if rental prices change or active promotions are modified/deleted, historical bookings should reflect the price and discounts agreed upon at the time of rental. The `booking_discounts` table ensures that revenue reports remain accurate even if marketing campaigns change.

### 3.4. Flexible Promotion Engine

**Decision:** Using JSONB columns (`rules`, `reward`) in the `promotions` table instead of rigid columns like `is_early_bird` or `bundle_id`.
**Why:** Discount logic is highly variable and tenant-specific. A construction rental tenant may need "Long-term duration discounts," while an event tenant needs "Product Bundles (Combos)." Hard-coding these types requires schema migrations for every new marketing idea. JSONB allows the application to serialize complex logic (e.g., "If Product A and Product B are in cart, apply 10% to Product B") without database changes, supporting a "Build-your-own-rule" UI in the frontend.

---

## 4. Normalization Analysis

Our schema adheres to a **"Pragmatically Normalized"** standard. We prioritize data integrity and performance over academic purity.

### 1NF (First Normal Form) — ✅ **COMPLIANT**

- All tables have a Primary Key (`id`).
- All columns are atomic (values are not lists or sets).
- The JSONB fields (`attributes`, `rules`, `reward`) and Range fields (`rental_period`) are treated as atomic values by the database engine, satisfying 1NF.

### 2NF (Second Normal Form) — ✅ **COMPLIANT**

- All tables use surrogate keys (UUIDs).
- There are no composite primary keys; therefore, no partial dependencies exist.

### 3NF (Third Normal Form) — ⚠️ **INTENTIONAL DEVIATION**

- **Violation:** `booking_line_items` contains `owner_id` and `unit_price`. `booking_discounts` contains `discount_amount` and `description`.
- **Justification:** **Historical Accuracy.** This is a standard denormalization pattern for financial ledgers. We violate 3NF to ensure that changes in the source data (ownership, pricing, or promotion rules) do not corrupt historical financial records. The "truth" is frozen at the moment of transaction.

### 4NF (Fourth Normal Form) — ❌ **INTENTIONAL VIOLATION**

- **Violation:** The `products.attributes`, `promotions.rules`, and `promotions.reward` JSONB columns store multiple independent facts without a defined schema.
- **Justification:** **SaaS Flexibility.** Strict normalization of these attributes makes querying and indexing significantly complex and slow for a multi-tenant system. It would also require continuous schema migrations to accommodate new product attributes or discount logic.

### 5NF (Fifth Normal Form) — ✅ **COMPLIANT**

- The schema avoids complex cyclic constraints. The relationships are direct and reconstructable without loss of data integrity.

---

## 5. Implementation Notes

### Indexing Strategy

1.  **Tenant Indexing:** All tables must have an index on `tenant_id` to support Row-Level Security (RLS) policies efficiently.
2.  **Temporal Lookup (GiST):** A GiST index on `bookings.rental_period` to enable fast overlap queries.
    ```sql
    CREATE INDEX idx_bookings_rental_period ON bookings USING GIST (rental_period);
    ```
3.  **Financial Reporting:** An index on `booking_line_items` (`owner_id`, `created_at`) to generate "Payout Reports" efficiently.
4.  **Promotion Lookup:** A unique index on `promotions` (`tenant_id`, `code`) to allow fast code validation and ensure uniqueness per tenant.

### Concurrency Control

Double-booking prevention is enforced using PostgreSQL's native **Exclusion Constraints**.

**Implementation:**
Add an exclusion constraint to `booking_line_items` that prevents overlapping `rental_period` entries for the same `inventory_item_id`.

```sql
ALTER TABLE booking_line_items
ADD CONSTRAINT prevent_double_booking
EXCLUDE USING GIST (
    inventory_item_id WITH =,
    daterange(lower(booking.rental_period), upper(booking.rental_period)) WITH &&
);
```

_Note: This requires a trigger or application logic to denormalize the `rental_period` from the `bookings` table to `booking_line_items`, or a more complex constraint setup._

### Availability Query Pattern

To check availability, use a Date Intersection Query rather than reading a column:

```sql
SELECT
    ii.id,
    ii.total_quantity - COALESCE(SUM(bli.quantity_rented), 0) as available_quantity
FROM inventory_items ii
LEFT JOIN booking_line_items bli ON bli.inventory_item_id = ii.id
LEFT JOIN bookings b ON b.id = bli.booking_id
    AND b.rental_period && '[2023-10-01, 2023-10-05]'::tstzrange -- Overlap check
    AND b.status NOT IN ('CANCELLED', 'COMPLETED')
WHERE ii.product_id = '...'
GROUP BY ii.id;
```
