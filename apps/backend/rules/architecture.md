# Architecture Rules & Spec-Driven Development Workflow

## Spec-Driven Development (SDD) — Do This First

Before writing any non-trivial code (new feature, new service, new module, complex logic),
you must produce a spec and wait for explicit confirmation.

### What Counts as Non-Trivial

- Any new Use Case or Service method
- Any change to booking, pricing, or inventory logic
- Any new module or cross-module interaction
- Any raw SQL query

### Spec Format

Create the spec as a markdown file at `specs/<feature-name>.md` before writing any code.

```markdown
## Spec: <Feature Name>

### What

One paragraph describing what this feature does and why.

### Layers Touched

List which layers and modules are affected (e.g., RentalModule > Application, InventoryModule > Domain).

### Implementation Plan

Step-by-step approach. Be specific about which files will be created or modified.

### Edge Cases

List every edge case you've identified. For bookings: overlaps, race conditions, bundle decomposition, TrackingType differences.

### Acceptance Criteria

Concrete, testable statements of what "done" looks like.

- [ ] A serialized item cannot be double-booked for overlapping ranges
- [ ] A bulk item booking reduces available quantity correctly
- [ ] etc.

### Open Questions

Anything ambiguous that requires human clarification before proceeding.
```

**After writing the spec, stop and ask for confirmation. Do not write implementation code until approved.**

---

## Project Structure

```text
src/modules/<feature>/
├── domain/            # Entities, Value Objects, Domain Exceptions, Port Interfaces (Abstract Classes)
├── application/       # Use Cases / Services — orchestrates domain logic
├── infrastructure/    # Repository implementations, external adapters
├── <feature>.module.ts
```

## Layer Rules

**Dependencies flow inward. Infrastructure depends on Domain. Domain depends on nothing.**

| Layer          | Can Depend On       | Cannot Depend On                          |
| -------------- | ------------------- | ----------------------------------------- |
| Domain         | Nothing             | Application, Infrastructure, Presentation |
| Application    | Domain              | Infrastructure, Presentation              |
| Infrastructure | Domain, Application | Presentation                              |
| Presentation   | Application         | Domain, Infrastructure directly           |

### Ports, Read Services & Module Public API

There are three distinct abstraction types. Never conflate them.

#### 1. Repository Port

Defines the aggregate persistence contract. Lives in `domain/`.
Infrastructure implements it. Contains only `load` and `save` (and bulk variants if needed).
Never expose query methods or DTOs here.

```typescript
export abstract class UsersRepositoryPort {
  abstract load(id: string): Promise<User | null>;
  abstract save(user: User): Promise<string>;
}
```

#### 2. Read Service

Defines read-only projections that bypass the domain model. Lives in `domain/`.
Used internally by the module's own use cases and controllers when no domain
enrichment is needed. Returns DTOs or primitives, never Aggregate instances.
The infrastructure class implementing `RepositoryPort` may also implement this
— register it under both tokens. Split into a separate class only if complexity demands it.

```typescript
export abstract class UserReadService {
  abstract isEmailTaken(email: string): Promise<boolean>;
  abstract findCredentialsByEmail(email: string): Promise<UserCredentials>;
}
```

#### 3. Module Public API

The bounded context contract exposed to other modules. Lives in `application/`.
Other modules depend on this abstraction — never on the concrete service directly.
Contains both commands and reads that external modules legitimately need.
Implemented by the module's ApplicationService, registered as a provider and exported.

```typescript
export abstract class UsersPublicApi {
  abstract createUser(dto: CreateUserDto): Promise<string>;
  abstract isEmailTaken(email: string): Promise<boolean>;
}
```

#### Injection pattern (no string tokens)

Always use the abstract class as the injection token. NestJS resolves it at runtime.

```typescript
// In module:
{ provide: UsersRepositoryPort, useClass: UsersRepository },
{ provide: UserReadService, useClass: UsersRepository }, // same class, two tokens
{ provide: UsersPublicApi, useClass: UsersApplicationService },

// In consumer:
constructor(private readonly usersApi: UsersPublicApi) {} // cross-module
constructor(private readonly readService: UserReadService) {} // internal only
```

#### Decision rules

| I need to...                                      | Use               |
| ------------------------------------------------- | ----------------- |
| Persist or reconstitute an aggregate              | `RepositoryPort`  |
| Query data without domain enrichment (own module) | `ReadService`     |
| Call another bounded context                      | `TargetPublicApi` |
| Expose something to other bounded contexts        | Own `PublicApi`   |

## Module Map

We use a modular monolith. Do not create cross-module database dependencies.

| Module          | Responsibility                                                                                |
| --------------- | --------------------------------------------------------------------------------------------- |
| TenancyModule   | Tenant onboarding, locations, owners, billing unit activation                                 |
| UsersModule     | User management, role assignment, permissions (CASL)                                          |
| AuthModule      | JWT authentication, session management, refresh tokens, guards                                |
| InventoryModule | Product types, product categories, assets, blackout periods, maintenance periods              |
| RentalModule    | Rental orders, booking lifecycle, availability checks, pricing engine, pricing tiers, bundles |
| CustomerModule  | Customer lifecycle, CRM integration                                                           |

## Entities Modules Map

| Module             | Repository                                   |
| ------------------ | -------------------------------------------- |
| `tenant-module`    | `BillingUnit`, `Location`, `Owner`, `Tenant` |
| `catalog-module`   | `ProductCategory`, `ProductType`, `Bundle`   |
| `pricing-module`   | `PricingRule`                                |
| `customer-module`  | `Customer`                                   |
| `user-module`      | `User`, `Invitation`, `Role`, `UserRole`     |
| `inventory-module` | `Asset`                                      |
| `order-module`     | `Order`                                      |

**`BillingUnit` in `tenant-module`** — it's system-level reference data that tenants activate. It has no real domain logic of its own. Tenant is the natural home.

**`pricing-module` as its own module** — `PricingRule` and `PricingTier` are referenced by both `ProductType` and `Bundle`. Keeping pricing isolated avoids circular dependencies between catalog and order modules.

**`inventory-module` separate from `catalog-module`** — `ProductType` is the catalog definition, `Asset` is the physical stock. These are distinct concerns and the separation will matter when you build availability queries.

---

**Cross-module interaction rule:** Use the target module's public Service/Use Case API or emit a Domain Event. Never query another module's tables directly.

## Anti-Patterns

- Do not put business logic in Controllers. Controllers only delegate to Use Cases.
- Do not import infrastructure (e.g., `PrismaService`) into Domain layer.
- Do not create circular dependencies between modules.
- Do not skip the spec for non-trivial tasks.
- Do not add query methods to a `RepositoryPort`
- Do not access another module's `RepositoryPort` or `ReadService` directly
- Do not create a separate Port for every cross-module caller — one `PublicApi` per module
- Do not use string tokens (`@Inject('USERS_REPO')`) — use the abstract class as token
