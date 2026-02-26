# Architecture Decision Record (ADR): Rental SaaS Platform

## Application Overview

**Product:** A B2B SaaS platform designed for equipment rental businesses.
**Goal:** To provide a customizable, multi-tenant solution that enables companies to manage inventory, handle complex booking lifecycles, track maintenance, and process billing.
**Target Audience:** Rental businesses ranging from construction machinery (heavy assets) to event gear (bulk stock).
**Key Differentiator:** Specialized support for both serialized asset tracking (maintenance history, depreciation) and bulk quantity management within a unified system.

---

## 1. Repository Structure: Monorepo

**Decision:** Use a Monorepo (managed via Turborepo/pnpm) containing `apps/backend`, `apps/web`, and shared packages.
**Why:**

- **End-to-End Type Safety:** Allows sharing TypeScript interfaces (DTOs) between backend and frontend. Changes in the API contract trigger compile-time errors on the client, eliminating "drift" bugs.
- **Independent Deployment:** Decouples deployment targets; the frontend can be deployed to Vercel/Netlify while the backend goes to a container service, without splitting the codebase.
- **Code Reuse:** Centralizes business logic, UI components, and utility functions.

---

## 2. Architectural Pattern: Modular Monolith

**Decision:** Build a single deployable application organized into independent modules (NestJS Modules, Prisma, Passport JWT), rather than starting with microservices.
**Why:**

- **Speed:** Eliminates the operational complexity of distributed systems (network latency, deployment orchestration) during the early stage.
- **Boundaries:** Enforces strict separation of concerns (Rental vs. Billing vs. Inventory), making it easier to extract specific modules into microservices later if scaling demands it.
- **Transaction Management:** Allows for ACID transactions across modules within the same database, which is critical for booking integrity.

---

## 3. Multi-Tenancy Strategy: Row-Level Security (Discriminator Column)

**Decision:** Use a shared database with a `tenant_id` column on every table to isolate data.
**Why:**

- **Cost Efficiency:** Minimizes infrastructure costs (one DB instance) and simplifies backup/restore procedures.
- **Maintenance:** Eliminates the need to run migrations across hundreds of separate databases.
- **Flexibility:** The data access layer can be abstracted, allowing us to migrate high-value "enterprise" clients to isolated schemas or databases later without rewriting application logic.

---

## 4. Inventory Data Model: Hybrid (Asset & Stock)

**Decision:** Support both serialized assets (tracked by ID/Serial Number) and bulk stock (tracked by quantity) within the same structure.
**Why:**

- **Domain Reality:** Equipment rental requires tracking specific unit history (maintenance, damage) for things like excavators, while commodity rental (e.g., chairs, tents) requires simple quantity management.
- **Unified Logic:** A single `Inventory` table with a `tracking_type` flag prevents code duplication for the booking process.
- **Taxonomy:** Products support a flat, per-tenant category system (e.g., "Camera",
  "Lens", "Lighting"). Categories are optional on a product and orthogonal to
  `trackingType` — a category may contain both serialized and bulk items.

---

## 5. Data Extensibility: JSONB Attributes

**Decision:** Use PostgreSQL JSONB columns for custom equipment attributes (e.g., size, power source, weight) rather than creating separate tables per category.
**Why:**

- **SaaS Flexibility:** Allows tenants to define custom fields for their specific inventory types (Skis vs. Jackhammers) without requiring schema migrations or complex Entity-Attribute-Value (EAV) SQL joins.
- **Type Safety:** TypeScript interfaces on the frontend can validate these flexible structures while the database remains agnostic.

---

## 6. Concurrency & Critical Path: Hybrid Constraint Strategy

**Decision:** Use Database Exclusion Constraints for physical assets, and Application-Level Logic for "virtual" (over-rented) bookings.
**Why:**

- **Data Integrity:** For physical stock (`inventory_item_id` set), the database enforces hard limits to prevent double bookings via a PostgreSQL EXCLUDE constraint on the `tstzrange` rental period.
- **Business Flexibility:** For "over-rentals" (`inventory_item_id` is null, only `product_id` set), the constraint is bypassed to allow accepting orders beyond current capacity. The application enforces `max_over_rent_threshold` from `TenantPricingConfig` to prevent infinite over-renting.

---

## 7. Communication Pattern: Hybrid Event-Driven

**Decision:** Use Synchronous calls for the critical path (Booking creation) and Asynchronous Domain Events (NestJS EventEmitter) for side effects.
**Why:**

- **Decoupling:** Modules like Notifications, Analytics, and Invoicing should not block the user's "Booking Confirmed" response.
- **Responsibility Segregation:** If the email service fails, the booking remains valid. The system retries the notification later via BullMQ, preventing cascading failures.

---

## 8. Background Jobs: BullMQ with Redis

**Decision:** Offload heavy or third-party operations (Sending Emails, PDF Generation, Syncing to Accounting Software) to a job queue.
**Why:**

