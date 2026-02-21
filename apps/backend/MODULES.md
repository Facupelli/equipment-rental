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

- **Domain Concepts:** `Tenant`, `Subscription`, `Plan`.
- **Why:** This is the "Kernel" layer for the SaaS business model. It isolates the logic for subscription billing and tenant onboarding.
- **Key Logic:** Subscription status checks, Plan limits enforcement (e.g., "max 500 inventory items"), and Infrastructure middleware to set the database `tenant_id` context (RLS).
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

- **Aggregates:** `Product` (The Definition), `InventoryItem` (The Physical Batch/Asset).
- **Entities:** `Location`, `Owner`, `MaintenanceRecord`.
- **Domain Logic:**
  - **Hybrid Tracking:** Logic to enforce rules based on `tracking_type` (e.g., ensuring `serial_number` is unique for SERIALIZED items, or managing `total_quantity` for BULK items).
  - **Maintenance:** Status transitions (`OPERATIONAL` <-> `MAINTENANCE`).
  - **Depreciation:** Calculations based on `purchase_cost` and `purchase_date`.
- **Dependencies:** None (Stand-alone domain).

### 1.5. `RentalModule` (Core Transaction Context)

**Responsibility:** Managing the "Demand Side" and the critical path of the business—Booking lifecycle and Availability.

- **Aggregates:** `Booking` (Root).
- **Entities:** `BookingLineItem`.
- **Domain Services:** `AvailabilityService`.
- **Domain Logic:**
  - **Availability Calculation:** Intersects requested dates with existing bookings.
  - **Reservation Logic:** Handles the state machine (`RESERVED` -> `ACTIVE` -> `COMPLETED`).
  - **Snapshotting:** Captures financial state (`owner_id`, `unit_price`) at the moment of booking.
- **Dependencies:** `InventoryModule` (Read-only access to check product details/ownership), `CustomerModule`.

### 1.6. `BillingModule` (Financial Settlement Context)

**Responsibility:** The financial aftermath of a rental. Invoicing, payments, and complex owner payouts.

- **Aggregates:** `Invoice`, `Payout`.
- **Domain Logic:**
  - **Invoice Generation:** Triggered by events (`BookingCompleted`).
  - **Revenue Splitting:** Uses the "Snapshot" data from `BookingLineItems` to calculate exactly how much `Owner A` vs `Owner B` is owed for a specific rental.
  - **Tax Calculation:** Applying local taxes to the invoice.
- **Dependencies:** `RentalModule` (Reads snapshots, listens to events).

### 1.7. `CustomerModule` (CRM Context)

**Responsibility:** Managing the people renting the equipment.

- **Aggregates:** `Customer`.
- **Domain Logic:** KYC (Know Your Customer), blacklisting problematic renters, credit limit checks.
- **Dependencies:** None.

---

## 2. Handling the "Availability" Conundrum

One of the hardest parts of DDD in rental systems is **Availability**. It requires data from `InventoryModule` (stock counts) and `RentalModule` (booked quantities).

**Decision:** Keep `Availability` logic inside the `RentalModule`.

**Why?**
"Availability" is a temporal concept that only exists because of a desire to book. Inventory just "sits there"; it is the _Booking_ that gives it meaning. Availability is a projection of the Rental context onto the Inventory data.

**Implementation (Pragmatic DDD):**
The `RentalModule` contains an **Application Service** called `AvailabilityService`.

1.  It queries `inventory_items` (Read-Only) to get the total capacity.
2.  It queries `bookings` (Read-Write) to calculate current utilization.
3.  It performs the math: `Available = Total - Utilized`.
4.  It returns the result to the UI or the `Booking` aggregate.

---

## 3. Aggregate Design & Invariants

Here we define where the "locks" and "rules" live to satisfy ADR #6 (Concurrency).

### Aggregate Root: `Booking` (in RentalModule)

This is the most critical aggregate.

- **Invariants:** "Cannot double-book," "Start date must be before end date," "Customer must be active."
- **Concurrency Control:**
  - When creating a booking, the `Booking` aggregate calls a repository method that utilizes the SQL `EXCLUSION CONSTRAINT` or `SELECT FOR UPDATE` described in your Schema Doc.
  - It ensures that the transaction succeeds or fails atomically.

