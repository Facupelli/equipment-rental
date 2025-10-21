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

The Specify phase focuses on the user experience, the outcomes that matter, and _what_ the system should accomplish, regardless of the technical stack.

### A. High-Level Booking Capability Specification

| Aspect                                 | Description (User/Business Intent)                                                                                                                                        | Outcomes and Success Criteria                                                                                                                                                |
| :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Capability Goal**                    | To allow customers to reliably check the availability of specific equipment types and create reservations for those items, priced hourly or daily.                        | **Success:** A confirmed reservation is created only if inventory and time constraints are met. **Failure:** Clear error messages detailing unavailability or invalid input. |
| **User Journey: Availability Check**   | A potential customer needs to know quickly if an equipment type is available for their desired time range (start/end date/time) and quantity.                             | The system must return a clear boolean flag (`isAvailable`) and the remaining capacity. This must be a **safe read operation** with no side effects (a Query).               |
| **User Journey: Reservation Creation** | Once satisfied with availability, the customer requests to create a firm reservation, providing customer details and rental specifics.                                    | The system accepts the request (a Command), validates input (e.g., start date is in the future, end date is after start date), reserves inventory, and persists the data.    |
| **Architectural Output**               | Upon successful reservation, an explicit, immutable event (`ReservationCreated`) must be generated to notify other capabilities (e.g., Payment, Inventory, Notification). | This event generation should be guaranteed, even if downstream systems are slow, by using a mechanism like the Outbox Pattern.                                               |

---

## 2. Plan Phase: Defining the Technical Architecture ("How")

The Plan phase translates the specification into technical decisions, integrating your architectural constraints, standards, and chosen technologies. Since you have a strong foundation, the Plan will document your chosen methods for optionality and implementation.

### A. Core Architectural Constraints (User Defined)

| Constraint                 | Detail based on Architecture Theory                                                                                                   | Implementation Evidence in Sources                                                                                                                                                                                                                      |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Boundary/Module**        | The module is defined by the **Booking Capability**, preventing a single mega-model for complex entities like "Equipment" or "Order". | The `BookingModule` handles reservation logic and availability. Other related capabilities (Inventory, Pricing) are implied to be separate, indicated by placeholders for external facades (e.g., `TODO: Get totalInventory from Inventory module`).    |
| **Internal Structure**     | Uses **Clean Architecture** (Domain, Application, Infrastructure).                                                                    | The module is structured with Domain Services (`AvailabilityCheckerService`), Application Layer (Commands/Queries/Handlers), and Infrastructure (TypeORM Repositories). The Domain layer defines the rules (e.g., `Reservation` entity business rules). |
| **Separation of Concerns** | Uses **Command-Query Separation (CQS)** to separate state-changing operations (Writes/Commands) from data retrieval (Reads/Queries).  | **Commands:** `CreateReservationCommand`. **Queries:** `CheckAvailabilityQuery`.                                                                                                                                                                        |
| **Evolution/Optionality**  | Architectural evolution is enabled by planting seeds for **asynchronous movement**.                                                   | The system uses the **Outbox Pattern** via the database as a queue, ensuring transactional consistency between saving the reservation and firing the event. A background service (`OutboxProcessorService`) processes these events.                     |

### B. Technical Implementation Details (Booking Module)

The technical plan should explicitly address how your commands and queries operate, given the constraints of a high-availability booking system:

| Component                   | Responsibility                                  | Technical Details                                                                                                                                                                                                                                                         |
| :-------------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Read Path (Query)**       | `CheckAvailabilityQuery`                        | This is a pure read operation. It relies on the `AvailabilityCheckerService`, which queries overlapping reservations (only `PENDING` or `CONFIRMED` statuses) using optimized database queries and calculating peak usage via a sweep line algorithm.                     |
| **Write Path (Command)**    | `CreateReservationCommand`                      | The command handler orchestrates the full workflow: validation, availability check, entity creation, and persistence. If validation fails (e.g., invalid time range), it returns a `BadRequestException`. If inventory is insufficient, it returns a `ConflictException`. |
| **Data Consistency**        | Guaranteeing event delivery after state change. | The `CreateReservationHandler` uses a **single transaction** (`dataSource.transaction`) to save the `Reservation` and create the `Outbox` record simultaneously.                                                                                                          |
| **Interface for Consumers** | Hiding internal structure.                      | The **`BookingFacade`** acts as the only public interface for other modules, exposing clear methods like `checkAvailability` and `createReservation`.                                                                                                                     |

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

# Customer Modules Documentation

Here's the markdown documentation for both Customer modules following your established specification format:

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
