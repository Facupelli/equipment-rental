# Architecture Decision Record (ADR): Rental SaaS Platform — Module Map

## Application Overview

**Product:** A B2B SaaS platform designed for equipment rental businesses.
**Goal:** To provide a customizable, multi-tenant solution that enables companies to manage inventory, handle complex booking lifecycles, track maintenance, and process billing.
**Target Audience:** Rental businesses ranging from construction machinery (heavy assets) to event gear (bulk stock).
**Key Differentiator:** Specialized support for both serialized asset tracking (maintenance history, depreciation) and bulk quantity management within a unified system.

---

## 1. Module Map (Bounded Contexts)

We organize the code into **seven** primary modules. Dependencies flow strictly **inward or downward** — never sideways between business modules. Cross-module data access is mediated exclusively through focused ports (abstract classes).

### 1.1. `TenancyModule` (Platform Context)

**Responsibility:** Manages the SaaS platform structure, tenant onboarding, and global business rule configuration.

- **Aggregate Root:** `Tenant`
- **Child Entities:** `BillingUnit` (owned by Tenant — defines tenant-specific billing units and their hour equivalents)
- **Value Objects:** `TenantPricingConfig` (embedded in `Tenant` — holds `weekendCountsAsOne`, `roundingRule`, `overRentalEnabled`, `maxOverRentThreshold`)
- **Key Logic:**
  - Subscription status checks and plan limit enforcement
  - Tenant onboarding with default `TenantPricingConfig` (sensible defaults provided — a new tenant can rent without manual configuration)
  - `BillingUnit` lifecycle management with uniqueness enforcement per tenant
- **Dependencies:** None.

**Design Note:** `TenantPricingConfig` and `RoundingRule` are defined here and imported by `RentalModule`'s `PricingEngine`. This direction is correct — `TenancyModule` is the kernel; it does not depend on rental concerns.

---

### 1.2. `UsersModule` (Identity Context)

**Responsibility:** Managing user entities, profiles, and role assignments. This is the "Who."

- **Domain Concepts:** `User`, `Role`, `Profile`
- **Key Logic:** User CRUD, password hashing, role assignment
- **Dependencies:** None (stand-alone domain)

---

### 1.3. `AuthModule` (Authentication Context)

**Responsibility:** Verifying identity and issuing tokens. This is the "How."

- **Domain Concepts:** `AccessToken`, `Session` (optional)
- **Key Logic:** Login flow, token signing/verification, Guards, `TenancyGuard` (injects `tenantId` from JWT into commands — callers never self-declare their tenant)
- **Dependencies:** `UsersModule` (via port to validate credentials)

---

### 1.4. `InventoryModule` (Asset & Catalog Context)

**Responsibility:** Managing the "Supply Side" — what items exist, where they are, and who owns them.

- **Aggregate Root:** `Product`
  - **Child Entities:** `PricingTier[]` — product-level and item-level override tiers. `Product` owns all tiers; `InventoryItem` does not own tiers directly. The `inventoryItemId` on a tier is a scope field, not a transfer of aggregate ownership.
- **Aggregate Root:** `InventoryItem`
  - **Child Entities:** `BlackoutPeriod[]`
  - **Entity:** `Category` — flat, tenant-scoped taxonomy label for products. One category has many products; a product belongs to at most one category.
- **Aggregate Root:** `ProductBundle`
  - **Child Entities:** `BundleComponent[]`, `BundlePricingTier[]`
  - A bundle is a catalog-layer grouping of products offered at a combined price. It has no inventory of its own — it draws from its component products' pools at booking time.
  - The base tier invariant applies: a bundle cannot be created without at least one `BundlePricingTier` with `fromUnit: 1`.
  - `BundlePricingTier` is a dedicated model, separate from `PricingTier`. It has no `inventoryItemId` — bundles have no item-level price overrides.
