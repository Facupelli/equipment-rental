# High-Level Design Document: Equipment Rental Service

## Introduction

The Equipment Rental Service is a modular monolith application designed to facilitate the hourly or daily booking of diverse equipment types. The architectural approach is governed by the principle of **optionality**, prioritizing solutions that match current needs while providing a low-cost path for future architectural evolution.

The primary goal of this design is to create a maintainable, high-quality system where the **specification is the living, executable source of truth**.

## 1. Architectural Philosophy: Optionality and Evolution

Our guiding principle is **Optionality Over Upfront Overengineering**. We aim to avoid applying complex patterns or architectural styles intended to solve problems we do not currently face.

### A. Architectural Drivers

- **Avoid Early Complexity:** We will not immediately adopt complex infrastructure (like full event sourcing or external message queues). The best architecture is the one that matches our current needs.
- **Low-Cost Asynchronicity:** We will structure the code to allow for asynchronous work but will use the existing database as a queue to achieve this low-cost asynchronous movement initially.
- **Explicitness:** We will be explicit about the actions being taken, which is an enabler for future evolution.

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

- **The Approach:** We **start simple** by depending directly on concrete infrastructure implementations where justified. For example, the `CreateReservationHandler` injects the concrete `ReservationRepository`, not an interface defined in the Domain layer.
- **Justification:** The repository interface (`IReservationRepository`) exists in the Domain layer, defining _what_ the domain needs, but the **Application/Infrastructure layers may choose to inject the concrete implementation directly** (`ReservationRepository`) if there is only one implementation (TypeORM) and few usages. An abstraction will only be introduced when we evolve and have multiple implementations or many usages that would benefit from a simplified API.

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
