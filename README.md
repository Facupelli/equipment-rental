# Equipment Rental System

## Introduction

The Equipment Rental Service is a modular monolith application designed to facilitate the hourly or daily booking of diverse equipment types. The architectural approach is governed by the principle of **optionality**, prioritizing solutions that match current needs while providing a low-cost path for future architectural evolution.

The primary goal of this design is to create a maintainable, high-quality system where the **specification is the living, executable source of truth**.

## 1. Architectural Philosophy: Optionality and Evolution

Our guiding principle is **Optionality Over Upfront Overengineering**. We aim to avoid applying complex patterns or architectural styles intended to solve problems we do not currently face.

### A. Architectural Drivers

- **Avoid Early Complexity:** We will not immediately adopt complex infrastructure (like full event sourcing or external message queues). The best architecture is the one that matches our current needs.
- **Low-Cost Asynchronicity:** We will structure the code to allow for asynchronous work but will use the existing database as a queue to achieve this low-cost asynchronous movement initially.
- **Explicitness:** We will be explicit about the actions being taken, which is an enabler for future evolution.

---

## 1.B. Architectural Clarifications: What We Are NOT Doing

To prevent confusion with similar-sounding patterns, we explicitly clarify our architectural choices:

### A. CQS vs. CQRS vs. Event Sourcing

We implement **Command-Query Separation (CQS)**, NOT **Command Query Responsibility Segregation (CQRS)** or **Event Sourcing**.

| Pattern                                             | What It Means                                                                                                                                                             | Are We Using It? | Why/Why Not                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CQS (Command-Query Separation)**                  | Separating methods that change state (Commands) from methods that return data (Queries) at the **code level**. Commands return void (or just an ID), queries return data. | ✅ **YES**       | This separation makes intent explicit, simplifies testing, and plants seeds for future architectural evolution without adding complexity.                                        |
| **CQRS (Command Query Responsibility Segregation)** | Separating the **write model** from the **read model** at the **data structure level**, often with different databases or schemas for reads vs. writes.                   | ❌ **NO**        | We use a single database with a single schema. Our "read models" and "write models" are the same domain models. We may evolve to CQRS if read/write traffic patterns justify it. |
| **Event Sourcing**                                  | Storing state changes as a sequence of immutable events rather than storing current state. Aggregates are rebuilt by replaying events.                                    | ❌ **NO**        | We store current state in traditional tables. Events (via Outbox) are used for _integration_ between modules, not as the source of truth for entity state.                       |

---

### B. Terminology: Entity vs. Model vs. Schema

We use precise terminology to distinguish between persistence concerns and domain logic:

| Term                          | Definition                                                                                                                                     | Where It Lives                         | Example                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| **Entity** (TypeORM)          | The database table definition, decorated with TypeORM's `@Entity` decorator. This is purely a persistence concern.                             | `infrastructure/persistence/entities/` | `CustomerEntity` with `@Entity`, `@Column`, etc.                      |
| **Model** (Domain)            | The business logic representation with behavior, validation, and invariants. This is the domain object.                                        | `domain/models/`                       | `Customer` class with business methods like `suspend()`, `activate()` |
| **Schema** (Alternative term) | Some teams use "Schema" instead of "Entity" for the TypeORM classes to avoid confusion. We use **Entity** because that's TypeORM's convention. | N/A                                    | We say `CustomerEntity`, not `CustomerSchema`                         |

**Why this matters:**

- The **Domain Model** (`Customer`) must never import TypeORM decorators or know about persistence
- The **TypeORM Entity** (`CustomerEntity`) is a dumb data structure (anemic) with no business logic
- A **Mapper** translates between them, maintaining the separation of concerns

---

### C. Command Return Values: The Weak Violation

Following strict CQS, **Commands should return `void`** because they change state and should not return data. However, we allow a **pragmatic weak violation**: Commands may return **only the ID** of the created resource.

| Approach                       | Return Type                 | Why                                                                                                                                                  |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strict CQS**                 | `Promise<void>`             | Pure separation: commands change state, queries return data. Clients must issue a follow-up query to get the ID.                                     |
| **Pragmatic CQS (Our Choice)** | `Promise<string>` (ID only) | Avoids an unnecessary round-trip query just to get the ID. The ID is generated during the command, so returning it is low-cost and high-convenience. |
| **Violation (Avoid)**          | `Promise<Customer>`         | Returning the full entity blurs the line between commands and queries. Clients should explicitly query if they need the full entity.                 |

**Key Principle**: The application layer (handlers, services) never sees `CustomerEntity`. It only works with the `Customer` domain model. This maintains the Clean Architecture dependency rule: domain has no dependencies on infrastructure.

---

## 2. System Structure: The Modular Monolith

The system is built as a **Modular Monolith**, where the core challenge is managing coupling between different parts of the system.

### A. Defining Module Boundaries

Module boundaries are defined strictly by **capabilities**, not purely by data. This prevents high coupling that results from a single massive data model (a "mega-model").

| Capability Boundary (Module)  | Core Responsibility                                                                                                                        | Workflow Handoff                                                           |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **Booking**                   | Managing the creation, confirmation, and cancellation of reservations and checking availability.                                           | Hands off to Payment and Inventory after reservation is created/confirmed. |
| **Inventory**                 | Tracking physical assets (by serial number), managing their status (Available, Allocated, Maintenance), and providing total capacity data. | Reacts to events from Booking (e.g., `ReservationConfirmedEvent`).         |
| **(Future: Pricing/Quoting)** | Handling complex financial rules, daily rates, discounts, and generating final quotes.                                                     | Used synchronously by Booking to determine price before confirmation.      |

Defining boundaries this way ensures that when one workflow finishes, it hands off to another distinct boundary, preventing a massive workflow from snaking through the entire application. For instance, the **`Reservation`** entity in the Booking module is separate from the **`EquipmentItem`** entity in the Inventory module, even though they relate to the same real-world asset.

### B. Module Public Interfaces (Facades)

Each module exposes its functionality through a dedicated **Facade**. The `BookingFacade` is the only public interface that other modules (like Inventory) or the Presentation layer should use. This structure promotes loose coupling and ensures the internal implementation details (such as the specific CQS handlers) are hidden.

## 3. Data Flow: Command-Query Separation (CQS)

We implement **Command-Query Separation (CQS)** by establishing separate paths for reads (queries) and writes (commands). This separation is implemented across the Application Layer of each module (e.g., in the Booking module).

### A. Commands (Writes)

A Command is a request that explicitly invokes behavior resulting in a state change or side effect.

- **Action:** Commands change the system's state (e.g., `CreateReservationCommand`).
- **Benefit:** Being explicit about the action taken helps in understanding the code's business intent and enables future options like moving work asynchronously or publishing events.

### B. Queries (Reads)

A Query is a request to get data and must be a totally safe operation, resulting in **no side effects**.

- **Action:** Queries retrieve information (e.g., `CheckAvailabilityQuery`).
- **Benefit:** Separating reads allows us the option to optimize the read path (e.g., creating specific read models or using a separate physical database) later if read traffic becomes a bottleneck, without impacting the integrity of the write path.

### C. Enabling Asynchronous Evolution (The Outbox Pattern)

To allow the architecture to evolve towards an event-driven architecture (EDA) without immediately installing complex messaging infrastructure (like Kafka or RabbitMQ), we use the **Outbox Pattern**:

1.  **Transactional Consistency:** When a state change occurs (e.g., inside `CreateReservationHandler`), the system uses a **single database transaction** to simultaneously persist the updated entity (the `Reservation`) and create a record in the `OutboxSchema`.
2.  **Low-Cost Queue:** The database acts as the initial queue.
3.  **Event Publishing:** A separate background service, the `OutboxProcessorService`, runs periodically (e.g., every 5 seconds) to pull pending messages from the Outbox table and publish explicit domain events (`ReservationCreatedEvent`) to the internal event bus.
4.  **Decoupling:** Other modules (like Inventory) can then react to these events asynchronously, effectively handing off the workflow without tight, synchronous coupling.

