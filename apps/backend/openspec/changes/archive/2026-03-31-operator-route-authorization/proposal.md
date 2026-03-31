## Why

Many back-office routes are currently protected only by authentication, which means customer actors can still reach operator HTTP surfaces that were intended only for tenant staff. Epic 5 Slice 5.1 is the right point to close that gap and establish explicit tenant-wide permission checks before staff management and role-management capabilities expand the authorization model further.

## What Changes

- Harden launch-critical back-office HTTP endpoints so authenticated customers cannot access operator routes.
- Add explicit tenant-wide permission enforcement for launch-critical operator reads and writes instead of relying on authentication alone.
- Define a consistent authorization pipeline for operator routes based on authenticated user context, operator-only actor checks, and route-declared permission requirements.
- Update existing operator order lifecycle behavior so lifecycle actions require both operator identity and the appropriate operator permission.
- Update existing pending-review queue behavior so access to the review-oriented operator surface is authorization-aware.

## Capabilities

### New Capabilities

- `operator-route-authorization`: Defines operator-only route protection and tenant-wide permission enforcement for launch-critical back-office HTTP endpoints.

### Modified Capabilities

- `operator-order-lifecycle-actions`: Tightens lifecycle endpoint access from generic operator-only access to permission-gated operator access.
- `pending-review-bookings`: Tightens access to the pending-review operator view so only authorized operators can use it.

## Impact

- Affected code spans auth guards and decorators plus launch-critical controllers in order, customer, catalog, inventory, pricing, tenant, users, and billing-unit modules.
- Affected APIs are back-office HTTP endpoints that currently rely on JWT authentication without consistent operator-only or permission checks.
- No new external authorization library is introduced for this slice; the change builds on the existing JWT, actor-type, role, and permission model already present in the backend.