- **Performance:** Keeps API response times fast by moving I/O-bound tasks to the background.
- **Resilience:** Provides automatic retries for failed jobs (e.g., third-party API downtime), ensuring tasks are not lost if a service temporarily fails.

---

## 9. Pricing Strategy: Unit-Aware, Calendar-Aware Engine

**Decision:** Implement a `PricingEngine` domain service that calculates costs through a four-stage pipeline. Pricing tiers are defined per `BillingUnit` (a first-class tenant-configured concept), not per calendar day.

### Pipeline Stages

```
Calendar Rules → Unit Decomposition → Tier Resolution → Amount Calculation
```

**Stage 1 — Calendar Rules:** Computes raw duration in hours from `startDate`/`endDate`. Applies tenant config rules (e.g., `weekendCountsAsOne`: Saturday + Sunday together = 1 billable day). Produces `billableHours` and a `calendarAdjustments[]` log.

**Stage 2 — Unit Decomposition:** Decomposes `billableHours` into tenant-defined `BillingUnit`s (e.g., `half_day = 12h`, `full_day = 24h`, `week = 168h`) using a greedy largest-first algorithm. Applies the tenant's `RoundingRule` (`SPLIT` or `ROUND_UP`) for remainders.

**Stage 3 — Tier Resolution:** Normalizes all unit thresholds to hours for comparison. Applies flat tier logic: the highest `fromUnit` threshold the booking satisfies wins, and that rate applies to the entire booking. Item-level tiers take precedence over product-level tiers.

**Stage 4 — Amount Calculation:** Builds one `PriceBreakdownEntry` per billing unit type. Uses `decimal.js` via the `Money` value object for all arithmetic — no floating-point drift on financial calculations.

### Key Design Decisions

- **`BillingUnit` is a first-class tenant concept**, not an implicit "day." A week-rate is a genuine week unit — not 7 days pretending to be one.
- **`basePrice` does not exist on `Product`.** Instead, every product must have at least one `PricingTier` with `fromUnit: 1` (the base tier). This invariant is enforced by the `Product` aggregate on creation and prevents a product from existing without any pricing.
- **Flat tier model:** the whole booking is priced at the matched tier's rate. Progressive (tax-bracket) pricing is not implemented in v1.
- **The `PricingEngine` is a pure domain service:** no I/O, no side effects, deterministic. The application layer fetches all inputs (tiers, billing units, config) before calling the engine.

### Output: `PriceBreakdown` Value Object

The engine returns an immutable `PriceBreakdown` VO that is persisted as JSONB on `BookingLineItem.priceBreakdown`. It contains the full audit trail: `entries[]`, `tierApplied`, `calendarAdjustments[]`, `rawDurationHours`, and `totalBillableHours`. Disputes are resolved from the snapshot — historic pricing logic is never re-run.

### Future: PromotionEngine (Not in v1)

A `PromotionEngine` will sit downstream of `PricingEngine` as a separate pipeline stage, receiving the `PriceBreakdown` as input and producing a `DiscountBreakdown`. Promotions are a distinct domain concern from pricing — different lifecycle, different actors, different stacking rules. They are explicitly out of scope for v1.

---

## 10. Cross-Module Port Pattern

**Decision:** When one module needs read access to an aggregate owned by another module, it defines its own focused port (abstract class) and the owning module's repository implements it.

**Why:**

- **Interface Segregation:** Each consuming module only sees the methods it needs. `RentalModule` importing `RentalProductQueryPort` does not get access to `InventoryModule`'s full `ProductRepositoryPort`.
- **Abstract classes over interfaces:** NestJS's DI container requires runtime tokens. TypeScript interfaces are erased at compile time and cannot serve as injection tokens. Abstract classes survive compilation and serve as both the type contract and the DI token.
- **Single implementation:** The concrete repository (e.g., `PrismaProductRepository`) lives in the owning module's infrastructure layer and implements multiple ports. No duplication of queries.

**Example:**
`RentalModule` defines `RentalProductQueryPort` with `findById` and `findAvailableItemId`. `PrismaProductRepository` in `InventoryModule` implements both `ProductRepositoryPort` and `RentalProductQueryPort`. `RentalModule` binds `RentalProductQueryPort` to `PrismaProductRepository` in its NestJS module wiring — never importing the concrete class directly.

---

## 11. Tech Stack

- **Backend:** NestJS (Enforces modular architecture).
- **Database:** PostgreSQL (Relational integrity + JSONB flexibility + native `tstzrange` for temporal queries).
- **ORM:** Prisma (with raw SQL via `$queryRaw` for `tstzrange` operations not supported by Prisma's query builder).
- **Frontend:** TanStack Start (Type-safe full-stack framework).
- **Queue:** Redis + BullMQ.
- **Validation:** `nestjs-zod` for DTO schemas (Zod schema first, class generated via `createZodDto`).
- **Financial Arithmetic:** `decimal.js` via a `Money` value object — no native `number` for monetary calculations.