## 4. Internal Module Design: Clean Architecture and Abstraction

Each module (e.g., Booking Module) follows a layered structure (Domain, Application, Infrastructure).

### A. Internal Dependencies

The design adheres to the principle that **the Domain layer must have no dependencies on outer layers**.

- **Domain:** Contains core business logic (Entities like `Reservation`, Value Objects like `TimeRange`, and Domain Services like `AvailabilityCheckerService`).
- **Application:** Contains use cases (Commands, Queries, Handlers, Event Handlers).
- **Infrastructure:** Contains technical implementations (e.g., `ReservationRepository`, TypeORM Schemas).

### B. Managing Abstractions (Justified Interfaces)

We explicitly **avoid useless abstractions**. Abstractions are complex and often add indirection without immediate value.

- **The Approach:** We **start simple** by depending directly on concrete infrastructure implementations where justified. For example, the `CreateReservationHandler` injects the concrete `ReservationRepository`, not an interface.
- **Repository Contract:** Repositories accept and return **domain models** (e.g., `Customer`), never TypeORM entities (e.g., `CustomerEntity`). The mapping between domain and persistence happens inside the repository via a `Mapper` (see Section 1.B for terminology clarification).
- **Justification:** An `ICustomerRepository` interface will only be introduced when we have multiple implementations (e.g., in-memory for testing, Redis for caching) or when many consumers would benefit from a simplified API.

