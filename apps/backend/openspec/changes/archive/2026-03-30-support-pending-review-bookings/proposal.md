## Why

The current order lifecycle is built around sourcing states and does not support tenant-configurable pending review bookings. We need to align order behavior with MVP booking policy now so `instant-book` and `request-to-book` create the right order states, operator review outcomes are explicit, and downstream availability and expiry work can build on a stable lifecycle.

## What Changes

- Replace the sourcing-first order lifecycle with a booking-review lifecycle that supports `PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `ACTIVE`, `COMPLETED`, and `CANCELLED`.
- Create `PENDING_REVIEW` orders for `request-to-book` submissions and `CONFIRMED` orders for `instant-book` submissions.
- Add explicit operator lifecycle actions for confirming, rejecting, cancelling, activating, and completing orders under the new transition rules.
- Update order reads and operator-facing order views so they expose and correctly filter the new lifecycle states.
- **BREAKING** Remove `PENDING_SOURCING` and `SOURCED` as order lifecycle states and replace them with booking-review states.
- Keep `CANCELLED` available only for confirmed bookings; use `REJECTED` and `EXPIRED` for pending-review outcomes.

## Capabilities

### New Capabilities

- `pending-review-bookings`: Support tenant-aware order creation and lifecycle transitions for pending-review and instant-book bookings.
- `operator-order-lifecycle-actions`: Support operator review and fulfillment actions for confirming, rejecting, cancelling, activating, and completing orders.

### Modified Capabilities

- None.

## Impact

- Affects `prisma/schema.prisma` order status definitions and generated enum consumers.
- Affects the order domain, command handlers, controllers, repositories, and query handlers under `src/modules/order/`.
- Affects booking-mode-aware order creation through tenant config reads in `src/modules/tenant/`.
- Affects inventory reservation semantics indirectly by keeping immediate assignment creation compatible with pending-review bookings.
- Changes API responses and filtering behavior for operator order reads, schedule views, and calendar views.
