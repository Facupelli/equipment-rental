## Context

The current pending-review booking flow already creates inventory-blocking `ORDER` assignments during order creation. That makes availability safe, but it collapses two different business meanings into the same assignment representation: a temporary hold for operator review and a committed assignment for a confirmed booking.

This matters because the order lifecycle already distinguishes `PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXPIRED`, and `CANCELLED`, while assignment persistence and availability logic still treat every order-backed assignment as the same thing. As a result, confirm does not need to change assignment semantics, and reject, expire, and cancel have no explicit release behavior tied to assignment state.

The change is cross-cutting:

- `create-order` chooses the initial order status and persists assignments in the booking transaction.
- inventory availability blocks on overlapping assignment rows regardless of meaning.
- confirm, reject, expire, and cancel currently update only order status.
- raw SQL constraints on `asset_assignments` currently model only assignment type, source, and order linkage.

## Goals / Non-Goals

**Goals:**

- Represent order-backed assignments with explicit stages so temporary holds and committed fulfillment remain separate concepts.
- Keep both stages availability-blocking while they are active.
- Convert hold assignments to committed assignments when a pending-review order is confirmed.
- Release hold assignments on rejection and expiry, and release committed assignments on cancellation.
- Preserve the existing separation between order lifecycle status and assignment purpose.

**Non-Goals:**

- Redesign operator read surfaces beyond the assignment semantics they already consume.
- Change blackout or maintenance assignment behavior.
- Introduce procurement, sourcing, or partial-fulfillment workflows.
- Add asynchronous expiration orchestration; this change only defines the persistence and lifecycle semantics once expiry is triggered.

## Decisions

### 1. Keep `AssignmentType.ORDER`; add an order-assignment stage field

`AssignmentType` continues to answer why an asset is blocked: `ORDER`, `BLACKOUT`, or `MAINTENANCE`. A new order-only field will represent the stage of an order-backed assignment, with values `HOLD` and `COMMITTED`.

Rationale:

- The distinction between hold and committed is not a new blocking category; it is a stage within the existing order-backed assignment category.
- This avoids duplicating order lifecycle semantics inside assignment type names like `ORDER_HOLD` and `ORDER_COMMITTED`.
- It keeps non-order assignments conceptually clean and allows DB checks to express that only `ORDER` rows may have an assignment stage.

Alternatives considered:

- Split `AssignmentType.ORDER` into `ORDER_HOLD` and `ORDER_COMMITTED`: rejected because it overloads assignment type with lifecycle semantics and makes the enum less coherent.
- Infer assignment stage solely from order status: rejected because persistence and availability need a first-class representation for conversion and release behavior.

### 2. Creation derives assignment stage from booking mode

Order creation will continue to resolve concrete assets up front, but persisted order-backed assignments will use stage `HOLD` for `request-to-book` orders and `COMMITTED` for `instant-book` orders.

Rationale:

- This preserves immediate availability blocking for both booking modes.
- It keeps asset resolution behavior unchanged while making the persisted meaning correct.
- It avoids creating two assignment rows for the same asset/period, which would conflict with the existing exclusion constraint.

Alternatives considered:

- Defer asset assignment until confirmation for pending-review orders: rejected because slice `2.1` intentionally introduced immediate availability blocking during review.
- Persist both a hold and committed row and switch which one is active: rejected because overlapping rows for the same asset/period conflict with the exclusion constraint and complicate migration.

### 3. Lifecycle actions mutate or release assignment rows explicitly

Lifecycle commands will no longer be status-only operations:

- confirm: transition the order to `CONFIRMED` and update related order assignments from `HOLD` to `COMMITTED`
- reject: transition the order to `REJECTED` and delete related `HOLD` assignments
- expire: transition the order to `EXPIRED` and delete related `HOLD` assignments
- cancel: transition the order to `CANCELLED` and delete related `COMMITTED` assignments

These changes should occur in a single transaction per command so the order lifecycle and assignment persistence cannot diverge.