```
---

### Booking Module

## 1. Specify Phase: Defining the User Journey ("What" and "Why")

The Booking Module is responsible for managing equipment rental reservations through a multi-item order system. It coordinates availability checking, order creation, and physical asset allocation.

### A. High-Level Booking Capability Specification

| Aspect | Description (User/Business Intent) | Outcomes and Success Criteria |
|:-------|:-----------------------------------|:-----------------------------|
| **Capability Goal** | To allow customers to create multi-item rental orders, verify availability for each item, calculate accurate pricing, and track physical equipment allocations. | **Success:** A confirmed order is created only if all items have sufficient inventory and valid pricing. Each item is allocated to specific physical equipment instances. **Failure:** Clear error messages detailing unavailability, invalid input, or pricing issues. |
| **User Journey: Availability Check** | A potential customer needs to know if multiple equipment types are available for their desired quantities and time ranges. | The system must return availability status for EACH requested item. This is a **safe read operation** with no side effects (a Query). |
| **User Journey: Multi-Item Order Creation** | A customer requests to create an order containing multiple equipment types, each with specified quantities and rental periods. | The system validates all items, calculates individual pricing, allocates physical equipment, and persists the complete order atomically. |
| **User Journey: Order Status Tracking** | Customers and staff need to view order status (Pending, Confirmed, Active, Completed, Cancelled) and see which physical equipment is allocated. | The system provides queries to retrieve order details including item breakdowns, allocations, and pricing snapshots. |
| **Architectural Output** | Upon successful order confirmation, explicit events (`OrderCreated`, `OrderItemConfirmed`) must be generated to notify other modules (Payment, Inventory, Notification). | Event generation is guaranteed via the Outbox Pattern, ensuring reliable cross-module communication. |

---

## 2. Plan Phase: Defining the Technical Architecture ("How")

The Booking Module manages a three-level entity hierarchy: Orders contain Items which have Allocations.

### A. Core Architectural Constraints

| Constraint | Detail based on Architecture Theory | Implementation Evidence |
|:-----------|:-----------------------------------|:------------------------|
| **Boundary/Module** | The module is defined by the **Booking Capability**: managing rental orders and equipment allocation lifecycle. | The `BookingModule` handles order creation, confirmation, and cancellation. It coordinates with Pricing (for quotes) and Inventory (for availability/allocation) but owns the order state. |
| **Internal Structure** | Uses **Clean Architecture** (Domain, Application, Infrastructure) with aggregate roots for transactional consistency. | The `ReservationOrder` is the aggregate root, containing `ReservationOrderItem` entities and `Allocation` entities. All changes happen through the aggregate root. |
| **Separation of Concerns** | Uses **Command-Query Separation (CQS)** to separate state-changing operations from data retrieval. | **Commands:** `CreateOrderCommand`, `ConfirmOrderCommand`, `CancelOrderCommand`. **Queries:** `CheckMultiItemAvailabilityQuery`, `GetOrderDetailsQuery`. |
| **Evolution/Optionality** | Architectural evolution is enabled by planting seeds for **asynchronous movement** between modules. | The system uses the **Outbox Pattern** to emit domain events after order state changes, ensuring transactional consistency and enabling eventual consistency with Inventory and Payment modules. |

---

### B. Domain Model: Three-Level Hierarchy

#### 1. ReservationOrder (Aggregate Root)

The top-level entity representing a customer's complete rental order.

| Attribute | Type | Description | Constraints |
|:----------|:-----|:------------|:------------|
| `id` | UUID | Unique identifier for the order | Primary Key, Auto-generated |
| `customerId` | UUID | Reference to customer in Customer Identity module | Required, Indexed |
| `status` | Enum | Order lifecycle state: `PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED` | Required, Indexed, Default: `PENDING` |
| `totalAmountCents` | Integer | Total cost for entire order (sum of item subtotals + order-level adjustments), stored as cents | Required, Must be non-negative |
| `currency` | String | ISO 4217 currency code | Required, Default: 'USD', Max length: 3 |
| `taxAmountCents` | Integer | Total tax applied to order, stored as cents | Required, Default: 0 |
| `discountSummary` | JSON | Order-level discounts (e.g., "spend $500, get 10% off") | Optional, JSONB column |
| `items` | Array<ReservationOrderItem> | Collection of equipment items in this order | Required, Cascade operations |
| `createdAt` | Timestamp | When the order was created | Auto-generated |
| `updatedAt` | Timestamp | Last modification timestamp | Auto-generated |

**Design Rationale:**
- **Aggregate Root:** All modifications to items and allocations must go through the order (enforces consistency)
- **Status Workflow:** `PENDING` (created, awaiting payment) → `CONFIRMED` (paid, equipment allocated) → `ACTIVE` (rental period started) → `COMPLETED` (equipment returned) or `CANCELLED`
- **Pricing Storage:** Order stores aggregate amounts only; detailed breakdowns live in items

**Business Rules Enforced by Aggregate:**
- Cannot confirm an order unless ALL items have sufficient available inventory
- Cannot cancel an order in `ACTIVE` or `COMPLETED` status
- Total amount must equal sum of item subtotals (validated on save)

---

#### 2. ReservationOrderItem (Entity within Aggregate)

A line item in an order representing a specific equipment type, quantity, and rental period.

| Attribute | Type | Description | Constraints |
|:----------|:-----|:------------|:------------|
| `id` | UUID | Unique identifier for the item | Primary Key, Auto-generated |
| `equipmentTypeId` | UUID | Reference to equipment type in Catalog module | Required, Indexed |
| `quantity` | Integer | Number of units being rented | Required, Must be > 0 |
| `unitPriceCents` | Integer | Price for ONE unit for the rental period (from Quote), stored as cents | Required, Must be non-negative |
| `subtotalCents` | Integer | Total for this line item (unitPrice × quantity), stored as cents | Required, Calculated field |
| `priceQuote` | JSON | Complete Quote object from Pricing module (immutable snapshot) | Required, JSONB column |
| `promoCodeUsed` | String | Promotional code applied (if any) | Optional, Max length: 50 |
| `allocations` | Array<Allocation> | Physical equipment assignments for this item | Required, Cascade operations |

**Design Rationale:**
- **Date Storage at Item Level:** Rental period is stored here (not just in allocations) because pricing depends on duration
- **Quantity Support:** A single item can represent multiple units of the same equipment type
- **Price Snapshot:** The `priceQuote` JSONB column preserves the exact pricing calculation from the Pricing module at order creation time
- **Allocation Constraint:** The number of allocations must equal quantity (enforced by domain logic)

**Critical Design Decision: Date Consistency**

**Rationale:**
1. **Pricing Simplicity:** The Pricing module calculates one quote per equipment type per time period. Multiple periods would require multiple quotes.
2. **Common Use Case:** Most rentals are "equipment set for duration X" (e.g., "3 forklifts from Jan 15-17").
3. **Clear Contract:** One item = one quote = one rental period.

**Enforced By:**
- Application layer validation (CreateOrderHandler checks allocation dates match item dates)
- Optional: Database CHECK constraint (see migration notes in schema artifact)

**Future Evolution:** If business needs require per-allocation pricing (e.g., rent equipment A for 2 days, equipment B for 3 days in same order), pricing logic would move to allocation level and item subtotal becomes SUM(allocation costs).

---

#### 3. Allocation (Entity within Aggregate)

Maps a specific physical equipment item to a reservation order item.

| Attribute | Type | Description | Constraints |
|:----------|:-----|:------------|:------------|
| `id` | UUID | Unique identifier for the allocation | Primary Key, Auto-generated |
| `itemId` | UUID | Reference to parent ReservationOrderItem | Required, Indexed |
| `equipmentItemId` | UUID | Reference to physical equipment in Inventory module | Required |
| `startDate` | Timestamp | Allocation start (inherited from parent item) | Required, Must equal item.rentalStartDate |
| `endDate` | Timestamp | Allocation end (inherited from parent item) | Required, Must equal item.rentalEndDate |

**Design Rationale:**
- **Physical Tracking:** Allocations answer "which specific forklift (#1234) is allocated to this order?"
- **No Pricing Here:** Pricing is a commercial concern (item level), allocations are operational tracking
- **Date Inheritance:** Dates are copied from parent item for query convenience but must remain consistent

**Business Rules:**
- Cannot allocate the same physical equipment to overlapping time periods
- Cannot allocate equipment that is in `MAINTENANCE` or `RETIRED` status (validated against Inventory module)
- Allocations are created when order is confirmed (not at order creation time)

---

**Key Architectural Points:**

1. **Quote is for 1 Unit:** `PricingFacade.calculateQuote()` always prices a single unit. Item subtotal = `unitPrice × quantity`.

2. **Immutable Price Snapshot:** The `priceQuote` JSON preserves exact calculation. If rates change tomorrow, existing orders retain original pricing.

3. **Transaction Boundary:** Order creation and event emission happen atomically (single DB transaction).

4. **Error Translation:** Pricing module's `NotFoundException` becomes Booking's `BadRequestException` with domain-appropriate message.

---

### Catalog Module

# Catalog Capability Specification

The Catalog Module is responsible for maintaining the taxonomy and descriptive details of rentable equipment (equipment types, categories, and technical specifications). It acts as the system's authoritative source for _what_ can be rented.

### 1. Specify Phase: User Journeys and Outcomes (The "What" and "Why")

| User Journey                | Intent & Description                                                                                                                             | Outcomes & Success Criteria                                                                                                                      |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Browsing/Search**         | A potential customer needs to navigate equipment via categories and search for specific item descriptions or specs.                              | **Success:** System returns clean, paginated lists of `EquipmentType` data, filterable by descriptive attributes (e.g., power rating, category). |
| **Display Details**         | The system needs the full descriptive content (marketing text, technical specifications) for a given equipment type ID to render a product page. | **Success:** A fast, safe Query returns all necessary descriptive attributes for the display layer.                                              |
| **Type Definition (Admin)** | An administrator needs to define a new equipment type (e.g., "Heavy Duty Forklift") and assign its technical specifications and category.        | **Success:** A new `EquipmentType` entity is persisted with all required metadata. This is a state-changing operation (Command).                 |
| **Category Management**     | An administrator needs to create, rename, and manage the hierarchy of categories (e.g., "Construction Tools" > "Excavators").                    | **Success:** Category entities and relationships are correctly persisted, ensuring searchable hierarchy.                                         |

### 2. Plan Phase: Technical Architecture and Constraints (The "How")

The Catalog module's design will prioritize **read performance** and maintain its isolation from volatile inventory/booking data by adhering to the principles of CQS and modularity.

| Component            | Technical Implementation Detail                                                                                                                                                                                                                                                                                        | Architectural Principle                    |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **Model Separation** | The core entity is **`EquipmentType`** (Name, Description, Category, Specs). This is split from the Booking module's **`Reservation`** and the Inventory module's **`EquipmentItem`** (which tracks serial numbers).                                                                                                   | Model by Capabilities / Split Mega-Models. |
| **CQS Emphasis**     | This module will contain far more **Queries** than Commands, leveraging the **Benefit of Explicitness**. Read models may be intentionally simpler or even directly optimized (e.g., using specific ORM views) to support fast searching, leveraging the option CQS provides to optimize reads independently of writes. | Command-Query Separation (CQS).            |
| **Public Interface** | The **`CatalogFacade`** will be the public interface, exposing read methods like `searchEquipmentTypes` and `getEquipmentTypeDetails`.                                                                                                                                                                                 | Loose Coupling / Facade Pattern.           |
| **Integration**      | Communication with the Catalog module will typically be **synchronous request-response**. The Booking Module and Inventory Module will use the Catalog module's IDs (the `equipmentTypeId`) but will rely on the `CatalogFacade` to retrieve human-readable names or descriptions as needed.                           | Start Synchronous / Match Current Needs.   |
| **Abstractions**     | The repository implementation (e.g., `EquipmentTypeRepository`) will likely be injected directly into its handlers. Repository interfaces will only be introduced if the complexity or number of consumers justifies the abstraction.                                                                                  | Avoid Useless Abstractions.                |
| **Data Structure**   | `EquipmentType` will likely contain embedded technical specifications (e.g., as JSON/JSONB data) since this data is descriptive and should be retrieved quickly with the type definition.                                                                                                                              | Optimizing Read Path.                      |

---

### Inventory Module

## I. Inventory Module: Specify Phase (What and Why)

The sources emphasize that modules must be defined by capabilities, not solely by data. Since "Equipment" means different things to different parts of the system (e.g., a Booking needs to know capacity, Logistics needs to know location, and Inventory needs to track asset lifecycle), the **Inventory Management** capability focuses purely on asset tracking and availability statistics.

| Aspect                                            | Description (User/Business Intent)                                                                                                                                  | Outcomes and Success Criteria                                                                                                                                                                                                                             |
| :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Capability Goal**                               | To accurately track and manage the physical assets (individual equipment items) and expose the total rentable capacity to the Booking module.                       | **Success:** Real-time, accurate capacity data is available for booking queries, and equipment items have a traceable history of status changes (e.g., Available, Allocated, Under Maintenance).                                                          |
| **User Journey: Asset Lifecycle**                 | An administrator needs to register new, unique equipment items (by Serial ID), update their status (e.g., mark as damaged), and retire them.                        | The system provides clear commands to modify the status and details of physical assets.                                                                                                                                                                   |
| **System Integration: Capacity Provider (Sync)**  | The Booking module must be able to synchronously request the total count of rentable equipment for a given type.                                                    | The Inventory Module must expose a Query (read path) to satisfy the `TODO: Get totalInventory from Inventory module` identified in the `CreateReservationHandler` and `CheckAvailabilityHandler`.                                                         |
| **System Integration: Asset Reservation (Async)** | The Inventory module must react to a successful reservation created in the Booking module by logically allocating specific equipment items for the reserved period. | The Inventory module must consume the **`ReservationCreated`** event or ideally the **`ReservationConfirmed`** event to manage asset status changes asynchronously, adhering to the principle of low-cost asynchronous movement using the Outbox pattern. |

## II. Inventory Module: Plan Phase (How)

We will adhere to the established architectural constraints: modular monolith structure, CQS, Clean Architecture, and planted seeds for evolution.

### A. Architectural Decisions and Constraints

| Constraint            | Application to Inventory Module                                                                                                                                                                                                                                                                             | Principle/Source                                |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **CQS/Modularity**    | Separate path for state change (Commands) like `RegisterEquipment` or `MarkEquipmentAsDamaged` from safe data retrieval (Queries) like `GetTotalCapacity`.                                                                                                                                                  | Command-Query Separation.                       |
| **Event Consumption** | The Inventory module must contain **Event Handlers** that react to events published by the Booking module (via the Outbox processor). This is how the workflow is handed off between capabilities without tight coupling.                                                                                   | Planting the Seeds for Architectural Evolution. |
| **Public Interface**  | The module will expose an `InventoryFacade` as the single public interface, hiding the internal CQS handlers and domain structure from external consumers (like the Booking Module).                                                                                                                        | Defining Module Boundaries.                     |
| **Abstraction**       | We will inject the concrete TypeORM Repository directly into the handlers/services initially, only creating repository interfaces if complexity demands it, thereby avoiding useless abstractions. (This mirrors the approach taken in the Booking module, which injects `ReservationRepository` directly). | Avoid Useless Abstractions.                     |

### B. Module Structure and Key Components

| Component Type    | Example                                     | Purpose in Inventory Management                                                                                                               |
| :---------------- | :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain Entity** | `EquipmentItem` (Serial #, Status, Type ID) | Defines the core business rules for a single physical asset.                                                                                  |
| **Facade**        | `InventoryFacade`                           | Exposes `getTotalCapacity` (Query) and `registerNewEquipment` (Command).                                                                      |
| **Query**         | `GetTotalCapacityQuery`                     | Used by the Booking Module to check constraints.                                                                                              |
| **Command**       | `RegisterEquipmentCommand`                  | Used by admins to add new assets.                                                                                                             |
| **Event Handler** | `ReservationConfirmedHandler`               | Consumes `ReservationConfirmedEvent` to change the status of specific `EquipmentItem`s from `Available` to `Allocated` for the rental period. |

---

## Customer Identity Module

### 1. Specify Phase: Defining the User Journey ("What" and "Why")

The Customer Identity Module is responsible for managing the authoritative source of customer profile data. It answers the fundamental question: "Who is this person and how do we reach them?"

#### A. High-Level Customer Identity Capability Specification

| Aspect                                  | Description (User/Business Intent)                                                                                                                                               | Outcomes and Success Criteria                                                                                                                                                       |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Capability Goal**                     | To maintain accurate, up-to-date customer profile information (identity, contact details) and serve as the authoritative source for customer data across the system.             | **Success:** Customer profiles are created, retrieved, and updated with validated data. Other modules can reliably reference customers by ID. **Failure:** Clear validation errors. |
| **User Journey: Customer Registration** | A new customer provides their basic information (name, email, phone, address) during their first interaction with the system (e.g., creating their first reservation).           | The system validates the input (e.g., email format, uniqueness), creates a unique customer record, and returns a `customerId` that other modules can reference.                     |
| **User Journey: Profile Retrieval**     | The system needs to retrieve customer contact information to display in booking confirmations, send notifications, or validate customer existence before creating a reservation. | The system provides fast, safe Query operations (by ID or email) with no side effects. This is a **read-heavy** operation.                                                          |
| **User Journey: Profile Update**        | An existing customer needs to update their contact information (e.g., new phone number, updated address, email change).                                                          | The system validates the new data, ensures email uniqueness if changed, and persists the updates. This is a state-changing Command operation.                                       |
| **Data Privacy Consideration**          | Customer data must be managed in compliance with privacy regulations (e.g., GDPR), including the ability to retrieve all data for a customer or remove their information.        | The system supports queries to export all customer data and commands to anonymize or delete customer records when legally required.                                                 |

---

### 2. Plan Phase: Defining the Technical Architecture ("How")

The Customer Identity module is intentionally designed as a **simple, stable, high-read capability** with minimal domain complexity. It serves as a foundational module that other capabilities reference but do not embed.

#### A. Core Architectural Constraints

| Constraint                    | Detail based on Architecture Theory                                                                                                                                               | Implementation Approach                                                                                                                                                                                            |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boundary/Module**           | The module is defined by the **Customer Identity Capability**: managing the "who" of customers, not the "what" of their relationship with the business (rental history, loyalty). | The `CustomerIdentityModule` is standalone and has no dependencies on Booking, Inventory, or future CRM modules. Other modules reference customers via `customerId` only.                                          |
| **Internal Structure**        | Uses **Clean Architecture** (Domain, Application, Infrastructure) but with minimal domain complexity since customer profiles have straightforward validation rules.               | Domain layer contains the `Customer` entity with basic validation (email format, required fields). Application layer contains simple CQRS handlers. Infrastructure layer uses TypeORM for persistence.             |
| **Separation of Concerns**    | Uses **Command-Query Separation (CQS)** with emphasis on optimizing the read path, as this module will be **read-heavy**.                                                         | **Commands:** `RegisterCustomerCommand`, `UpdateCustomerProfileCommand`. **Queries:** `GetCustomerByIdQuery`, `FindCustomerByEmailQuery`, `SearchCustomersQuery`.                                                  |
| **Integration Pattern**       | Other modules interact with Customer Identity **synchronously** via the `CustomerFacade`. This module does **not** consume events from other modules.                             | The Booking module, for example, calls `customerFacade.getCustomerById()` to validate customer existence before creating a reservation. This is a simple request-response pattern matching current needs.          |
| **Data Stability**            | Customer profile data is **stable** (changes infrequently compared to transactional data like reservations or payments).                                                          | This stability justifies keeping the module simple and focusing on data integrity rather than complex business logic. Future optimizations (like caching customer lookups) can be added without changing the core. |
| **No Authentication Concern** | Customer Identity does **not** handle authentication (passwords, OAuth tokens, sessions). If authentication is needed, it will be a separate capability/module.                   | The `Customer` entity contains only profile data. Authentication tokens, password hashes, or session management are out of scope.                                                                                  |

#### B. Technical Implementation Details (Customer Identity Module)

| Component                           | Responsibility                                            | Technical Details                                                                                                                                                                                                                          |
| :---------------------------------- | :-------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Read Path (Queries)**             | `GetCustomerByIdQuery`, `FindCustomerByEmailQuery`        | Pure read operations with no side effects. These queries may be optimized with database indexes on `id` (primary key) and `email` (unique index) for fast lookups. Future: read model optimization or caching layer if traffic demands it. |
| **Write Path (Commands)**           | `RegisterCustomerCommand`, `UpdateCustomerProfileCommand` | Commands validate input (email format, required fields, uniqueness constraints) before persisting. Email uniqueness is enforced at the database level with a unique constraint.                                                            |
| **Data Integrity**                  | Email uniqueness, required field validation.              | The `Customer` entity enforces business rules (e.g., email must be valid format). The database schema enforces uniqueness constraints. Failures result in clear exceptions (e.g., `ConflictException` for duplicate email).                |
| **Interface for Consumers**         | Hiding internal structure from other modules.             | The **`CustomerFacade`** acts as the only public interface, exposing methods like `getCustomerById`, `findCustomerByEmail`, `registerCustomer`, and `updateCustomerProfile`.                                                               |
| **Future Evolution: Anonymization** | Supporting GDPR "right to be forgotten" requirements.     | A future `AnonymizeCustomerCommand` can be added to replace personal data with anonymized placeholders while preserving referential integrity (keeping the `customerId` but removing PII).                                                 |

#### C. Customer Entity (Domain Model)

The `Customer` entity is intentionally minimal, focusing on identity and contact information:

| Attribute      | Type                           | Description                                                                                           | Constraints                          |
| :------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------- | :----------------------------------- |
| `id`           | UUID (string)                  | Unique identifier for the customer, used as a foreign key reference in other modules (e.g., Booking). | Primary Key, Auto-generated          |
| `name`         | String                         | Full name of the customer.                                                                            | Required, Max length 255             |
| `email`        | String                         | Email address, used for communication and as a natural unique identifier for customer lookup.         | Required, Unique, Valid email format |
| `phone`        | String                         | Contact phone number.                                                                                 | Required, Max length 20              |
| `address`      | Embedded Object (Value Object) | Structured address containing: `street`, `city`, `state`, `postalCode`, `country`.                    | All fields required                  |
| `registeredAt` | Timestamp                      | The date and time when the customer record was created.                                               | Auto-generated on creation           |
| `status`       | Enum (Active, Suspended)       | Indicates whether the customer can currently interact with the system (e.g., create reservations).    | Default: Active                      |

**Design Rationale:**

- **Embedded Address:** The address is stored as a structured object (not a separate table) to optimize read performance and avoid over-normalization. If address history or multiple addresses per customer are needed in the future, this can be refactored without impacting other modules.
- **Email as Natural Key:** While `id` is the primary key for referential integrity, `email` serves as a natural unique identifier for human-facing lookups (e.g., "find or create customer by email" flow in the presentation layer).
- **Status Field:** Plants the seed for future business rules (e.g., suspended customers cannot create new reservations). The Booking module can query customer status via the `CustomerFacade` before accepting a reservation.

**Key Integration Principle:** The Booking module **never embeds customer data** (name, email, phone). It only stores and references the `customerId`. If customer details are needed (e.g., for display or notification), the Booking module queries the `CustomerFacade` at read time. This prevents data duplication and ensures the Customer Identity module remains the single source of truth.

---

## Customer Relationship Management (CRM) Module

### 1. Specify Phase: Defining the User Journey ("What" and "Why")

The Customer Relationship Management (CRM) Module is responsible for understanding and managing the ongoing relationship between the business and its customers. It answers the question: "What is our history and relationship with this customer?"

This module is **not yet implemented** but is architected for future evolution. The following specification defines the "what" and "why" to guide future development.

#### A. High-Level CRM Capability Specification

| Aspect                                      | Description (User/Business Intent)                                                                                                                                                                      | Outcomes and Success Criteria                                                                                                                                                                              |
| :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Capability Goal**                         | To build a comprehensive view of each customer's interaction history, loyalty status, and value to the business, enabling personalized service, targeted marketing, and data-driven business decisions. | **Success:** The system can answer questions like "What is this customer's rental history?", "What loyalty tier are they in?", and "What is their lifetime value?". **Failure:** Missing or stale data.    |
| **User Journey: Rental History View**       | A customer service representative or the customer themselves needs to view a complete history of past and current reservations, including equipment rented, dates, and total spend.                     | The system provides a **read-optimized query** that aggregates reservation data. This is a denormalized view built from events, not real-time queries to the Booking module.                               |
| **User Journey: Loyalty Program**           | The business wants to reward frequent renters with loyalty points, tier-based discounts, or priority booking access.                                                                                    | The system calculates loyalty points based on completed reservations, assigns customers to tiers (e.g., Bronze, Silver, Gold), and exposes this data to the Pricing or Booking modules for discount logic. |
| **User Journey: Customer Lifetime Value**   | The business needs to understand which customers are the most valuable (by total revenue) to prioritize retention efforts or tailor marketing campaigns.                                                | The system aggregates payment data (consumed from Payment module events) to calculate and expose Customer Lifetime Value (CLV) metrics.                                                                    |
| **User Journey: Communication Preferences** | Customers want to opt-in or opt-out of marketing emails, SMS notifications, or newsletters.                                                                                                             | The system stores communication preferences and exposes them to the Notification module to respect customer choices.                                                                                       |
| **Architectural Output**                    | This module is **event-driven** and **read-optimized**. It consumes events from Booking, Payment, and potentially other modules to build denormalized, analytical views.                                | The module's internal data models are optimized for complex queries and aggregations, potentially using separate storage (e.g., a time-series database or OLAP store) in the future.                       |

---

### 2. Plan Phase: Defining the Technical Architecture ("How")

The CRM module's design prioritizes **event-driven reactivity** and **read model optimization**. Unlike the Customer Identity module, this module is **write-heavy** (consuming many events) but serves **read-heavy analytical queries**.

#### A. Core Architectural Constraints

| Constraint                   | Detail based on Architecture Theory                                                                                                                                                                             | Implementation Approach                                                                                                                                                                                              |
| :--------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boundary/Module**          | The module is defined by the **Customer Relationship Capability**: understanding the "what" of customer interactions, not the "who" (which is owned by Customer Identity).                                      | The `CRMModule` is a separate, independent module. It references `customerId` from the Customer Identity module but builds its own denormalized projections of rental history, loyalty data, and CLV.                |
| **Internal Structure**       | Uses **Clean Architecture** but with a focus on **Event Handlers** and **Projections** (denormalized read models) rather than traditional Aggregates.                                                           | Domain layer may contain value objects like `LoyaltyTier` or `CustomerSegment`. Application layer is dominated by Event Handlers. Infrastructure layer may use a separate read-optimized database or schema.         |
| **Separation of Concerns**   | Uses **Command-Query Separation (CQS)** with heavy emphasis on **read model optimization** and **eventual consistency**.                                                                                        | **Commands (few):** `UpdateCommunicationPreferencesCommand`. **Queries (many):** `GetCustomerRentalHistoryQuery`, `GetCustomerLoyaltyStatusQuery`, `GetHighValueCustomersQuery`.                                     |
| **Integration Pattern**      | This module **consumes events asynchronously** from Booking, Payment, and potentially Inventory modules. It does not expose commands that other modules call (except for preferences).                          | Event Handlers listen to `ReservationConfirmedEvent`, `ReservationCompletedEvent`, `PaymentReceivedEvent`, etc., and update denormalized projections. Other modules query the `CRMFacade` for read-only data.        |
| **Data Volatility**          | CRM data is **highly volatile** (changes with every completed reservation or payment) but serves **eventual consistency** needs (it's acceptable for rental history to be a few seconds out of date).           | This justifies using the Outbox pattern for event consumption and building projections asynchronously. The read models are eventually consistent with the source-of-truth data in Booking and Payment modules.       |
| **Evolution/Optionality**    | The module is explicitly designed for **future extraction**. If CRM queries become a performance bottleneck, the entire module (including its data store) can be separated or migrated to a specialized system. | By keeping the module boundary clean (event-driven input, facade-based output), the internal implementation can evolve (e.g., migrate from PostgreSQL to a Redshift data warehouse) without impacting other modules. |
| **Future: Machine Learning** | The aggregated data in this module (rental patterns, loyalty behavior, CLV) is the foundation for future ML models (e.g., churn prediction, personalized recommendations).                                      | The read models are designed to be exportable for offline analysis or real-time feature serving to ML systems.                                                                                                       |

#### B. Technical Implementation Details (CRM Module)

| Component                               | Responsibility                                                         | Technical Details                                                                                                                                                                                                                                      |
| :-------------------------------------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event Consumption**                   | Reacting to domain events from other modules.                          | Event Handlers subscribe to `ReservationConfirmedEvent`, `ReservationCompletedEvent`, `ReservationCancelledEvent`, `PaymentReceivedEvent`. These handlers update denormalized projections like `CustomerRentalHistory` and `CustomerLoyaltyStatus`.    |
| **Projection: Rental History**          | Building a complete, queryable view of a customer's rental activity.   | A `CustomerRentalHistory` projection aggregates: reservation IDs, equipment types rented, rental dates, durations, and total amounts spent. This is a denormalized table optimized for fast queries by `customerId`.                                   |
| **Projection: Loyalty Status**          | Calculating and storing loyalty points and tier assignments.           | A `CustomerLoyaltyStatus` projection calculates points based on completed rentals (e.g., 1 point per $10 spent), assigns tiers (Bronze: 0-100 points, Silver: 101-500, Gold: 501+), and tracks tier expiration dates.                                  |
| **Projection: Customer Lifetime Value** | Aggregating total revenue per customer for business analytics.         | A `CustomerCLV` projection sums all payments attributed to a customer. This can be exposed to analytics dashboards or used for segmentation (e.g., "high-value customers").                                                                            |
| **Read Path (Queries)**                 | Fast, complex queries for analytical or operational needs.             | Queries like `GetCustomerRentalHistoryQuery` read from the denormalized projections, not from the Booking or Payment modules directly. This avoids expensive joins and cross-module queries. Queries may be paginated for large result sets.           |
| **Write Path (Commands)**               | Handling customer-initiated changes to CRM-specific data.              | Example: `UpdateCommunicationPreferencesCommand` allows customers to opt-in/out of marketing. This is one of the few commands in this module since most writes are event-driven.                                                                       |
| **Interface for Consumers**             | Exposing CRM data to other modules or the presentation layer.          | The **`CRMFacade`** exposes read-only methods like `getCustomerRentalHistory`, `getCustomerLoyaltyStatus`, and `getHighValueCustomers`. Other modules (e.g., Pricing) might call `crmFacade.getCustomerLoyaltyStatus()` to apply tier-based discounts. |
| **Future: Separate Data Store**         | Evolving to use a specialized analytical database for complex queries. | If query performance becomes an issue, the projections can be migrated to a separate PostgreSQL schema, a time-series database (e.g., TimescaleDB), or an OLAP store (e.g., ClickHouse) without changing the event handlers or facade interface.       |

## Module Interaction Summary

```