- **Entities:** `Location`, `Owner`
- **Domain Logic:**
  - **Hybrid Tracking:** Rules enforced based on `trackingType` (`SERIALIZED` vs `BULK`)
  - **Base Tier Invariant:** `Product.create()` requires a `baseTier` parameter. A product cannot exist without at least one `PricingTier` with `fromUnit: 1`. `removePricingTier()` guards against removing this base tier. Same invariant applies to `ProductBundle`.
  - **Availability Blocks:** `BlackoutPeriod` lifecycle on `InventoryItem`
  - **Pricing Definitions:** `PricingTier` and `BundlePricingTier` CRUD with currency consistency and uniqueness invariants enforced by their respective aggregates
  - **Bundle Composition:** `BundleComponent` declares which products (and what quantities) compose a bundle. A product can participate in multiple bundles. A product cannot be deleted while it is part of an active bundle (`onDelete: Restrict` on `BundleComponent.product`).
- **Ports Implemented:** `ProductRepositoryPort`, `RentalProductQueryPort`, `RentalBundleQueryPort` (both defined by `RentalModule`, implemented here)
- **Dependencies:** None (stand-alone domain)

---

### 1.5. `RentalModule` (Core Transaction Context)

**Responsibility:** Managing the "Demand Side" — booking lifecycle, availability, and pricing calculation.

- **Aggregate Root:** `Booking`
  - **Child Entities:** `BookingLineItem[]`
    - A line item is either a **standalone product** (`productId` set, `bundleId` null, `parentLineItemId` null), a **bundle parent** (`bundleId` set, `productId` null, `parentLineItemId` null), or a **bundle child / component** (`productId` set, `bundleId` null, `parentLineItemId` set).
    - Financial value (`unitPrice`, `lineTotal`) lives exclusively on standalone and parent line items. Children always have `lineTotal: 0` and serve as inventory tracking records only.
- **Domain Services:**
  - `AvailabilityService` — intersects requested dates with existing bookings and blackout periods; checks `TenantPricingConfig.overRentalEnabled` to allow soft bookings. **Has no knowledge of bundles.** It always receives a flat product demand map, regardless of whether demand originated from a standalone item or a bundle component.
  - `PricingEngine` — pure domain service, four-stage pipeline (see ADR-1 §9). Receives `BundlePricingTier[]` in the same shape as `PricingTier[]` — no bundle-specific logic inside the engine.
- **Value Objects:** `PriceBreakdown` (immutable snapshot, persisted as JSONB per line item), `Money` (wraps `decimal.js` for all financial arithmetic)
- **Cross-Module Ports (defined here, implemented elsewhere):**
  - `RentalProductQueryPort` → implemented by `PrismaProductRepository` in `InventoryModule`
  - `RentalBundleQueryPort` → implemented by `PrismaBundleRepository` in `InventoryModule`
  - `CustomerRepository` → implemented by `PrismaCustomerRepository` in `CustomerModule`
- **Domain Logic:**
  - Booking state machine: `PENDING_CONFIRMATION` → `RESERVED` → `ACTIVE` → `COMPLETED` / `CANCELLED`
  - Conservative status derivation: if any line is `PENDING_CONFIRMATION`, the whole booking becomes `PENDING_CONFIRMATION`
  - Physical item auto-assignment for `SERIALIZED` products (preferred item hint supported)
  - Financial summary derivation from line totals (`subtotal`, `grandTotal`) — derived from parent and standalone line items only; children are excluded
  - **Bundle expansion at booking creation:**
    1. Fetch bundle components via `RentalBundleQueryPort`
    2. Expand into child line item objects in memory (not yet persisted)
    3. Merge with standalone line items into a unified product demand map
    4. Pass flat demand map to `AvailabilityService`
    5. If all demands are satisfiable, persist parent + children atomically
  - Bundle availability is all-or-nothing: if any component cannot be fully satisfied, the entire bundle line is rejected
  - Pricing inputs (tiers, billing units, config) fetched by the application layer before calling the engine — the engine itself is pure
- **Dependencies:** `InventoryModule` (read-only via port), `CustomerModule` (read-only via port), `TenancyModule` (reads `TenantPricingConfig` and `BillingUnit[]`)

