# Architecture Decision Record (ADR): Rental SaaS Platform

## Application Overview

**Product:** A B2B SaaS platform designed for equipment rental businesses.
**Goal:** To provide a customizable, multi-tenant solution that enables companies to manage inventory, handle complex booking lifecycles, track maintenance, and process billing.
**Target Audience:** Rental businesses ranging from construction machinery (heavy assets) to event gear (bulk stock).
**Key Differentiator:** Specialized support for both serialized asset tracking (maintenance history, depreciation) and bulk quantity management within a unified system.

---

## 1. Module Map (Bounded Contexts)

We will organize the code into **seven** primary modules. The dependencies flow strictly **inward or downward** (from business logic to infrastructure/persistence), never sideways between business modules.

### 1.1. `TenancyModule` (Platform Context)

**Responsibility:** Manages the SaaS platform structure, subscriptions, and the technical resolution of the tenant context.

- **Domain Concepts:** `Tenant`, `Subscription`, `Plan`, `PricingConfig`.
- **Why:** This is the "Kernel" layer for the SaaS business model. It isolates the logic for subscription billing and tenant onboarding.
- **Key Logic:** Subscription status checks, Plan limits enforcement, and storage of global business rules (e.g., `weekend_counts_as_one`, `over_rental_enabled`).
- **Dependencies:** None.

### 1.2. `UsersModule` (Identity Context)

**Responsibility:** Managing the user entities, profiles, and role assignments. This is the "Who."

- **Domain Concepts:** `User`, `Role`, `Profile`.
- **Why:** Centralizes the identity data. It is a stable domain that other modules (like Auth or Auditing) rely on, but it does not depend on them.
- **Key Logic:** User CRUD, Password hashing, Role assignment.
- **Dependencies:** None (Stand-alone domain).

### 1.3. `AuthModule` (Authentication Context)

**Responsibility:** Verifying identity and issuing tokens. This is the "How."

- **Domain Concepts:** `AccessToken`, `Session` (optional).
- **Why:** Encapsulates the security mechanisms (Passport, JWT) separate from user data storage.
- **Key Logic:** Login flow, Token signing/verification, Guards.
- **Dependencies:** `UsersModule` (via Interface/Port to validate credentials).

### 1.4. `InventoryModule` (Asset & Catalog Context)

**Responsibility:** Managing the "Supply Side" of the business. It knows _what_ items exist, _where_ they are, and _who_ owns them.

- **Aggregates:** `Product`, `InventoryItem`, `BlackoutPeriod`, `PricingTier`.
- **Entities:** `Location`, `Owner`, `MaintenanceRecord`.
- **Domain Logic:**
  - **Hybrid Tracking:** Logic to enforce rules based on `tracking_type`.
  - **Availability Blocks:** Managing `BlackoutPeriods` for maintenance or owner reservations.
  - **Pricing Definitions:** Storing `PricingTiers` (Day 1 rate, Day 2 rate, etc.) and item-level overrides.
- **Dependencies:** None (Stand-alone domain).

### 1.5. `RentalModule` (Core Transaction Context)

**Responsibility:** Managing the "Demand Side" and the critical path of the business—Booking lifecycle and Availability.

- **Aggregates:** `Booking` (Root).
- **Entities:** `BookingLineItem`.
- **Domain Services:** `AvailabilityService`, `PricingEngine`.
- **Domain Logic:**
  - **Availability Calculation:** Intersects requested dates with existing bookings AND blackout periods.
  - **Over-Rental Logic:** Checks tenant config to allow "soft" bookings against Products (not Items) when stock is 0.
  - **Reservation Logic:** State machine (`PENDING_CONFIRMATION` -> `RESERVED` -> `ACTIVE` -> `COMPLETED`).
  - **Pricing Pipeline:** Calculates `billable_days` (applying weekend rules), resolves pricing tiers, and generates a `price_breakdown` snapshot.
- **Dependencies:** `InventoryModule` (Read-only access), `CustomerModule`.

### 1.6. `BillingModule` (Financial Settlement Context)

**Responsibility:** The financial aftermath of a rental. Invoicing, payments, and complex owner payouts.

