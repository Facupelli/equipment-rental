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

### Ports & Adapters Pattern

Domain defines repository interfaces as Abstract Classes (Ports).
Infrastructure provides the concrete Prisma implementation (Adapters).
Application depends only on the Port — never on Prisma directly.

```typescript
// ✅ CORRECT — Application depends on the Port
@Injectable()
export class CreateBookingUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly bookingRepo: BookingRepositoryPort) {}
}

// ❌ WRONG — Application depends on Prisma directly
@Injectable()
export class CreateBookingUseCase {
  constructor(private readonly prisma: PrismaService) {}
}
```

## Module Map

We use a modular monolith. Do not create cross-module database dependencies.

| Module          | Responsibility                                                                    |
| --------------- | --------------------------------------------------------------------------------- |
| TenancyModule   | Platform config, tenant onboarding, billing units                                 |
| UsersModule     | User management, role assignment                                                  |
| AuthModule      | JWT authentication, session management, guards                                    |
| InventoryModule | Products (Serialized/Bulk), stock levels, inventory items, owners, revenue splits |
| RentalModule    | Rental orders, booking lifecycle, availability checks, pricing engine             |
| CustomerModule  | CRM integration, booking discounts                                                |

**Cross-module interaction rule:** Use the target module's public Service/Use Case API or emit a Domain Event. Never query another module's tables directly.

## Anti-Patterns

- Do not put business logic in Controllers. Controllers only delegate to Use Cases.
- Do not import infrastructure (e.g., `PrismaService`) into Domain layer.
- Do not create circular dependencies between modules.
- Do not skip the spec for non-trivial tasks.
