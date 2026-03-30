## Why

Pending-review bookings currently block inventory using the same order assignment semantics as confirmed bookings, so the system cannot distinguish a temporary review hold from committed fulfillment. This creates a mismatch between order lifecycle meaning and inventory behavior, and it prevents rejection, expiry, and cancellation flows from releasing inventory according to the booking outcome.

## What Changes

- Distinguish order-backed inventory assignments by stage so temporary holds and committed fulfillment remain separate concepts.
- Require pending-review orders to create blocking order holds, while confirmed bookings use committed order assignments.
- Require lifecycle actions to convert or release order-backed assignments based on the order outcome.
- Keep both hold and committed order assignments availability-blocking while they are active.

## Capabilities

### New Capabilities

### Modified Capabilities

- `pending-review-bookings`: Change booking persistence rules so pending-review submissions create temporary blocking holds rather than committed fulfillment assignments.
- `operator-order-lifecycle-actions`: Change lifecycle behavior so confirm converts holds to committed assignments, while reject, expire, and cancel release order-backed assignments when appropriate.

## Impact

- Affects inventory assignment schema, persistence rules, and availability queries.
- Affects order creation and order lifecycle command handlers for confirm, reject, expire, and cancel.
- Affects raw SQL constraints and mappings around `asset_assignments`.
- Requires test coverage for assignment-stage blocking and release behavior.
