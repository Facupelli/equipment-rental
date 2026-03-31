## 1. Authorization Infrastructure

- [x] 1.1 Add route-level actor and permission metadata contracts for staff and customer endpoints.
- [x] 1.2 Implement tenant-wide permission resolution for authenticated staff actors from persisted role assignments.
- [x] 1.3 Implement a global actor-type guard and a global permission guard that both no-op when their route metadata is absent and return `403 Forbidden` when authorization fails.
- [x] 1.4 Add a thin `StaffRoute(...)` decorator that applies staff-only actor metadata and required permission metadata without hiding unrelated transport behavior.

## 2. Staff Route Hardening

- [x] 2.1 Remove repeated auth guard provider registration from feature modules and centralize authorization as a shared/core concern.
- [x] 2.2 Replace repeated controller `@UseGuards(...)` authorization wiring on launch-critical staff routes with `StaffRoute(...)` or equivalent explicit metadata.
- [x] 2.3 Apply route-declared permissions to launch-critical order, customer, catalog, inventory, pricing, tenant, and billing-unit staff endpoints.
- [x] 2.4 Update staff lifecycle and pending-review endpoints so they enforce both staff actor type and the required order permission.
- [x] 2.5 Keep intentionally actor-only staff self-context routes limited to staff actor metadata without adding unnecessary permission requirements.
- [x] 2.6 Keep customer-only storefront routes expressed through explicit customer actor metadata so the global actor guard preserves storefront behavior.

## 3. Verification Coverage

- [x] 3.1 Add HTTP integration tests proving customer actors receive `403 Forbidden` on representative launch-critical staff read and mutation endpoints.
- [x] 3.2 Add HTTP integration tests proving staff users without the required permission receive `403 Forbidden` on representative launch-critical staff read and mutation endpoints.
- [x] 3.3 Update existing staff lifecycle and pending-review HTTP integration coverage to reflect permission-gated staff access.
- [x] 3.4 Verify customer-only endpoints still behave correctly under the new global actor guard model.

## 4. Readiness Checks

- [x] 4.1 Verify tenant admin users remain authorized through existing persisted admin role permissions.
- [x] 4.2 Run the relevant backend test suites for the changed authorization surface and fix any failures.
