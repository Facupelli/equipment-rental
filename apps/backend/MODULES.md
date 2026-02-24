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
- **Entities:** `Location`, `Owner`
- **Domain Logic:**
  - **Hybrid Tracking:** Rules enforced based on `trackingType` (`SERIALIZED` vs `BULK`)
  - **Base Tier Invariant:** `Product.create()` requires a `baseTier` parameter. A product cannot exist without at least one `PricingTier` with `fromUnit: 1`. `removePricingTier()` guards against removing this base tier.
  - **Availability Blocks:** `BlackoutPeriod` lifecycle on `InventoryItem`
  - **Pricing Definitions:** `PricingTier` CRUD with currency consistency and uniqueness invariants enforced by the `Product` aggregate
- **Ports Implemented:** `ProductRepositoryPort`, `RentalProductQueryPort` (defined by `RentalModule`, implemented here)
- **Dependencies:** None (stand-alone domain)

---

### 1.5. `RentalModule` (Core Transaction Context)

**Responsibility:** Managing the "Demand Side" — booking lifecycle, availability, and pricing calculation.

- **Aggregate Root:** `Booking`
  - **Child Entities:** `BookingLineItem[]`
- **Domain Services:**
  - `AvailabilityService` — intersects requested dates with existing bookings and blackout periods; checks `TenantPricingConfig.overRentalEnabled` to allow soft bookings
  - `PricingEngine` — pure domain service, four-stage pipeline (see ADR-1 §9)
- **Value Objects:** `PriceBreakdown` (immutable snapshot, persisted as JSONB per line item), `Money` (wraps `decimal.js` for all financial arithmetic)
- **Cross-Module Ports (defined here, implemented elsewhere):**
  - `RentalProductQueryPort` → implemented by `PrismaProductRepository` in `InventoryModule`
  - `CustomerRepository` → implemented by `PrismaCustomerRepository` in `CustomerModule`
- **Domain Logic:**
  - Booking state machine: `PENDING_CONFIRMATION` → `RESERVED` → `ACTIVE` → `COMPLETED` / `CANCELLED`
  - Conservative status derivation: if any line is `PENDING_CONFIRMATION`, the whole booking becomes `PENDING_CONFIRMATION`
  - Physical item auto-assignment for `SERIALIZED` products (preferred item hint supported)
  - Financial summary derivation from line totals (`subtotal`, `grandTotal`)
  - Pricing inputs (tiers, billing units, config) fetched by the application layer before calling the engine — the engine itself is pure
- **Dependencies:** `InventoryModule` (read-only via port), `CustomerModule` (read-only via port), `TenancyModule` (reads `TenantPricingConfig` and `BillingUnit[]`)

---

### 1.6. `BillingModule` (Financial Settlement Context)

**Responsibility:** The financial aftermath of a rental — invoicing, payments, and complex owner payouts.

- **Aggregates:** `Invoice`, `Payout`
- **Domain Logic:**
  - Invoice generation triggered by `booking.completed` event
  - Revenue splitting using `isExternallySourced` flag on `BookingLineItem` — externally sourced items are excluded from owner payouts
- **Dependencies:** `RentalModule` (reads snapshots, listens to domain events)

---

### 1.7. `CustomerModule` (CRM Context)

**Responsibility:** Managing the people renting the equipment.

- **Aggregate Root:** `Customer`
- **Domain Logic:** KYC, blacklisting, credit limit checks
- **Dependencies:** None

---

## 2. Availability Calculation

**Decision:** Keep `AvailabilityService` inside `RentalModule`.

The service performs a coordinated check across two data sources via ports:

1. **Fetch Capacity:** Query `InventoryModule` for total item stock and active `BlackoutPeriods` overlapping the requested window (using PostgreSQL `&&` range overlap on `tstzrange`)
2. **Calculate Utilized:** Query confirmed bookings (`RESERVED`, `ACTIVE`) overlapping the requested window
3. **Compute Net Available:** `Total − (Booked + Blacked Out)`
4. **Over-Rental Check:** If Net Available < Requested Quantity, check `TenantPricingConfig.overRentalEnabled`. If true, return `OVERBOOK_WARNING`; otherwise `UNAVAILABLE`

---

## 3. Aggregate Design & Invariants

### `Booking` (RentalModule)

- **Invariants:** "Cannot double-book physical items" (enforced by DB EXCLUDE constraint on `tstzrange`), "Start date < end date"
- **Concurrency:**
  - Physical path (`inventoryItemId` set): DB Exclusion Constraint on `booking_line_items` prevents overlap
  - Virtual path (`inventoryItemId` null, over-rental): constraint bypassed; application enforces `maxOverRentThreshold`
- **Financial fields** (`subtotal`, `totalDiscount`, `totalTax`, `grandTotal`) are derived from line items at creation time and stored as snapshots. `totalDiscount` and `totalTax` default to 0 at booking creation — updated when the `PromotionEngine` (v2) applies discounts

### `Product` (InventoryModule)

- **Invariants:** "Must have at least one `PricingTier` with `fromUnit: 1`", "All tiers must share the same currency", "No two tiers can share the same `billingUnitId` + `fromUnit` + `inventoryItemId` combination"
- **No `basePrice` field:** The base tier replaces it entirely. A product without pricing cannot be created.

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
│   │   │   │   ├── product.entity.ts           # Aggregate Root — owns PricingTier[]
│   │   │   │   ├── pricing-tier.entity.ts      # Child of Product
│   │   │   │   ├── inventory-item.entity.ts    # Aggregate Root — owns BlackoutPeriod[]
│   │   │   │   └── blackout-period.entity.ts
│   │   │   └── ports/
│   │   │       └── product.repository.port.ts
│   │   ├── application/
│   │   └── infrastructure/
│   │       ├── repositories/
│   │       │   └── prisma-product.repository.ts  # Implements ProductRepositoryPort
│   │       │                                      # + RentalProductQueryPort
│   │       └── mappers/
│   │           └── product.mapper.ts
│   │
│   ├── rental/                       # Context: Booking Operations
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   │   └── booking.aggregate.ts
│   │   │   ├── entities/
│   │   │   │   └── booking-line-item.entity.ts
│   │   │   ├── services/
│   │   │   │   ├── availability.service.ts
│   │   │   │   └── pricing-engine/
│   │   │   │       ├── pricing-engine.service.ts   # Orchestrator — @Injectable
│   │   │   │       ├── unit-decomposition.ts       # Stage 2 — pure function
│   │   │   │       ├── tier-resolution.ts          # Stage 3 — pure function
│   │   │   │       └── amount-calculation.ts       # Stage 4 — pure function
│   │   │   └── ports/
│   │   │       └── rental-product-query.port.ts   # Defined here, implemented in InventoryModule
│   │   ├── application/
│   │   │   └── commands/
│   │   │       ├── create-booking.command.ts       # Zod schema + DTO + Command type
│   │   │       └── create-booking.handler.ts       # Orchestrates critical path
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
