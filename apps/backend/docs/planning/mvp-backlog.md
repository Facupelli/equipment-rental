# MVP Launch Backlog

## Purpose

This document is the source backlog for backend MVP launch work.

It is not a spec. It defines the launch scope, priorities, and execution slices that can later be promoted into `docs/specs/...` when a slice is selected for implementation.

Planning unit: slice.
Execution unit: agent-ready task.

---

## Terminology

- `booking mode` = the tenant-configurable policy that determines how customer-submitted bookings are accepted.
- `instant-book` = a customer booking is automatically accepted at submission time; the order becomes confirmed immediately and inventory is committed immediately.
- `request-to-book` = a customer booking is submitted for staff review; the order enters a pending review state immediately and inventory is held immediately; an operator later confirms or rejects the request.
- `temporary hold` = an inventory-blocking reservation created for a `request-to-book` order before staff review is completed.
- `committed assignment` = an inventory-blocking reservation attached to a confirmed booking.
- `hold expiry window` = the tenant-configurable amount of time a `request-to-book` temporary hold may remain pending review before the system expires it automatically.

---

## Launch Assumptions

- Product is a multi-tenant equipment rental SaaS.
- MVP includes both internal staff workflows and a light customer-facing booking experience.
- Customers can book immediately after signup.
- Customer profile data is collected through an existing follow-up form.
- Payments are not handled in-app for MVP; payment is handled by the rental business at pickup time.
- Booking behavior is tenant-configurable.

### Booking Policy

- Allowed booking mode values are `instant-book` and `request-to-book`.
- Default booking mode is `instant-book`.
- In `instant-book`, a customer booking is automatically confirmed and inventory is committed immediately.
- In `request-to-book`, a customer booking is created in a pending review state and inventory is held immediately.
- `request-to-book` does not support submission without an inventory hold.
- `request-to-book` holds auto-expire if not reviewed within a tenant-configured window.
- Default hold expiry is `24h`.
- When a pending request is rejected or expires, its temporary holds are released.
- Payments are not captured or authorized during either booking mode in MVP.

---

## Prioritization

- `P0` = must ship for MVP launch
- `P1` = strongly recommended before or immediately after launch
- `Later` = intentionally deferred beyond MVP

---

## P0 Epics

### Epic 1 - Rental Settings And Booking Policy ✅

#### Slice 1.1 - Define tenant rental settings model ✅

- Add tenant-configurable booking mode setting with allowed values `instant-book` and `request-to-book`.
- Add tenant-configurable hold-expiry setting used only for `request-to-book`.
- Default booking mode to `instant-book`.
- Default hold expiry to `24h`.
- Expose authenticated staff read/update API for rental settings.
- Validate allowed values, defaults, and tenant scoping.

#### Agent-ready tasks

- Add booking mode field to the tenant/rental settings model with allowed values `instant-book` and `request-to-book`.
- Add hold-expiry-hours field with `24h` defaulting rules.
- Define validation rules for invalid booking mode values and invalid expiry windows.
- Add request DTO and response DTO for reading/updating rental settings.
- Add command/query and controller flows for staff access.
- Add tests for defaults, validation, and tenant isolation.

### Epic 2 - Orders And Assignment Lifecycle

#### Slice 2.1 - Support pending-review bookings ✅

- Define order states for `pending_review`, `confirmed`, `rejected`, and `expired`.
- `pending_review` is used only for `request-to-book` submissions awaiting operator decision.
- `confirmed` is used for accepted bookings, including `instant-book` submissions.
- `rejected` is used when an staff declines a pending booking request.
- `expired` is used when a pending booking request passes its review window without operator action.
- Keep existing operational states aligned with pickup/return lifecycle.
- Add transition rules for admin review outcomes.

#### Agent-ready tasks

- Extend the order domain lifecycle to represent pending-review bookings.
- Add command handlers/controllers for confirm, reject, cancel, activate, and complete flows.
- Add response/query updates so order reads expose the new lifecycle states.
- Add tests for valid and invalid transitions.

#### Slice 2.2 - Distinguish temporary holds from committed fulfillment ✅

