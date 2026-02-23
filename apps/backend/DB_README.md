````markdown
# Database Schema Design Document

**Project:** Rental SaaS Platform  
**Version:** 1.3  
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
5.  **Flexible Promotion Engine:** A rule-based discount system using JSONB configuration to support diverse promotional strategies.
6.  **CASL-Driven Authorization:** Permissions are stored as structured data (Action + Subject + Conditions) to allow dynamic, granular access control for employees without code changes.

---

## 2. Entity-Relationship Schema

### 2.1. Core Entities (Tenancy, IAM & Organization)

#### **`tenants`**

The root entity for multi-tenancy.

- `id` (PK, UUID)
- `name` (VARCHAR)
- `slug` (VARCHAR, Unique) — _Used for subdomain or URL identifiers_
- `plan_tier` (VARCHAR) — _e.g., 'starter', 'pro', 'enterprise'_
- `is_active` (BOOLEAN) — _Allows suspending access for non-payment_
- `created_at` (TIMESTAMP)

#### **`users`**

Employees or administrators who manage the tenant's account.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID) — _Index for RLS_
- `email` (VARCHAR, Unique) — _Global unique identifier for login_
- `password_hash` (VARCHAR) — _Hashed using bcrypt/argon2_
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role_id` (FK, UUID) — _Links to the tenant's role definition_
- `is_active` (BOOLEAN) — _Allows disabling specific employees_
- `last_login_at` (TIMESTAMP)

#### **`roles`**

Defines job functions within a tenant (e.g., "Admin", "Technician", "Accountant").

- `id` (PK, UUID)
- `tenant_id` (FK, UUID) — _Index for RLS. Roles are tenant-specific._
- `name` (VARCHAR) — _Display name_
- `is_system` (BOOLEAN) — _Protects default roles created during tenant signup_
- `description` (VARCHAR)

#### **`permissions`**

The granular rules that make up a Role. This structure mirrors the CASL library format for easy serialization.

- `id` (PK, UUID)
- `role_id` (FK, UUID) — _Links to the role_
- `action` (VARCHAR) — _e.g., 'create', 'read', 'update', 'manage'_
- `subject` (VARCHAR) — _The entity name, e.g., 'Booking', 'InventoryItem', 'User'_
- `conditions` (JSONB) — _Optional attribute-based filters (e.g., `{"createdById": "{{user.id}}"}`)_
- `fields` (VARCHAR, Nullable) — _Optional field-level restriction (e.g., 'status')_
- `inverted` (BOOLEAN) — _If true, represents a "Cannot" rule_

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

The definition layer (SKU). Describes _what_ the item is.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR)
- `tracking_type` (ENUM: `SERIALIZED`, `BULK`)
- `base_rental_price` (DECIMAL) — _Default price_
- `attributes` (JSONB) — _Flexible specs_

#### **`inventory_items`**

The physical layer. Represents a specific batch of items at a location.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `product_id` (FK, UUID)
- `location_id` (FK, UUID)
- `owner_id` (FK, UUID) — _Links to the Owner entity_
- `status` (ENUM: `OPERATIONAL`, `MAINTENANCE`, `RETIRED`)
- `total_quantity` (INT) — _Always 1 for SERIALIZED; >=1 for BULK_
- `serial_number` (VARCHAR, Nullable)
- `purchase_date` (DATE)
- `purchase_cost` (DECIMAL)

---

### 2.3. Transactional Entities

#### **`customers`**

Individuals or companies renting equipment.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name`, `email`, `phone`

#### **`promotions`**

Defines discount rules and validity periods.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `name` (VARCHAR)
- `code` (VARCHAR, Nullable)
- `is_active` (BOOLEAN)
- `valid_from` (TIMESTAMP)
- `valid_to` (TIMESTAMP)
- `rules` (JSONB)
- `reward` (JSONB)

#### **`bookings`**