┌──────────────────────┐
│ Customer Identity │ ← Authoritative source of "who is this person?"
│ (Standalone) │ ← Synchronous queries from other modules
└──────────┬───────────┘
│ customerId reference
│
↓
┌──────────────────────┐
│ Booking Module │ → Emits ReservationConfirmedEvent,
│ │ ReservationCompletedEvent, etc.
└──────────┬───────────┘
│
│ (via Outbox)
│
↓
┌──────────────────────┐
│ CRM Module │ ← Event-driven, builds projections
│ (Future) │ ← Exposes analytical read models
└──────────────────────┘

```

**Separation Rationale:**

- **Customer Identity** changes when a customer updates their profile (rare).
- **CRM** changes with every business transaction (frequent).
- Separating these concerns allows independent optimization, scaling, and evolution.
```

---

# Pricing Module Documentation

## 1. Specify Phase: Defining the User Journey ("What" and "Why")

The Pricing Module is responsible for calculating rental costs and managing the rate structures that govern how equipment rentals are priced. It answers the fundamental question: "How much will this rental cost?"

### A. High-Level Pricing Capability Specification

| Aspect                                           | Description (User/Business Intent)                                                                                                                           | Outcomes and Success Criteria                                                                                                                                                                                                                                       |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Capability Goal**                              | To provide accurate, consistent pricing calculations for equipment rentals based on equipment type, rental duration, and customer eligibility for discounts. | **Success:** A quote is generated with clear breakdown (subtotal, discounts, tax, total) that reflects current rate structures and applicable discounts. **Failure:** Clear validation errors for invalid inputs (e.g., negative duration, unknown equipment type). |
| **User Journey: Quote Generation (Pre-Booking)** | A customer (or sales representative) needs to know the cost of renting specific equipment for a given time period before committing to a reservation.        | The system provides a fast, deterministic quote calculation with no side effects. This is a **pure read operation** (Query). The quote shows: base rate × duration, applicable discounts, taxes, and final total.                                                   |
| **User Journey: Rate Management (Admin)**        | Business administrators need to define and update rate structures for different equipment types (hourly rates, daily rates, minimum charges).                | The system validates rate inputs (positive values, logical relationships like daily rate < hourly rate × 24), persists the structures, and immediately applies them to new quote calculations. This is a state-changing Command operation.                          |
| **User Journey: Discount Application**           | The system must automatically apply eligible discounts to quotes based on customer loyalty tier, promotional codes, or volume-based rules.                   | Discounts are applied transparently during calculation. The quote breakdown shows which discounts were applied and their impact on the final price.                                                                                                                 |
| **User Journey: Price Consistency**              | When a reservation is created, the price calculated at that moment must be preserved, even if rates change later.                                            | Pricing provides a quote; the Booking module stores that quote as an immutable snapshot. Pricing does not store per-reservation pricing history.                                                                                                                    |
| **Integration Output**                           | Pricing calculations must be fast enough to support real-time quote generation in the user interface without blocking.                                       | Target: Quote calculation completes in <100ms for standard complexity (single equipment type, 1-2 discounts). Complex calculations (multiple items, promotional stacking) may take longer but must remain sub-second.                                               |

