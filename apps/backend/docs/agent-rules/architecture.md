# Architecture - Equipment Rental Platform

This document describes the architectural decisions and structure of this NestJS backend application. It answers what the architecture is and why it was designed this way. For how to implement each component, refer to the artifact-specific files linked from each section.

---

## Overview

This is a multitenant equipment rental platform. The architecture combines Domain-Driven Design, Hexagonal Architecture, Clean Architecture, and SOLID principles.

Core goals:

- Business rules stay isolated from frameworks and infrastructure. The domain layer has no knowledge of NestJS, Prisma, or HTTP.
- Use cases are explicit and navigable. One use case maps to one Application Service, one controller, and one command or query.
- Module boundaries are enforced. Bounded contexts do not bleed into each other.
- The domain model can evolve independently of the database schema.

### Architectural influences

| Influence              | What we take from it                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Domain-Driven Design   | Entities, Aggregates, Domain Services, Value Objects, Domain Events, Ubiquitous Language   |
| Hexagonal Architecture | Dependency direction points inward. Outer layers depend on inner layers, never the reverse |
| Clean Architecture     | Layer separation: Domain -> Application -> Interface Adapters -> Infrastructure            |
| SOLID                  | Single Responsibility drives one-service-per-use-case                                      |
| CQRS                   | Command/Query separation at the application layer via NestJS CQRS                          |

### What we deliberately skip

