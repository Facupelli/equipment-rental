Pragmatic Domain-Driven Design (DDD).

In this approach, we prioritize **Logical Boundaries** (business capabilities) over technical ones. We treat the database as the integration point for data but enforce strict separation in code logic.

---

## 1. Module Map (Bounded Contexts)

We will organize the code into five primary modules. The dependencies flow strictly **inward or downward** (from business logic to infrastructure/persistence), never sideways between business modules.

### 1.1. `TenancyModule` (Foundation Context)

**Responsibility:** Handles the SaaS platform itself, authentication, and user management.

- **Domain Concepts:** `Tenant`, `User`, `Role`, `Subscription`.
- **Why:** This is the "Kernel" layer. Every request entering the system passes here to resolve the `tenant_id` context.
- **Key Logic:** Row-Level Security (RLS) context setting, JWT validation, Plan limits enforcement.

### 1.2. `InventoryModule` (Asset & Catalog Context)

**Responsibility:** Managing the "Supply Side" of the business. It knows _what_ items exist, _where_ they are, and _who_ owns them.

- **Aggregates:** `Product` (The Definition), `InventoryItem` (The Physical Batch/Asset).
- **Entities:** `Location`, `Owner`, `MaintenanceRecord`.
- **Domain Logic:**
  - **Hybrid Tracking:** Logic to enforce rules based on `tracking_type` (e.g., ensuring `serial_number` is unique for SERIALIZED items, or managing `total_quantity` for BULK items).
  - **Maintenance:** Status transitions (`OPERATIONAL` <-> `MAINTENANCE`).
  - **Depreciation:** Calculations based on `purchase_cost` and `purchase_date`.
- **Dependencies:** None (Stand-alone domain).

### 1.3. `RentalModule` (Core Transaction Context)

**Responsibility:** Managing the "Demand Side" and the critical path of the business—Booking lifecycle and Availability.

- **Aggregates:** `Booking` (Root).
- **Entities:** `BookingLineItem`.
- **Domain Services:** `AvailabilityService`.
- **Domain Logic:**
  - **Availability Calculation:** Intersects requested dates with existing bookings.
  - **Reservation Logic:** Handles the state machine (`RESERVED` -> `ACTIVE` -> `COMPLETED`).
  - **Snapshotting:** Captures financial state (`owner_id`, `unit_price`) at the moment of booking.
- **Dependencies:** `InventoryModule` (Read-only access to check product details/ownership), `CustomerModule`.

### 1.4. `BillingModule` (Financial Settlement Context)

**Responsibility:** The financial aftermath of a rental. Invoicing, payments, and complex owner payouts.

- **Aggregates:** `Invoice`, `Payout`.
- **Domain Logic:**
  - **Invoice Generation:** Triggered by events (`BookingCompleted`).
  - **Revenue Splitting:** Uses the "Snapshot" data from `BookingLineItems` to calculate exactly how much `Owner A` vs `Owner B` is owed for a specific rental.
  - **Tax Calculation:** Applying local taxes to the invoice.
- **Dependencies:** `RentalModule` (Reads snapshots, listens to events).

### 1.5. `CustomerModule` (CRM Context)

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
├── core/                 # Shared Kernel (DB connection, Logger, Guards)
│
├── modules/
│   ├── tenancy/          # Context: Platform Foundation
│   │   ├── domain/
│   │   ├── infrastructure/ (RLS Middleware)
│   │   └── ...
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

1.  **Scalability:** If `Billing` becomes heavy (integrating with Quickbooks/Xero), you can extract that entire folder into a microservice without changing the `RentalModule` code—just swap the local Event Emitter for a message bus (Redis/RabbitMQ).
2.  **Team Autonomy:** One team can work on the "Maintenance Logic" (`InventoryModule`) without stepping on the toes of the team working on "Pricing Logic" (`RentalModule`).
3.  **Transaction Safety:** By keeping the critical path (Booking Creation) synchronous and within the `RentalModule` transaction boundary, you guarantee data integrity as per ADR #6.