---

## 2. Plan Phase: Defining the Technical Architecture ("How")

The Pricing module is designed as a **synchronous, stateless calculation service** with minimal dependencies. It is intentionally kept simple to avoid premature complexity while planting seeds for future evolution (dynamic pricing, multi-currency, external tax APIs).

### A. Core Architectural Constraints

| Constraint                           | Detail based on Architecture Theory                                                                                                                                                                                     | Implementation Approach                                                                                                                                                                                                                              |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boundary/Module**                  | The module is defined by the **Pricing Capability**: calculating rental costs and managing rate structures. It does NOT own payment processing, invoicing, or reservation state.                                        | The `PricingModule` is standalone with clear dependencies: reads from Catalog (equipment type details) and CRM (loyalty status) but never writes to them. Other modules (Booking) call Pricing synchronously before creating reservations.           |
| **Internal Structure**               | Uses **Clean Architecture** (Domain, Application, Infrastructure) with emphasis on pure calculation logic in the domain layer.                                                                                          | Domain layer contains pricing rules (`RateStructure`, `DiscountRule`, `Quote` value objects). Application layer contains CQS handlers (`CalculateQuoteQuery`, `CreateRateStructureCommand`). Infrastructure layer uses TypeORM for rate persistence. |
| **Separation of Concerns**           | Uses **Command-Query Separation (CQS)** with heavy emphasis on the **Query path** since the primary use case is quote calculation (read-heavy).                                                                         | **Commands:** `CreateRateStructureCommand`, `UpdateRateStructureCommand`, `CreateDiscountRuleCommand`. **Queries:** `CalculateQuoteQuery`, `GetRateStructureQuery`, `GetApplicableDiscountsQuery`.                                                   |
| **Integration Pattern**              | Other modules interact with Pricing **synchronously** via the `PricingFacade`. Pricing does NOT consume events from other modules in the initial implementation.                                                        | The Booking module calls `pricingFacade.calculateQuote()` before creating a reservation. This is a simple request-response pattern. No async event-driven flows initially (matches "Start Synchronous / Match Current Needs").                       |
| **Statelessness**                    | Pricing calculations are **stateless** and **deterministic**: same inputs always produce the same output at a given point in time (rate structures are time-versioned but calculations don't store state per customer). | Pricing does NOT track "what quote did we give customer X on Tuesday?". That's Booking's responsibility (stores price snapshot in `Reservation`). Pricing only stores rate structures and discount rules (configuration data).                       |
| **No Event Consumption (Initially)** | Pricing does not react to events from other modules in v1. It is a pure calculation service called on-demand.                                                                                                           | Future evolution: If analytics needs emerge (e.g., "track discount usage"), Pricing can emit `QuoteCalculatedEvent` or `DiscountAppliedEvent` via the Outbox pattern, but these are additive changes.                                                |
| **Dependencies**                     | Pricing depends on Catalog (equipment type metadata) and CRM (customer loyalty status) for calculations, but these are **read-only synchronous queries**.                                                               | Pricing calls `CatalogFacade.getEquipmentTypeDetails(equipmentTypeId)` and `CRMFacade.getCustomerLoyaltyStatus(customerId)` during quote calculation. These are fast lookups that don't involve complex business logic.                              |

---

### B. Technical Implementation Details (Pricing Module)

| Component                    | Responsibility                                                             | Technical Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :--------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Read Path (Queries)**      | `CalculateQuoteQuery`, `GetRateStructureQuery`                             | The primary query is `CalculateQuoteQuery`, which takes `{ equipmentTypeId, startDate, endDate, customerId?, promoCode? }` and returns a `Quote` DTO with: `subtotal`, `discounts[]`, `taxAmount`, `total`. This is a pure calculation with no database writes.                                                                                                                                                                                                                                                                                                                                                        |
| **Calculation Flow**         | Multi-step calculation pipeline.                                           | 1. **Fetch Rate Structure**: Query `RateStructureRepository` for the equipment type's current rates (hourly, daily, minimum charge). 2. **Calculate Duration**: Compute rental duration in hours/days from `startDate` and `endDate`. 3. **Apply Base Rate**: Choose hourly vs. daily rate based on duration (e.g., if >24 hours, use daily rate). 4. **Apply Discounts**: Query applicable discount rules (loyalty tier, promo code) and apply in order of precedence. 5. **Calculate Tax**: Apply tax percentage (future: integrate with external tax API). 6. **Return Quote**: Structured DTO with full breakdown. |
| **Write Path (Commands)**    | `CreateRateStructureCommand`, `UpdateRateStructureCommand`                 | Commands validate input (positive rates, logical relationships like `dailyRate <= hourlyRate * 24 * 0.8` for typical discount), persist to `RateStructure` entity, and optionally emit `RateStructureChangedEvent` for audit/analytics (future).                                                                                                                                                                                                                                                                                                                                                                       |
| **Discount Rules Engine**    | Determining which discounts apply and in what order.                       | Discount rules are stored as entities (`DiscountRule`) with: `type` (loyalty, promo, volume), `eligibilityCriteria` (e.g., "Gold tier"), `discountPercentage`, `validFrom`, `validUntil`. The calculation engine queries applicable rules and applies them sequentially (future: support stacking limits).                                                                                                                                                                                                                                                                                                             |
| **Data Integrity**           | Ensuring rate structures are always valid.                                 | The `RateStructure` entity enforces business rules: rates must be positive, daily rate should be less than 24× hourly rate (warning, not error), equipment type must exist in Catalog (validated during command execution).                                                                                                                                                                                                                                                                                                                                                                                            |
| **Interface for Consumers**  | Hiding internal calculation complexity.                                    | The **`PricingFacade`** exposes: `calculateQuote(input): Promise<Quote>`, `getRateStructure(equipmentTypeId): Promise<RateStructure>`, `createRateStructure(command): Promise<string>`, `updateRateStructure(command): Promise<void>`.                                                                                                                                                                                                                                                                                                                                                                                 |
| **Future: External Tax API** | Integrating with services like Avalara for complex tax jurisdiction rules. | A `TaxCalculationService` interface can be introduced with implementations: `SimpleTaxCalculator` (flat percentage) and `AvalaraTaxCalculator` (external API). The facade remains unchanged; the implementation is swapped via DI.                                                                                                                                                                                                                                                                                                                                                                                     |
| **Future: Dynamic Pricing**  | Supporting surge pricing, seasonal rates, or ML-based pricing.             | Introduce a `PricingStrategy` interface with implementations: `StandardStrategy`, `SeasonalStrategy`, `SurgePricingStrategy`. The `CalculateQuoteHandler` selects the strategy based on configuration or feature flags.                                                                                                                                                                                                                                                                                                                                                                                                |

---

### C. Core Domain Models

#### 1. RateStructure (Entity)

The `RateStructure` entity defines the pricing rules for a specific equipment type.

| Attribute         | Type                         | Description                                                        | Constraints                                             |
| :---------------- | :--------------------------- | :----------------------------------------------------------------- | :------------------------------------------------------ |
| `id`              | UUID (string)                | Unique identifier for the rate structure.                          | Primary Key, Auto-generated                             |
| `equipmentTypeId` | UUID (string)                | Foreign key reference to the equipment type in the Catalog module. | Required, Indexed                                       |
| `hourlyRate`      | Decimal (Money Value Object) | Cost per hour of rental.                                           | Required, Must be positive                              |
| `dailyRate`       | Decimal (Money Value Object) | Cost per day (24-hour period) of rental.                           | Required, Must be positive, Should be < hourlyRate × 24 |
| `minimumCharge`   | Decimal (Money Value Object) | Minimum charge regardless of duration (e.g., 4-hour minimum).      | Optional, Defaults to 0                                 |
| `taxPercentage`   | Decimal                      | Tax rate applied to the subtotal (e.g., 0.08 for 8% sales tax).    | Required, Range: 0-1                                    |
| `effectiveFrom`   | Timestamp                    | When this rate structure becomes active.                           | Required                                                |
| `effectiveTo`     | Timestamp (nullable)         | When this rate structure expires (null = indefinite).              | Optional                                                |
| `createdAt`       | Timestamp                    | Audit field: when the rate was created.                            | Auto-generated                                          |
| `updatedAt`       | Timestamp                    | Audit field: last modification timestamp.                          | Auto-generated                                          |

**Design Rationale:**

- **Time-Versioned Rates**: The `effectiveFrom` and `effectiveTo` fields allow for scheduled rate changes (e.g., "new rates start January 1st"). The query logic fetches the rate structure valid at the requested rental start date.
- **Hourly vs. Daily Optimization**: For long rentals (e.g., 5 days), using the daily rate (5 × dailyRate) should be cheaper than hourly (120 hours × hourlyRate). The calculation engine automatically chooses the cheaper option.
- **Money Value Object**: Rates are stored as `Decimal` (not `float`) to avoid floating-point precision errors. Future: wrap in a `Money` value object that includes currency.

---

#### 2. DiscountRule (Entity)

The `DiscountRule` entity defines conditions under which discounts are applied.

| Attribute             | Type                                    | Description                                                                                 | Constraints                 |
| :-------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------ | :-------------------------- |
| `id`                  | UUID (string)                           | Unique identifier for the discount rule.                                                    | Primary Key, Auto-generated |
| `name`                | String                                  | Human-readable name (e.g., "Gold Loyalty Discount", "SUMMER2025 Promo").                    | Required, Max length 255    |
| `type`                | Enum (Loyalty, Promo, Volume, Seasonal) | Category of discount for organizational purposes.                                           | Required                    |
| `discountPercentage`  | Decimal                                 | Percentage reduction (e.g., 0.15 for 15% off).                                              | Required, Range: 0-1        |
| `eligibilityCriteria` | JSON                                    | Structured criteria (e.g., `{ "loyaltyTier": "Gold" }` or `{ "promoCode": "SUMMER2025" }`). | Required                    |
| `validFrom`           | Timestamp                               | When this discount becomes active.                                                          | Required                    |
| `validUntil`          | Timestamp                               | When this discount expires.                                                                 | Required                    |
| `isActive`            | Boolean                                 | Admin flag to enable/disable without deleting.                                              | Default: true               |
| `stackable`           | Boolean                                 | Whether this discount can be combined with others.                                          | Default: false              |
| `priority`            | Integer                                 | Order in which discounts are applied (lower number = higher priority).                      | Default: 100                |

**Design Rationale:**

- **Flexible Eligibility**: The `eligibilityCriteria` JSON field allows for diverse rules without database schema changes. Examples: `{ "loyaltyTier": "Gold" }`, `{ "minRentalDays": 7 }`, `{ "equipmentCategory": "Heavy Machinery" }`.
- **Stacking Control**: Most businesses don't allow stacking (e.g., can't combine loyalty discount with promo code). The `stackable` flag makes this explicit. If `stackable = false`, only the best single discount is applied.
- **Priority-Based Application**: When multiple discounts are eligible and stackable, they're applied in `priority` order (e.g., loyalty discount first, then promo code).