- Repository ports or interfaces on top of Prisma-backed repositories. Repositories exist, but they are concrete classes. See [ADL-01](#adl-01-concrete-repositories-no-repository-ports).
- Value Objects for single primitives. Value Objects are used only for complex multi-field concepts. See [ADL-02](#adl-02-no-value-objects-for-single-primitives).

---

## Modules

Each module represents a bounded context: a cohesive area of the domain with its own language, rules, and data.

### Boundaries

Modules must not import each other through private internals. The only valid cross-module dependency is an explicit public contract exposed by the owning module.

This boundary is one of the most important structural rules in the codebase. Violating it creates tight coupling that makes bounded contexts hard to reason about independently.

### Inter-module communication

Cross-module communication is allowed only through the callee module's explicit public surface. The transport mechanism does not define the boundary; the contract location does.

#### Allowed patterns

- Public Facade/API for synchronous business capabilities and command-side collaboration
- Public Query Contract for cross-module reads via `QueryBus`, but only when the query class is part of the callee's explicit public surface
- Public Domain Event for decoupled side effects that should happen after a successful state change

#### Default rule

Default to a Public Facade/API when one module needs another module to perform work synchronously.

Use a Public Query Contract only when all of the following are true:

- the interaction is read-only
- the caller needs data, not business behavior
- the result is naturally a read model

Use a Public Domain Event only for post-commit reactions that should not be orchestrated synchronously by the caller.

Cross-module command dispatch through `CommandBus` is not a standard boundary pattern in this codebase. If one module needs another module to perform work synchronously, call that module's public facade instead.

#### Forbidden cross-module access

Modules must not import another module through its private `application/`, `domain/`, or `infrastructure/` folders.

This means the following are forbidden across module boundaries:

- importing commands, queries, handlers, services, repositories, entities, domain services, constants, or decorators from another module's private folders
- importing types from another module's handler file or implementation-specific file
- using `QueryBus` or `CommandBus` with a contract that lives in another module's private folders

Allowed cross-module imports must come from an explicit public surface, such as:

- `src/modules/<module>/<module>.public-api`
- `src/modules/<module>/public/**`

#### Public contract rules

Public contracts may expose:

- primitives
- dedicated public DTOs or read models
- intentionally shared kernel types

Public contracts should not expose private module internals such as repositories, handler-local types, or other implementation-specific types. Leaking persistence details through a public contract should be avoided unless there is an explicitly documented exception.

#### Rule of thumb

- "Do something" -> Public Facade/API
- "Tell me something" -> Public Query Contract
- "React later" -> Public Domain Event

#### Examples

Allowed:

- `order -> pricing` through `PricingPublicApi`
- `order -> tenant` through `tenant/public/queries/*`

Forbidden:

- `tenant -> users/application/...`
- `auth -> customer/application/...`
- `internal -> tenant/application/...`
- cross-module imports from `auth/infrastructure/...`

### Vertical slicing

Inside each module, code is organized by use case rather than by generic technical layer folders alone. A use case typically owns its command or query, Application Service or Query Handler, controller, and DTOs. Shared domain artifacts live in the module's domain area.

---

## Application Layer

Application Services orchestrate command-side use cases. They load aggregates through repositories, invoke domain logic, persist results, and return an outcome. They contain no business logic.

Every state-changing use case has exactly one Application Service. Application Services do not call each other.

We follow Command-Query Separation. Every use case is either a Command or a Query, never both. Commands are handled by Application Services through the NestJS `CommandBus`. Queries are handled by Query Handlers through the `QueryBus`.

The chaining rule is Command -> Event -> Command. A command-side Application Service does not dispatch another command directly as part of a workflow chain. It persists state, the aggregate records a Domain Event, and an Event Handler may dispatch the next command.

Component files: [`application-service.md`](application-service.md), [`command.md`](command.md), [`query.md`](query.md)

---

## Domain Layer

The domain layer contains business rules only. It has zero knowledge of NestJS, Prisma, HTTP, or transport concerns.

### Entities and Aggregates

Entities are domain objects with stable identity. An Aggregate is a cluster of related entities treated as a single consistency boundary, accessed only through its Aggregate Root.

Component file: [`entity.md`](entity.md)

### Domain Services

Domain Services hold domain logic that spans multiple entities or aggregates and does not belong naturally to any single one.

Component file: [`domain-service.md`](domain-service.md)

### Value Objects

Value Objects represent immutable domain concepts defined by their properties rather than identity. In this codebase they are reserved for complex multi-field concepts with real invariants and behavior.

Component file: [`value-object.md`](value-object.md)

### Domain Events

Domain Events express that something meaningful happened in the domain. Aggregate Roots record them during state changes. They are dispatched after persistence succeeds.

Component file: [`domain-event.md`](domain-event.md)

### Domain Errors

Domain Errors represent expected, recoverable business failures. They are returned through `neverthrow` `Result` types rather than thrown.

Component file: [`domain-error.md`](domain-error.md)

---

## Interface Adapters

Interface Adapters translate between the outside world and the application core. They contain no business logic.

### Controllers

One controller per use case. Controllers parse input, build a command or query, dispatch it, and map results or Domain Errors into HTTP responses.

### DTOs

Request DTOs validate incoming data. Response DTOs define the exact API contract returned to callers. Commands and DTOs are always separate types.

Component files: [`controller.md`](controller.md), [`request-dto.md`](request-dto.md), [`response-dto.md`](response-dto.md)

---

## Infrastructure Layer

The infrastructure layer contains technology-specific implementation details.

### Prisma

Prisma is the persistence technology for both command-side and query-side code.

- On the command side, concrete repositories use `PrismaService` plus mappers to load and save aggregates.
- On the query side, Query Handlers may inject `PrismaService` directly and return read models without going through repositories.

### Repositories

Repositories exist for aggregate persistence. They are concrete Prisma-backed components that encapsulate how an aggregate is loaded and saved, including mapper usage and command-side persistence concerns.

Repositories are not hidden behind ports or interfaces. This codebase does not add another abstraction layer purely to preserve hypothetical database swapability.

Component file: [`repository.md`](repository.md)

### Persistence models and Mappers

The Prisma schema defines persistence models. Domain entities are domain models. These are deliberately separate. Mappers translate between them - from Prisma record to domain entity on load, and from domain entity to Prisma input on save.

Repositories use mappers on aggregate persistence flows. Query Handlers normally do not.

Component file: [`mapper.md`](mapper.md)

### `tstzrange`

PostgreSQL's `tstzrange` type is used for booking periods. Prisma does not natively support it, so standard Prisma operations persist periods as `periodStart` and `periodEnd` columns. Raw queries using overlap operators are used only where native Postgres range behavior is required.

---

## Error Handling Strategy

Two categories of failures exist in this system:

| Category     | Nature                    | Mechanism               | Example                                            |
| ------------ | ------------------------- | ----------------------- | -------------------------------------------------- |
| Domain Error | Expected, recoverable     | `Result` (`neverthrow`) | Equipment unavailable, booking cannot be cancelled |
| Exception    | Unexpected, unrecoverable | `throw`                 | DB connection failure, invariant violated by a bug |

Rule of thumb: if a business analyst could describe the failure scenario, it is a Domain Error. If it means something is broken technically or an invariant was violated incorrectly, throw an exception.

Errors travel upward through layers: the domain returns them, the Application Service propagates them, and the controller maps them to HTTP responses. HTTP exception types do not appear below the controller layer.

Component file: [`domain-error.md`](domain-error.md)

---

## Folder and File Structure

### Top-level

```text
src/
  modules/
    inventory/
    order/
    tenant/
    customer/
    users/
  core/
    database/
    decorators/
    exceptions/
    response/
  config/
  app.module.ts
```

### Inside a module

```text
order/
  application/
    commands/
      create-order/
        create-order.command.ts
        create-order.service.ts
        create-order.http.controller.ts
        create-order.request.dto.ts
        create-order.response.dto.ts
    queries/
      find-orders/
        find-orders.query.ts
        find-orders.query-handler.ts
        find-orders.http.controller.ts
        find-orders.request.dto.ts
        find-orders.response.dto.ts
  domain/
    order.entity.ts
    booking-period.value-object.ts
    order-status.enum.ts
    events/
      order-confirmed.event.ts
    errors/
      order.errors.ts
    services/
      order-pricing.service.ts
  infrastructure/
    order.repository.ts
    order.mapper.ts
  order.module.ts
```

### File naming

Files use a dot-separated suffix that identifies their role: `.entity.ts`, `.value-object.ts`, `.service.ts`, `.command.ts`, `.query.ts`, `.query-handler.ts`, `.http.controller.ts`, `.event.ts`, `.event-handler.ts`, `.mapper.ts`, `.request.dto.ts`, `.response.dto.ts`, `.errors.ts`, `.module.ts`.

---

### ADL-01: Concrete repositories, no repository ports

Decision: repositories exist as concrete classes responsible for loading and saving aggregates, mapping domain entities to and from Prisma records, and encapsulating command-side persistence logic. What is not introduced is a repository port or interface on top of them.

Rationale: abstracting repositories behind ports is usually motivated by keeping the database swappable. In this project we use PostgreSQL with Prisma and do not want the extra boilerplate or reduced expressiveness that comes from layering interfaces over concrete repository code. Domain entities remain decoupled from Prisma schema types through repositories and mappers.

Trade-off accepted: command-side Application Services depend on concrete repositories, and those repositories depend on Prisma. Query Handlers are intentionally coupled to Prisma for read-model efficiency.

---

### ADL-02: No Value Objects for single primitives

Decision: Value Object wrapper classes are not created for individual primitive values.

Rationale: in TypeScript, wrapping every primitive in a class introduces `.value` noise and limited benefit compared to using Value Objects only where a multi-field concept carries important invariants and behavior.

Trade-off accepted: some primitive-level validation remains at the DTO boundary rather than in dedicated domain classes.

---

### ADL-03: `neverthrow` for Result types

Decision: the `neverthrow` library is used for `Result<T, E>` types to represent recoverable Domain Errors.

Rationale: it provides a clean, well-typed API and keeps expected failures explicit in signatures without introducing framework coupling.

---

### ADL-04: EventEmitter2 for Domain Events

Decision: `@nestjs/event-emitter` is used for in-process Domain Event dispatching.

Rationale: Domain Events in this project are in-process only. EventEmitter2 integrates cleanly with NestJS modules and dependency injection without introducing additional infrastructure.
