## Context

The current order model is built around sourcing states (`PENDING_SOURCING`, `SOURCED`) even though order creation already resolves assets and persists blocking assignments in the same flow. That makes the runtime behavior effectively closer to booking acceptance than procurement tracking, and it does not support the MVP requirement that tenant booking mode determines whether a submission is immediately confirmed or enters pending operator review.

This change crosses several layers:

- persistence enum definitions in `prisma/schema.prisma`
- order lifecycle rules in `src/modules/order/domain/`
- order creation and future operator action commands in `src/modules/order/application/`
- operator read models in `src/modules/order/application/queries/`
- tenant-config-aware order creation through `GetTenantConfigQuery`

The design also needs to preserve compatibility with the existing inventory reservation behavior, where assignments are created immediately during booking submission. That existing behavior is desirable for `request-to-book`, because pending-review orders must still block availability.

## Goals / Non-Goals

**Goals:**

- Replace the sourcing-first order lifecycle with a review-aware booking lifecycle aligned to MVP policy.
- Make initial order state depend on tenant `bookingMode`.
- Preserve immediate assignment creation so `PENDING_REVIEW` orders block availability.
- Define clear transition rules for operator review and fulfillment actions.
- Ensure order reads expose and filter the new lifecycle states consistently.

**Non-Goals:**

- Redesign assignment semantics for temporary holds versus committed assignments; that belongs to the follow-up slice.
- Implement expiry automation; this change only makes `EXPIRED` a valid lifecycle state.
- Introduce procurement or sourcing sub-states separate from order lifecycle.
- Redesign customer-facing booking UX or notification flows.

## Decisions

### 1. Replace sourcing states instead of layering review on top

The order status enum will drop `PENDING_SOURCING` and `SOURCED` and adopt a single booking lifecycle:

```text
PENDING_REVIEW -> CONFIRMED -> ACTIVE -> COMPLETED
       |              |
       v              v
   REJECTED       CANCELLED

PENDING_REVIEW -> EXPIRED
```

Rationale:

- The current system does not meaningfully operate with a long-lived sourcing phase; assignments are resolved during creation.
- Combining sourcing and review concerns in one enum would create ambiguous transitions and harder-to-reason-about queries.
- The backlog explicitly frames the lifecycle around review outcomes and operational states, not procurement states.

Alternatives considered:

- Keep `PENDING_SOURCING` / `SOURCED` and add `PENDING_REVIEW` on top. Rejected because it mixes two orthogonal state axes into one enum and complicates both transition rules and reads.

### 2. Initial order state is derived from tenant booking mode

Order creation will consult tenant config before selecting the initial status:

- `instant-book` -> `CONFIRMED`
- `request-to-book` -> `PENDING_REVIEW`

Assignments will still be created in the same transaction for both modes.

Rationale:

- This aligns order creation directly with MVP policy.
- It preserves current transactional behavior and avoids introducing a partially reserved booking flow.
- It makes later expiry logic straightforward because pending-review bookings already hold inventory.

Alternatives considered:

- Create pending-review orders without assignments and reserve inventory later. Rejected because it violates the backlog requirement that `request-to-book` blocks availability immediately.

### 3. Cancellation remains a confirmed-booking action only

`CANCELLED` will only be reachable from `CONFIRMED`. Pending-review outcomes use `REJECTED` or `EXPIRED` instead.

Rationale:

- This keeps operator review outcomes semantically distinct from post-confirmation cancellation.
- It avoids a vague overlap where the same business event could be represented as either rejection or cancellation.

Alternatives considered:

- Allow `CANCELLED` from `PENDING_REVIEW`. Rejected because it blurs the boundary between review disposition and confirmed-order lifecycle.

### 4. Query-side filtering becomes explicit by lifecycle meaning

Operator schedule and calendar queries will stop relying on a broad `status != CANCELLED` filter. Instead, they will explicitly include only states that should appear in operational scheduling views.

Initial policy:

- Include `PENDING_REVIEW`, `CONFIRMED`, and `ACTIVE` in views that reflect inventory-blocking bookings.
- Exclude `REJECTED`, `EXPIRED`, `CANCELLED`, and `COMPLETED` from active scheduling views unless a specific read model needs historical visibility.

Rationale:

- New terminal states make negative filtering fragile.
- Explicit inclusion is easier to maintain as more review and fulfillment states appear.

Alternatives considered:

- Continue excluding only terminal states one by one. Rejected because omissions become likely as the lifecycle evolves.

### 5. Order detail reads should tolerate future assignment release

Current order detail logic assumes every order has at least one live assignment. This change keeps current behavior intact for creation, but the read model should be prepared to evolve so rejected and expired orders remain readable even after later slices release assignments.

Rationale:

- Slice 2.1 introduces statuses whose natural future behavior involves no active assignment.
- Calling this out now avoids entrenching a read-side invariant that later changes will have to undo.

Alternatives considered:

- Leave the assumption undocumented. Rejected because it hides a near-term coupling between lifecycle work and later hold-release work.

## Risks / Trade-offs

- [Enum replacement affects existing code paths] -> Update all `OrderStatus` consumers together and verify query filters, controller responses, and domain transitions as a set.
- [Existing data may contain removed sourcing statuses] -> Add a migration plan that maps persisted sourcing rows into the new lifecycle before application code depends on the new enum values.
- [Immediate assignments for pending-review bookings temporarily blur hold vs committed semantics] -> Accept this for slice 2.1 and formalize the distinction in the assignment-focused follow-up slice.
- [Operational views may accidentally hide or show the wrong statuses] -> Prefer explicit inclusion lists and add tests around schedule/calendar behavior.
- [Future expiry/rejection release behavior may break detail views] -> Keep order detail queries decoupled from the assumption that a live assignment must always exist.

## Migration Plan

1. Replace the `OrderStatus` enum in Prisma and map persisted sourcing values into the new lifecycle.
2. Regenerate enum consumers and update command/query code paths to compile against the new status set.
3. Update domain transition rules and order creation logic to derive status from booking mode.
4. Add operator action commands/controllers for confirm, reject, cancel, activate, and complete.
5. Update read models and filters for order detail, schedule, and calendar views.
6. Verify transition coverage and read filtering before rolling forward.

Rollback strategy:

- Before production data migration, rollback is a standard code revert.
- After enum/data migration, rollback requires a reverse data mapping, so deployment should treat the schema transition and application rollout as a coordinated change.

## Open Questions

- Should pending-review orders appear in every operator schedule/calendar surface, or only in dedicated review queues plus availability-sensitive views?
- Do any downstream analytics or integrations depend on `PENDING_SOURCING` / `SOURCED` values and need an explicit migration note?
- Should order detail derive period from order-owned fields in a later refactor instead of inferring it from assignments?