- Represent temporary customer-request holds separately from committed confirmed bookings.
- A temporary hold blocks availability while an order is in `pending_review`.
- A committed assignment blocks availability for a `confirmed` booking.
- Rejection and expiry release temporary holds.
- Cancellation releases committed assignments when appropriate.

#### Agent-ready tasks

- Add assignment semantics for temporary hold vs committed assignment.
- Update assignment persistence and mapping logic accordingly.
- Update availability checks to treat both as blocking.
- Add tests for overlap behavior and release behavior.

#### Slice 2.3 - Complete staff lifecycle actions

- Allow staff to confirm or reject pending booking requests.
- Allow staff to cancel confirmed bookings and release inventory.
- Allow staff to move confirmed orders into active/completed lifecycle states.

#### Agent-ready tasks

- Add confirm pending booking flow.
- Add reject pending booking flow with hold release.
- Add cancel confirmed booking flow with assignment release.
- Add activate/pickup flow.
- Add complete/return flow.

### Epic 3 - Hold Expiry Automation

#### Slice 3.1 - Expire stale pending requests

- Only `request-to-book` orders in `pending_review` are eligible for automatic expiry.
- Expire unreviewed temporary holds after the configured tenant window.
- Expiry must release all temporary holds linked to the expired order.
- Expiry processing must be safe to retry and must not double-release inventory.

#### Agent-ready tasks

- Add expiry timestamp derivation from tenant settings.
- Add query/service to find expired pending requests.
- Add command/process to expire the order and release holds.
- Add idempotency protections for repeated expiry runs.
- Add tests for expiry and release behavior.

#### Slice 3.2 - Staff visibility for expiring requests

- Show pending-review requests with expiry metadata.
- Support filtering by pending, expired, confirmed, and rejected review state.

#### Agent-ready tasks

- Extend order list queries with review-state filters.
- Include `expiresAt` and review-related metadata in read models.
- Add staff-facing pending review query coverage.

### Epic 4 - Availability And Storefront Integrity ✅

#### Slice 4.1 - Align availability with actual booking policy ✅

- Availability must consider both temporary holds and committed assignments.
- Bundle availability must respect component availability under the same rules.

#### Agent-ready tasks

- Update product availability logic to consider temporary holds.
- Update bundle/component availability logic to consider temporary holds.
- Add tests for overlapping holds, confirmed bookings, and mixed bundle/product cases.

#### Slice 4.2 - Make storefront availability period-aware ✅

- Customer-facing browse and booking flows should reflect requested period availability, not raw stock count.

#### Agent-ready tasks

- Replace stock-count style rental availability with requested-period availability in rental queries.
- Update storefront-facing query contracts/read models as needed.
- Add tests for date/location-sensitive availability results.

#### Slice 4.3 - Add booking guardrails ✅

- Prevent booking unpublished or retired catalog items in both booking modes.
- Prevent customer booking flows from bypassing booking policy rules.
- Validate booking context consistently across tenant, location, and catalog lifecycle state.

#### Agent-ready tasks

- Enforce published/non-retired product and bundle checks in booking resolution.
- Add validation coverage for invalid location/catalog combinations.
- Add tests for rejected booking attempts on inactive catalog items.

### Epic 5 - Staff Access Control And Staff Management

#### Slice 5.1 - Harden staff-only route protection ✅

- Staff endpoints must be inaccessible to customer actors.
- Role/permission enforcement must exist on launch-critical staff flows.

#### Agent-ready tasks

- Apply user-only access enforcement to staff routes.
- Add role/permission checks for launch-critical admin flows.
- Add tests ensuring customer actors cannot call staff endpoints.

#### Slice 5.2 - Expose staff user management

- Admins need to invite staff, list staff, and deactivate/reactivate staff users.

#### Agent-ready tasks

- Add invite staff user flow.
- Add accept invitation flow.
- Add list users flow.
- Add deactivate/reactivate user flow.

#### Slice 5.3 - Expose role management

- Admin need enough role control to manage launch usage safely.

#### Agent-ready tasks

- Add list roles flow.
- Add create/update role flow.
- Add assign/remove roles for users.
- Add tests for permission-sensitive flows.