---

### 1.6. `BillingModule` (Financial Settlement Context)

**Responsibility:** The financial aftermath of a rental — invoicing, payments, and complex owner payouts.

- **Aggregates:** `Invoice`, `Payout`
- **Domain Logic:**
  - Invoice generation triggered by `booking.completed` event
  - Revenue splitting using `isExternallySourced` flag on `BookingLineItem` — externally sourced items are excluded from owner payouts
  - Financial aggregation reads parent and standalone line items only — child component line items have `lineTotal: 0` and are invisible to billing math
- **Dependencies:** `RentalModule` (reads snapshots, listens to domain events)

---

### 1.7. `CustomerModule` (CRM Context)

**Responsibility:** Managing the people renting the equipment.

- **Aggregate Root:** `Customer`
- **Domain Logic:** KYC, blacklisting, credit limit checks
- **Dependencies:** None

---

## 2. Availability Calculation

**Decision:** Keep `AvailabilityService` inside `RentalModule`. The service is bundle-unaware — it always operates on a flat product demand map.

The booking handler is responsible for expanding bundles into product-level demand before calling the service. By the time `AvailabilityService` is invoked, it sees only product IDs and quantities, whether or not a bundle was involved.

The service performs a coordinated check across two data sources via ports:

1. **Fetch Capacity:** Query `InventoryModule` for total item stock and active `BlackoutPeriods` overlapping the requested window (using PostgreSQL `&&` range overlap on `tstzrange`)
2. **Calculate Utilized:** Query confirmed bookings (`RESERVED`, `ACTIVE`) overlapping the requested window — filtered by `product_id` on `booking_line_items`, no bundle joins required
3. **Compute Net Available:** `Total − (Booked + Blacked Out)`
4. **Over-Rental Check:** If Net Available < Requested Quantity, check `TenantPricingConfig.overRentalEnabled`. If true, return `OVERBOOK_WARNING`; otherwise `UNAVAILABLE`

---

## 3. Aggregate Design & Invariants

### `Booking` (RentalModule)

- **Invariants:** "Cannot double-book physical items" (enforced by DB EXCLUDE constraint on `tstzrange`), "Start date < end date"
- **Concurrency:**
  - Physical path (`inventoryItemId` set): DB Exclusion Constraint on `booking_line_items` prevents overlap — applies to both standalone and bundle child line items since children carry real `inventoryItemId` assignments
  - Virtual path (`inventoryItemId` null, over-rental): constraint bypassed; application enforces `maxOverRentThreshold`
- **Financial fields** (`subtotal`, `totalDiscount`, `totalTax`, `grandTotal`) are derived from standalone and parent line items at creation time and stored as snapshots. Children are excluded from all financial aggregation.

### `Product` (InventoryModule)

- **Invariants:** "Must have at least one `PricingTier` with `fromUnit: 1`", "All tiers must share the same currency", "No two tiers can share the same `billingUnitId` + `fromUnit` + `inventoryItemId` combination"
- **No `basePrice` field:** The base tier replaces it entirely. A product without pricing cannot be created.

### `ProductBundle` (InventoryModule)

- **Invariants:** "Must have at least one `BundlePricingTier` with `fromUnit: 1`", "All tiers must share the same currency", "Must have at least one `BundleComponent`"
- **No item-level tier overrides:** `BundlePricingTier` has no `inventoryItemId`. Bundle pricing is always defined at the bundle level.
- **Soft delete only:** A bundle that has ever been booked cannot be hard-deleted (`onDelete: Restrict` on `BookingLineItem.bundle`). Retiring a bundle uses `isActive: false`.

### `InventoryItem` (InventoryModule)

- **Invariants:** "Cannot rent a `RETIRED` item"
- **Behavior:** `BlackoutPeriods` are child entities managed through `InventoryItem`

---

## 4. Event-Driven Communication

