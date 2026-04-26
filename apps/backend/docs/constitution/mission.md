# Mission

This backend powers a B2B multi-tenant equipment rental SaaS.

The system exists to help rental businesses manage equipment, customers, orders, bookings, availability, and tenant-specific operations in a reliable and maintainable way.

The backend must support long-term evolution of rental-domain behavior without allowing framework, database, or transport concerns to leak into business rules.

## Product goals

- Model the equipment rental domain clearly.
- Support multi-tenant business operations.
- Keep rental workflows explicit, testable, and navigable.
- Preserve module boundaries so each bounded context can evolve independently.
- Make use cases easy to understand, review, and change.

## Engineering goals

- Business rules live in the domain layer.
- Application use cases orchestrate behavior but do not contain business logic.
- Controllers translate HTTP concerns into commands and queries.
- Prisma and PostgreSQL remain infrastructure concerns.
- Expected business failures are represented as typed Domain Errors.
- Generated or agent-assisted changes must remain small, reviewable, and covered by appropriate tests.

## Non-goals

- Do not optimize for hypothetical database swapability.
- Do not introduce repository interfaces purely for abstraction.
- Do not wrap every primitive in Value Objects.
- Do not allow modules to depend on another module’s private internals.
