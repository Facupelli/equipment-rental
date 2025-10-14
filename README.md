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

## 5. Project Specifications (Spec-Driven Development)

As established by the SDD methodology, the development proceeds in phases: Specify, Plan, Tasks, and Implement. The structure below will hold the resulting specifications and plans for each capability.

### A. Booking Capability Specification

_(This section would contain the detailed Specification and Plan generated in the previous steps for the Booking Module, including the definition of Commands, Queries, and Events like `ReservationCreatedEvent`.)_

### B. Inventory Capability Specification

_(This section will contain the detailed Specification and Plan for the Inventory Module, including its capacity Query, asset registration Commands, and its need to consume events from Booking, defined by subsequent SDD steps.)_

### C. Future Capability Specifications (Placeholder)

_(Future modules like Pricing, Payment, and Logistics will be specified here before implementation, defining their boundaries and internal CQS structure.)_

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

## 3. Tasks Phase: Breaking Down the Work

The Tasks phase takes the refined specification and plan and breaks them into small, reviewable chunks that can be implemented and tested in isolation. Since you have only implemented the initial creation and availability check, the next tasks should focus on the remaining reservation lifecycle:

### A. Next Required Tasks for Booking Capability

The existing code suggests several missing functionalities hinted at in the `BookingFacade` and `Reservation` entity.

| Task ID     | Description of Work Chunk                                                                                                                                                                                      | Type (Command/Query) | Related Specification                                                   |
| :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- | :---------------------------------------------------------------------- |
| **BKG-001** | Implement the **Confirm Reservation** Command. This task involves validating the reservation status (must be `PENDING`) and transitioning the status to `CONFIRMED`.                                           | Command (Write)      | Required for finalizing a booking after payment is processed.           |
| **BKG-002** | Implement the **Confirm Reservation** Command Handler. This handler must execute the confirmation logic (BKG-001), update the database status, and persist the **`ReservationConfirmed`** event to the outbox. | Command Handler      | Ensures transactional consistency for status update and event delivery. |
| **BKG-003** | Implement the **Cancel Reservation** Command. This task allows a customer to cancel a booking only if the status is `PENDING` or `CONFIRMED`.                                                                  | Command (Write)      | Required for managing customer cancellations.                           |
| **BKG-004** | Implement the **Get Reservation Details** Query. This retrieves the full details of a specific reservation by ID.                                                                                              | Query (Read)         | Required for the customer/admin interface to view current bookings.     |
| **BKG-005** | Update the **`ReservationRepository`** to include `findById` implementation that maps the schema to the domain entity for the query handler (BKG-004).                                                         | Infrastructure       | Ensures the Query Handler can safely access the required read data.     |

## By using this structured Spec-Driven approach, you are ensuring that subsequent implementations are guided by your established architectural plan (CQS, modularity, Clean Architecture, and low-cost asynchronous evolution).

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

## III. Tasks Phase: Breaking Down the Work

Based on the need to integrate with the existing Booking module and manage the core assets, here are the concrete, small, and reviewable chunks of work for the Inventory module:

| Task ID     | Description of Work Chunk                                                                                                                                                                                                                                                     | Type (C/Q/H)    | Rationale                                                                                               |
| :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------ |
| **INV-001** | Define the **Inventory Management Capability** boundary, setting up the basic module structure (`InventoryModule`, `InventoryFacade`).                                                                                                                                        | Architecture    | Establishing the modular structure.                                                                     |
| **INV-002** | Implement the `EquipmentItem` Domain Entity (containing `equipmentTypeId`, `serialNumber`, and `status`).                                                                                                                                                                     | Domain          | Modeling based on capability.                                                                           |
| **INV-003** | Implement the **`RegisterEquipmentCommand`** and its Handler (CQS Write Path). This persists a new `EquipmentItem` to the database.                                                                                                                                           | Command (Write) | Core asset creation functionality.                                                                      |
| **INV-004** | Implement the **`GetTotalCapacityQuery`** and its Handler (CQS Read Path). This queries the total number of equipment items available for a specific type.                                                                                                                    | Query (Read)    | Provides the data required by Booking (replacing the hardcoded `10`).                                   |
| **INV-005** | Update the Booking Module: **Inject `InventoryFacade`** into `CheckAvailabilityHandler` and `CreateReservationHandler` to call `InventoryFacade.getTotalCapacity()` instead of using the placeholder value (`totalInventory = 10`).                                           | Integration     | Completes the necessary synchronous connection between the capabilities.                                |
| **INV-006** | Implement the **`ReservationConfirmedHandler`** (Event Handler). This handler consumes the **`ReservationConfirmedEvent`** published by the Booking module (asynchronously) and executes the logic to mark specific equipment items as **`Allocated`** for the rental period. | Event Handler   | Implements the asynchronous workflow handoff using the already established database-as-a-queue pattern. |