| Event                           | Publisher           | Subscriber             | Action                                           |
| :------------------------------ | :------------------ | :--------------------- | :----------------------------------------------- |
| `booking.created`               | **RentalModule**    | **NotificationModule** | Send confirmation email to customer              |
| `booking.pending_confirmation`  | **RentalModule**    | **NotificationModule** | Alert admin to source equipment for over-rental  |
| `booking.completed`             | **RentalModule**    | **BillingModule**      | Generate invoice and trigger payout calculation  |
| `inventory.maintenance_started` | **InventoryModule** | **RentalModule**       | Creates `BlackoutPeriod`, affecting availability |

---

## 5. File Structure

```text
apps/backend/src/
├── app.module.ts
├── main.ts
├── core/                             # Shared Kernel (DB, Logger, Constants)
│
├── modules/
│   ├── auth/                         # Context: Authentication
│   │   └── ...
│   │
│   ├── users/                        # Context: Identity Management
│   │   └── ...
│   │
│   ├── tenancy/                      # Context: Platform Foundation
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── tenant.entity.ts
│   │   │   │   └── billing-unit.entity.ts
│   │   │   └── value-objects/
│   │   │       └── tenant-pricing-config.vo.ts
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── inventory/                    # Context: Asset Management
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── product.entity.ts               # Aggregate Root — owns PricingTier[]
│   │   │   │   ├── pricing-tier.entity.ts          # Child of Product
│   │   │   │   ├── inventory-item.entity.ts        # Aggregate Root — owns BlackoutPeriod[]
│   │   │   │   ├── category.entity.ts
│   │   │   │   ├── blackout-period.entity.ts
│   │   │   │   ├── product-bundle.entity.ts        # Aggregate Root — owns BundleComponent[] + BundlePricingTier[]
│   │   │   │   ├── bundle-component.entity.ts      # Child of ProductBundle
│   │   │   │   └── bundle-pricing-tier.entity.ts   # Child of ProductBundle
│   │   │   └── ports/
│   │   │       └── product.repository.port.ts
│   │   ├── application/
│   │   └── infrastructure/
│   │       ├── repositories/
│   │       │   ├── prisma-product.repository.ts    # Implements ProductRepositoryPort
│   │       │   │                                   # + RentalProductQueryPort
│   │       │   └── prisma-bundle.repository.ts     # Implements RentalBundleQueryPort
│   │       └── mappers/
│   │           ├── product.mapper.ts
│   │           └── bundle.mapper.ts
│   │
│   ├── rental/                       # Context: Booking Operations
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   │   └── booking.aggregate.ts
│   │   │   ├── entities/
│   │   │   │   └── booking-line-item.entity.ts
│   │   │   ├── services/
│   │   │   │   ├── availability.service.ts         # Bundle-unaware — receives flat demand map
│   │   │   │   └── pricing-engine/
│   │   │   │       ├── pricing-engine.service.ts   # Orchestrator — @Injectable
│   │   │   │       ├── unit-decomposition.ts       # Stage 2 — pure function
│   │   │   │       ├── tier-resolution.ts          # Stage 3 — pure function
│   │   │   │       └── amount-calculation.ts       # Stage 4 — pure function
│   │   │   └── ports/
│   │   │       ├── rental-product-query.port.ts    # Defined here, implemented in InventoryModule
│   │   │       └── rental-bundle-query.port.ts     # Defined here, implemented in InventoryModule
│   │   ├── application/
│   │   │   └── commands/
│   │   │       ├── create-booking.command.ts       # Zod schema + DTO + Command type
│   │   │       └── create-booking.handler.ts       # Orchestrates critical path + bundle expansion
│   │   └── infrastructure/
│   │       └── repositories/
│   │           └── prisma-booking.repository.ts
│   │
│   ├── billing/                      # Context: Finance
│   │   └── ...
│   │
│   └── customer/                     # Context: CRM
│       └── ...
│
└── shared/
    └── value-objects/
        ├── money.vo.ts               # Wraps decimal.js — all monetary arithmetic
        └── price-breakdown.vo.ts     # Immutable pricing snapshot — persisted as JSONB
```