### Epic 6 - Rental-Critical CRUD Completion

#### Slice 6.1 - Complete catalog lifecycle APIs ✅

- Finish update/delete coverage for product categories, product types, and bundles.

#### Agent-ready tasks

- Add update/delete product category flows.
- Add update/delete product type flows.
- Add update/delete bundle flows.
- Add tests for lifecycle constraints and tenant scoping.

#### Slice 6.2 - Complete inventory lifecycle APIs (missing reassign/unassign asset flow for existing bookings)

- Finish asset update/deactivate/delete behaviors and post-booking assignment changes.

#### Agent-ready tasks

- Add update asset flow. ✅
- Add deactivate/soft-delete asset flow. ✅
- Add reassign/unassign asset flow for existing bookings.
- Add tests for assignment safety and availability side effects.

#### Slice 6.3 - Complete pricing lifecycle APIs

- Finish pricing rule and coupon update/delete/activation coverage.

#### Agent-ready tasks

- Add update/delete pricing rule flows.
- Add activate/deactivate pricing rule flows.
- Add update/delete coupon flows.
- Add activate/deactivate coupon flows.

---

## P1 Epics

### Epic 7 - Operational Inventory Blocking

#### Slice 7.1 - Blackout blocking flows

- Support blackout assignments that block availability without an order.

#### Agent-ready tasks

- Add create blackout block flow.
- Add list/get blackout block flow.
- Add remove blackout block flow.

#### Slice 7.2 - Maintenance blocking flows

- Support maintenance assignments that block availability without an order.

#### Agent-ready tasks

- Add create maintenance block flow.
- Add list/get maintenance block flow.
- Add remove maintenance block flow.

### Epic 8 - Customer And Auth Hardening

#### Slice 8.1 - Complete auth lifecycle

- Add password lifecycle support and safer customer registration behavior.

#### Agent-ready tasks

- Add password reset flow.
- Add password change flow.
- Add duplicate-account error handling improvements.

#### Slice 8.2 - Strengthen customer-facing rental workflows

- Customer-facing reads should support the launch booking experience and operational follow-up.

#### Agent-ready tasks

- Add customer order history/status read flow.
- Ensure customer profile follow-up data is staff-visible where needed.

### Epic 9 - Tenant And Platform Hardening

#### Slice 9.1 - Tenant branding/domain management

- Complete the management surface for branding and custom-domain fields already implied by reads.

#### Agent-ready tasks

- Add update/read branding fields flow.
- Add update/read custom-domain fields flow.
- Add validation coverage for domain-related settings.

#### Slice 9.2 - Billing-unit safety

- Prevent configuration changes that would invalidate existing rental catalog or pricing data.

#### Agent-ready tasks

- Add protection against removing billing units still in use.
- Add tests for billing-unit sync safety.

---

## Later

### Epic 10 - Post-MVP Enhancements

- Advanced reporting and utilization dashboards
- Richer customer portal capabilities
- Accounting and payment integrations
- Delivery and dispatch workflows
- Deeper maintenance operations
- Additional operational analytics

---

## Spec Promotion Notes

When promoting a slice into `docs/specs/...`, the resulting spec should explicitly restate:

- the booking mode behavior it touches
- the relevant order states
- the relevant assignment semantics
- any expiry or release behavior
- tenant and actor authorization expectations

---

## Promotion Rule To Specs

A slice should be promoted into `docs/specs/...` when all of the following are true:

- It has been selected for active implementation.
- Its scope is fixed.
- Acceptance criteria are explicit.
- Cross-module design decisions are resolved.
- Verification steps are known.

Specs should reference the slice they implement. Specs should cover a selected slice, not this full backlog.

---

## Recommended Execution Order

1. Epic 1 - Rental settings and booking policy
2. Epic 2 - Orders and assignment lifecycle
3. Epic 3 - Hold expiry automation
4. Epic 4 - Availability and storefront integrity
5. Epic 5 - Staff access control and admin staff management
6. Epic 6 - Rental-critical CRUD completion
7. Epic 7+ - hardening and follow-up