### Aggregate Root: `InventoryItem` (in InventoryModule)

- **Invariants:** "Cannot rent a RETIRED item," "Bulk quantity cannot be negative."
- **Behavior:** If `status` changes to `MAINTENANCE`, the `RentalModule` will see this availability drop during its next check (or via an event), but `InventoryModule` doesn't manage bookings itself.

---

## 4. Event-Driven Communication (Decoupling)

To avoid "spaghetti code" where modules import each other directly, we use NestJS `EventEmitter` (ADR #7).

| Event                           | Publisher           | Subscriber             | Action                                                                              |
| :------------------------------ | :------------------ | :--------------------- | :---------------------------------------------------------------------------------- |
| `booking.created`               | **RentalModule**    | **NotificationModule** | Send confirmation email to Customer.                                                |
| `booking.completed`             | **RentalModule**    | **BillingModule**      | Generate Invoice & Trigger Payout calculation.                                      |
| `inventory.maintenance_started` | **InventoryModule** | **RentalModule**       | Update availability cache (if used) or flag item as unavailable for future lookups. |
| `payout.failed`                 | **BillingModule**   | **NotificationModule** | Alert Admin/Finance team.                                                           |

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
│   │   ├── domain/
│   │   │   └── ports/    (user-validator.port.ts - Interface)
│   │   ├── infrastructure/
│   │   │   ├── guards/   (jwt-auth.guard.ts)
│   │   │   └── strategies/ (jwt.strategy.ts, local.strategy.ts)
│   │   └── auth.module.ts
│   │
│   ├── users/            # Context: Identity Management
│   │   ├── domain/
│   │   │   ├── entities/ (user.entity.ts, role.entity.ts)
│   │   │   └── repositories/
│   │   ├── application/
│   │   │   └── users.service.ts (Implements UserValidator Port)
│   │   └── users.module.ts
│   │
│   ├── tenancy/          # Context: Platform Foundation
│   │   ├── domain/
│   │   │   └── entities/ (tenant.entity.ts, subscription.entity.ts)
│   │   ├── infrastructure/
│   │   │   └── middleware/ (tenant-context.middleware.ts - Sets RLS)
│   │   └── tenancy.module.ts
│   │
│   ├── inventory/        # Context: Asset Management
│   │   ├── domain/
│   │   │   ├── entities/ (product.entity.ts, inventory-item.entity.ts)
│   │   │   ├── value-objects/ (tracking-type.vo.ts)
│   │   │   └── repositories/
│   │   ├── application/  (Use Cases: CreateProduct, UpdateStock)
│   │   └── infrastructure/ (Controllers, TypeORM Repositories)
│   │
│   ├── rental/           # Context: Booking Operations
│   │   ├── domain/
│   │   │   ├── aggregates/ (booking.aggregate.ts)
│   │   │   ├── services/   (availability.service.ts - Domain Service)
│   │   │   └── events/
│   │   ├── application/
│   │   │   ├── commands/ (create-booking.command.ts)
│   │   │   └── sagas/    (Handle booking lifecycle)
│   │   └── infrastructure/
│   │
│   ├── billing/          # Context: Finance
│   │   ├── domain/
│   │   ├── application/  (Listens to events, handles Stripe API)
│   │   └── ...
│   │
│   └── customer/         # Context: CRM
│       └── ...
```

### Why this works for your SaaS:

1.  **Decoupled Identity:** By separating `Auth` and `Users`, you can change your authentication mechanism (e.g., moving to Auth0 or Firebase) by only rewriting the `AuthModule` without touching your `Users` database entity.
2.  **Dependency Inversion:** The `AuthModule` defines what it needs (the `UserValidator` interface), and `UsersModule` provides the implementation. This ensures `Auth` does not tightly couple to `Users` implementation details.
3.  **Scalability:** If `Billing` becomes heavy (integrating with Quickbooks/Xero), you can extract that entire folder into a microservice without changing the `RentalModule` code—just swap the local Event Emitter for a message bus (Redis/RabbitMQ).
4.  **Transaction Safety:** By keeping the critical path (Booking Creation) synchronous and within the `RentalModule` transaction boundary, you guarantee data integrity as per ADR #6.