---

#### 3. Quote (Value Object)

The `Quote` is a **value object** (not an entity) representing the calculated price breakdown. It is returned by the `CalculateQuoteQuery` and embedded in the `Reservation` entity by the Booking module.

| Attribute                | Type                | Description                                             |
| :----------------------- | :------------------ | :------------------------------------------------------ |
| `equipmentTypeId`        | UUID (string)       | The equipment being priced.                             |
| `startDate`              | Timestamp           | Rental start time.                                      |
| `endDate`                | Timestamp           | Rental end time.                                        |
| `durationHours`          | Integer             | Calculated rental duration in hours.                    |
| `baseRate`               | Decimal             | The rate used (hourly or daily).                        |
| `subtotal`               | Decimal             | Base calculation before discounts (rate × duration).    |
| `discountsApplied`       | Array<DiscountLine> | List of discounts with: `{ name, percentage, amount }`. |
| `totalDiscount`          | Decimal             | Sum of all discount amounts.                            |
| `subtotalAfterDiscounts` | Decimal             | Subtotal minus total discount.                          |
| `taxAmount`              | Decimal             | Calculated tax on the discounted subtotal.              |
| `total`                  | Decimal             | Final amount: subtotalAfterDiscounts + taxAmount.       |
| `calculatedAt`           | Timestamp           | When this quote was generated (for audit purposes).     |