The header record for a rental transaction.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `customer_id` (FK, UUID)
- `rental_period` (TSTZRANGE)
- `status` (ENUM: `RESERVED`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
- `subtotal` (DECIMAL)
- `total_discount` (DECIMAL)
- `total_tax` (DECIMAL)
- `grand_total` (DECIMAL)

#### **`booking_line_items`**

The intersection of Booking and Inventory.

- `id` (PK, UUID)
- `booking_id` (FK, UUID)
- `inventory_item_id` (FK, UUID)
- `owner_id` (FK, UUID) — **SNAPSHOT**
- `quantity_rented` (INT)
- `unit_price` (DECIMAL) — **SNAPSHOT**
- `line_total` (DECIMAL)

#### **`booking_discounts`**

Immutable ledger of applied discounts.

- `id` (PK, UUID)
- `tenant_id` (FK, UUID)
- `booking_id` (FK, UUID)
- `promotion_id` (FK, UUID, Nullable)
- `description` (VARCHAR) — **SNAPSHOT**
- `discount_amount` (DECIMAL) — **SNAPSHOT**
- `affected_line_items` (JSONB)

---

## 3. Design Rationale

### 3.1. CASL-Based Permission Storage

**Decision:** Storing `action`, `subject`, and `conditions` in a relational `permissions` table rather than hardcoding roles in code.
**Why:** This empowers Tenant Admins to create custom roles (e.g., "Junior Staff") via the UI without requiring code deployment. The structure maps 1:1 with the CASL `Ability` object, allowing the backend to simply query `SELECT * FROM permissions WHERE role_id = X` and construct the user's abilities instantly. The `conditions` JSONB column supports complex logic (e.g., "Users can only edit bookings they created") which is critical for B2B workflows.

### 3.2. User & Tenant Separation

**Decision:** `users` table contains `tenant_id` but `email` is globally unique.
**Why:**

1. **Login Simplicity:** Users login with one email and one password. We resolve their tenant context post-authentication.
2. **Future Cross-Tenant Access:** This structure allows a single user to potentially belong to multiple tenants in the future (via a join table migration) without changing the auth logic.

### 3.3. The "Allocatable Batch" Pattern

**Decision:** We placed `owner_id` on the `inventory_items` table.
**Why:** Inventory is physical capital. If Founder A's chairs are rented out, the system must know only Founder B's chairs are available. This enables precise revenue attribution.

### 3.4. Availability as a Derived Value

**Decision:** Removed the `available_quantity` column.
**Why:** Availability is a function of time. A cached column fails to account for future reservations. It is calculated dynamically by querying overlaps.

### 3.5. Financial Snapshots

**Decision:** Storing `owner_id`, `unit_price`, and discount details in transactional tables.
**Why:** Financial records must be immutable. Changes in ownership or pricing must not corrupt historical booking records.

---

## 4. Normalization Analysis

### 1NF (First Normal Form) — ✅ **COMPLIANT**

- All tables have PKs. Columns are atomic. JSONB fields are treated as atomic values.

### 2NF (Second Normal Form) — ✅ **COMPLIANT**

- No partial dependencies as all tables use surrogate UUID keys.

### 3NF (Third Normal Form) — ⚠️ **INTENTIONAL DEVIATION**

- **Violation:** `booking_line_items` and `booking_discounts` contain denormalized data.
- **Justification:** Historical Accuracy (Immutable Ledger pattern).

### 4NF (Fourth Normal Form) — ❌ **INTENTIONAL VIOLATION**

- **Violation:** `permissions.conditions` and `products.attributes` store multivalued facts in JSONB.
- **Justification:** Flexibility. Storing CASL conditions and product specs in separate tables creates an explosion of join tables that are unnecessary for these flexible attributes.

---

## 5. Implementation Notes

### Indexing Strategy

1.  **Tenant Indexing:** Index `tenant_id` on all tenant-scoped tables (`users`, `inventory_items`, `bookings`, etc.) for RLS performance.
2.  **Auth Lookup:** Unique index on `users` (`email`) for fast login checks.
3.  **Role Lookup:** Index on `permissions` (`role_id`) to quickly load abilities during the request lifecycle.
4.  **Temporal Lookup (GiST):** GiST index on `bookings.rental_period`.
5.  **Financial Reporting:** Index on `booking_line_items` (`owner_id`, `created_at`).

### Concurrency Control

Double-booking prevention using PostgreSQL **Exclusion Constraints**.

```sql
ALTER TABLE booking_line_items
ADD CONSTRAINT prevent_double_booking
EXCLUDE USING GIST (
    inventory_item_id WITH =,
    daterange(lower(booking.rental_period), upper(booking.rental_period)) WITH &&
);
```
````

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