- **Aggregates:** `Invoice`, `Payout`.
- **Domain Logic:**
  - **Invoice Generation:** Triggered by events (`BookingCompleted`).
  - **Revenue Splitting:** Uses the "Snapshot" data (checking `is_externally_sourced` flag) to calculate payouts. External items are excluded from owner payouts.
- **Dependencies:** `RentalModule` (Reads snapshots, listens to events).

### 1.7. `CustomerModule` (CRM Context)

**Responsibility:** Managing the people renting the equipment.

- **Aggregates:** `Customer`.
- **Domain Logic:** KYC (Know Your Customer), blacklisting problematic renters, credit limit checks.
- **Dependencies:** None.

---

## 2. Handling the "Availability" Conundrum

**Decision:** Keep `Availability` logic inside the `RentalModule`.

**Implementation (Pragmatic DDD):**
The `AvailabilityService` performs a coordinated check:

1.  **Fetch Capacity:** Queries `InventoryModule` for total stock and `BlackoutPeriods`.
2.  **Calculate Utilized:** Queries `Bookings` for overlapping confirmed reservations.
3.  **Compute Net Available:** `Total - (Booked + Blackouts)`.
4.  **Over-Rental Check:** If Net Available < Requested Quantity, check `TenantConfig.over_rental_enabled`. If true, return status `OVERBOOK_WARNING`.

---

## 3. Aggregate Design & Invariants

### Aggregate Root: `Booking` (in RentalModule)

- **Invariants:** "Cannot double-book physical items," "Start date < End date."
- **Concurrency Control:**
  - **Physical Path:** If `inventory_item_id` is present, DB Exclusion Constraint prevents overlap.
  - **Virtual Path:** If `product_id` is present (Over-Rental), constraint allows overlap. Application logic enforces `max_over_rent_threshold`.

### Aggregate Root: `InventoryItem` (in InventoryModule)

- **Invariants:** "Cannot rent RETIRED item."
- **Behavior:** `BlackoutPeriods` are child entities of `InventoryItem`.

---

## 4. Event-Driven Communication (Decoupling)

| Event                           | Publisher           | Subscriber             | Action                                            |
| :------------------------------ | :------------------ | :--------------------- | :------------------------------------------------ |
| `booking.created`               | **RentalModule**    | **NotificationModule** | Send confirmation email to Customer.              |
| `booking.pending_confirmation`  | **RentalModule**    | **NotificationModule** | Alert Admin to source equipment for over-rental.  |
| `booking.completed`             | **RentalModule**    | **BillingModule**      | Generate Invoice & Trigger Payout calculation.    |
| `inventory.maintenance_started` | **InventoryModule** | **RentalModule**       | Creates `BlackoutPeriod`, affecting availability. |

---

## 5. File Structure (Monorepo Implementation)

This structure enforces the boundaries physically in the code.

```text
apps/backend/src/
├── app.module.ts
├── main.ts
├── core/                 # Shared Kernel (DB connection, Logger, Constants)
│
├── modules/
│   ├── auth/             # Context: Authentication
│   │   └── ...
│   │
│   ├── users/            # Context: Identity Management
│   │   └── ...
│   │
│   ├── tenancy/          # Context: Platform Foundation
│   │   ├── domain/
│   │   │   └── entities/ (tenant.entity.ts)
│   │   ├── domain/value-objects/ (pricing-config.vo.ts)
│   │   └── ...
│   │
│   ├── inventory/        # Context: Asset Management
│   │   ├── domain/
│   │   │   ├── entities/ (product.entity.ts, inventory-item.entity.ts)
│   │   │   ├── aggregates/ (pricing-tier.entity.ts, blackout-period.entity.ts)
│   │   │   └── repositories/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── rental/           # Context: Booking Operations
│   │   ├── domain/
│   │   │   ├── aggregates/ (booking.aggregate.ts)
│   │   │   ├── services/
│   │   │   │   ├── availability.service.ts
│   │   │   │   └── pricing-engine.service.ts  <-- NEW
│   │   ├── application/
│   │   │   ├── commands/ (create-booking.command.ts)
│   │   └── infrastructure/
│   │
│   ├── billing/          # Context: Finance
│   │   └── ...
│   │
│   └── customer/         # Context: CRM
│       └── ...
```

---