**Design Rationale:**

- **Immutable Snapshot**: Once a `Quote` is calculated, it doesn't change. The Booking module stores this quote in the `Reservation` entity as a JSON or embedded value object.
- **Transparency**: The breakdown shows exactly how the final price was reached (rate × duration, each discount, tax). This is critical for customer trust and dispute resolution.
- **No Database Storage in Pricing Module**: Pricing doesn't save quotes. If the Booking module calls `calculateQuote()` twice with the same inputs, it gets the same result (deterministic), but Pricing has no record of the first call.

---

### E. Key Architectural Decisions

#### 1. Why Pricing is Synchronous (Not Event-Driven)

**Decision:** Pricing is called synchronously by the Booking module, not via asynchronous events.

**Rationale:**

- **Pre-Commitment Calculation**: Pricing happens **before** a reservation is created. The user needs to see the price to decide whether to proceed.
- **Fast Response Required**: Users expect real-time pricing in the UI (<100ms). Asynchronous event processing would introduce unacceptable latency.
- **No State Change**: Calculating a quote doesn't change system state. There's no need for eventual consistency or transactional guarantees.

**Future Evolution:** If pricing becomes slow (e.g., calling external APIs for dynamic pricing), we can introduce caching or pre-computed rate tables, but the synchronous interface remains.