Rationale:

- Assignment rows are the source of truth for availability, so releasing or converting them must happen atomically with lifecycle transitions.
- In-place mutation from `HOLD` to `COMMITTED` preserves the single blocking row and works with the current exclusion constraint.

Alternatives considered:

- Leave release to a later cleanup process: rejected because stale assignment rows would continue blocking availability after terminal outcomes.
- Recreate assignments instead of mutating them on confirm: rejected because delete-and-insert is noisier, creates unnecessary race windows, and provides no business benefit over an update.

### 4. Availability remains assignment-driven, not order-status-driven

Availability queries will continue to block on overlapping assignment rows, but they must treat only active order stages (`HOLD`, `COMMITTED`) as order-backed blockers.

Rationale:

- Availability should remain grounded in `asset_assignments`, not in joins back to orders, to preserve the current physical-reservation model.
- Once rejected, expired, or cancelled assignments are deleted, no special status filter is needed to release availability.

Alternatives considered:

- Make availability depend on order status joins: rejected because it weakens the existing model where assignments are the direct source of truth for physical blocking.

### 5. Read surfaces keep their current business filtering unless they need stage data

Pending-review queues remain driven by `orders.status = PENDING_REVIEW`. Operational schedule and calendar views remain driven by confirmed/active order states. This change does not require broad query redesign; only assignment-backed reads that depend on assignment shape need to understand the new stage field.

Rationale:

- The business separation between pending-review and operational views already exists at the order-status level.
- The new field is primarily needed for persistence correctness and lifecycle semantics, not for redefining every read surface.

Alternatives considered:

- Add assignment-stage-specific read contracts everywhere immediately: rejected as unnecessary scope expansion for this slice.

## Risks / Trade-offs

- [Migration complexity] Existing order assignments have no stage value. -> Backfill current rows based on their linked order status during migration, and enforce a constraint only after data is normalized.
- [Lifecycle divergence] Updating order status without changing assignments would leave stale blockers. -> Perform lifecycle transition and assignment mutation/release in one transaction and add command-level tests for both effects together.
- [Constraint drift] New stage semantics can become inconsistent with assignment type or order linkage. -> Add DB checks so `ORDER` rows require a stage and non-order rows must have `NULL` stage.
- [Raw SQL surface area] Assignment writes and availability rely on SQL outside Prisma's higher-level model support. -> Centralize stage-aware inserts, updates, and deletes in the inventory persistence boundary instead of scattering raw SQL across order handlers.
- [Future partial fulfillment pressure] A two-stage model may need to grow if later flows support mixed committed and unassigned order items. -> Keep stage scoped to assignment rows so the model can evolve without reworking order lifecycle status again.

## Migration Plan

1. Add a new nullable order-assignment stage enum/column to `asset_assignments`.
2. Backfill existing `ORDER` rows by joining to `orders`:
   - `PENDING_REVIEW` -> `HOLD`
   - `CONFIRMED` / `ACTIVE` -> `COMMITTED`
   - terminal states should not retain rows after this change, but any legacy rows should be reviewed and mapped conservatively before constraints are enforced.
3. Add or update check constraints so:
   - `ORDER` rows require `source`, `order_id`, `order_item_id`, and `stage`
   - `BLACKOUT` and `MAINTENANCE` rows require `NULL` `source`, `order_id`, `order_item_id`, and `stage` according to existing rules
4. Update application code to write, update, and release assignments using the new stage field.
5. Deploy tests covering create/confirm/reject/expire/cancel semantics before relying on the new constraints in production.

Rollback strategy:

- If deployment fails before new code is active, drop the new constraints and column.
- If deployment fails after backfill, revert application code first, then remove the stage column once no code depends on it.

## Open Questions

- Whether legacy cancelled, rejected, or expired orders with lingering assignments already exist in non-test data and need a cleanup step during migration.
- Whether assignment release should be implemented as hard deletion or as a future soft-release pattern; this design assumes deletion to match current persistence behavior.
