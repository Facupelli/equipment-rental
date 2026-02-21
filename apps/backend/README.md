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

## 2. Architectural Pattern: Modular Monolith

**Decision:** Build a single deployable application organized into independent modules (NestJS Modules, Prisma, Passport JWT), rather than starting with microservices.
**Why:**

- **Speed:** Eliminates the operational complexity of distributed systems (network latency, deployment orchestration) during the early stage.
- **Boundaries:** Enforces strict separation of concerns (Rental vs. Billing vs. Inventory), making it easier to extract specific modules into microservices later if scaling demands it.
- **Transaction Management:** Allows for ACID transactions across modules within the same database, which is critical for booking integrity.

## 3. Multi-Tenancy Strategy: Row-Level Security (Discriminator Column)

**Decision:** Use a shared database with a `tenant_id` column on every table to isolate data.
**Why:**

- **Cost Efficiency:** Minimizes infrastructure costs (one DB instance) and simplifies backup/restore procedures.
- **Maintenance:** Eliminates the need to run migrations across hundreds of separate databases.
- **Flexibility:** The data access layer can be abstracted, allowing us to migrate high-value "enterprise" clients to isolated schemas or databases later without rewriting application logic.

## 4. Inventory Data Model: Hybrid (Asset & Stock)

**Decision:** Support both serialized assets (tracked by ID/Serial Number) and bulk stock (tracked by quantity) within the same structure.
**Why:**

- **Domain Reality:** Equipment rental requires tracking specific unit history (maintenance, damage) for things like excavators, while commodity rental (e.g., chairs, tents) requires simple quantity management.
- **Unified Logic:** A single `Inventory` table with a `tracking_type` flag prevents code duplication for the booking process.

## 5. Data Extensibility: JSONB Attributes

**Decision:** Use PostgreSQL JSONB columns for custom equipment attributes (e.g., size, power source, weight) rather than creating separate tables per category.
**Why:**

- **SaaS Flexibility:** Allows tenants to define custom fields for their specific inventory types (Skis vs. Jackhammers) without requiring schema migrations or complex Entity-Attribute-Value (EAV) SQL joins.
- **Type Safety:** TypeScript interfaces on the frontend can validate these flexible structures while the database remains agnostic.

## 6. Concurrency & Critical Path: Database Transactions

**Decision:** Handle availability checks and reservation logic synchronously within a database transaction.
**Why:**

- **Data Integrity:** Prevents double-bookings (race conditions) where two users book the last item simultaneously. This requires immediate consistency, which eventual consistency (async events) cannot guarantee.

## 7. Communication Pattern: Hybrid Event-Driven

**Decision:** Use Synchronous calls for the critical path (Booking creation) and Asynchronous Domain Events (NestJS EventEmitter) for side effects.
**Why:**

- **Decoupling:** Modules like Notifications, Analytics, and Invoicing should not block the user's "Booking Confirmed" response.
- **Responsibility Segregation:** If the email service fails, the booking remains valid. The system retries the notification later via BullMQ, preventing cascading failures.

## 8. Background Jobs: BullMQ with Redis

**Decision:** Offload heavy or third-party operations (Sending Emails, PDF Generation, Syncing to Accounting Software) to a job queue.
**Why:**

- **Performance:** Keeps API response times fast by moving I/O bound tasks to the background.
- **Resilience:** Provides automatic retries for failed jobs (e.g., third-party API downtime), ensuring tasks are not lost if a service temporarily fails.

## 9. Tech Stack

- **Backend:** NestJS (Enforces modular architecture).
- **Database:** PostgreSQL (Relational integrity + JSONB flexibility).
- **Frontend:** TanStack Start (Type-safe full-stack framework).
- **Queue:** Redis + BullMQ.