---

#### 2. Why Pricing Doesn't Store Quote History

**Decision:** Pricing calculates quotes on-demand but doesn't persist them. The Booking module stores the quote as part of the `Reservation` entity.

**Rationale:**

- **Single Responsibility**: Pricing's job is calculation, not storage. Storing per-customer quote history would mix concerns (analytics/audit trail).
- **Storage Belongs to Consumer**: The Booking module needs the price to create a reservation, so it naturally owns the persistence of that price snapshot.
- **Avoid Data Duplication**: If both Pricing and Booking stored quotes, we'd have synchronization problems (which one is the source of truth?).

**Future Evolution:** If analytics needs emerge ("what quotes did we generate last month?"), introduce a **separate Analytics module** that consumes `QuoteCalculatedEvent` (emitted by Pricing via Outbox) and builds read-optimized projections. Pricing remains calculation-only.

---

#### 3. Discount Precedence and Stacking

**Decision:** Discounts have a `priority` field and a `stackable` flag to control application order and combination.

**Rationale:**

- **Business Rule Complexity**: Some discounts should combine (e.g., loyalty + volume), others shouldn't (loyalty + promo code = choose best).
- **Explicit Control**: Making precedence explicit prevents ambiguous "which discount applies first?" scenarios.
- **Deterministic Results**: Same inputs always produce the same discount application order.

**Default Behavior (v1):**

1. Query all eligible discount rules (matching `eligibilityCriteria`, within `validFrom`/`validUntil`).
2. Filter out inactive rules (`isActive = false`).
3. If multiple rules are eligible:
   - If any have `stackable = false`, apply only the single best discount (highest percentage).
   - If all have `stackable = true`, apply in `priority` order (lowest number first).
4. Calculate cumulative discount amount.

**Future Enhancement:** Support complex stacking policies (e.g., "max 2 discounts", "loyalty + seasonal only").

---

### F. Data Flow: Quote Calculation Workflow

Let me trace the complete flow when the Booking module requests a quote:

```
┌─────────────────────────────────────────────┐
│  Booking Module (CreateReservationHandler)  │
└──────┬──────────────────────────────────────┘
       │ pricingFacade.calculateQuote({...})
       ↓
┌─────────────────────────────────────────────┐
│  Pricing Module (PricingFacade)              │
│  └─ Delegates to CalculateQuoteHandler       │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  CalculateQuoteHandler (Application Layer)   │
│  ├─ 1. Validate Input                        │
│  │    ├─ Start date < end date?              │
│  │    └─ Dates in future?                    │
│  ├─ 2. Get Equipment Type Details            │
│  │    └─ catalogFacade.getEquipmentTypeDetails() │
│  ├─ 3. Get Rate Structure                    │
│  │    └─ rateStructureRepo.findActiveRate()  │ ← Queries by equipmentTypeId, effectiveDate = startDate
│  ├─ 4. Calculate Duration                    │
│  │    └─ durationHours = (end - start) / 3600 │
│  ├─ 5. Apply Base Rate                       │
│  │    ├─ If durationHours <= 24:             │
│  │    │   subtotal = hourlyRate × durationHours │
│  │    └─ Else:                                │
│  │        durationDays = durationHours / 24   │
│  │        subtotal = min(                     │
│  │          hourlyRate × durationHours,       │
│  │          dailyRate × durationDays          │
│  │        )                                   │
│  ├─ 6. Get Applicable Discounts              │
│  │    ├─ If customerId provided:             │
│  │    │   └─ crmFacade.getCustomerLoyaltyStatus() │
│  │    ├─ If promoCode provided:              │
│  │    │   └─ discountRuleRepo.findByCode()   │
│  │    └─ Query volume/seasonal rules          │
│  ├─ 7. Apply Discounts                       │
│  │    └─ Execute precedence/stacking logic    │
│  ├─ 8. Calculate Tax                         │
│  │    └─ taxAmount = subtotalAfterDiscounts × taxPercentage │
│  └─ 9. Build Quote VO                        │
│       └─ Return fully populated Quote object  │
└──────┬──────────────────────────────────────┘
       │ Quote DTO
       ↓
┌─────────────────────────────────────────────┐
│  Booking Module (continues...)               │
│  ├─ Store quote.total in Reservation         │
│  ├─ Store quote breakdown as JSON            │
│  └─ Proceed with reservation creation        │
└─────────────────────────────────────────────┘
```
