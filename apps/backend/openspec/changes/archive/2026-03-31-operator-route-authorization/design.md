## Context

The backend already authenticates all non-public routes through a global JWT guard and already distinguishes tenant staff users from customers through actor type in the JWT context. The gap is that many launch-critical back-office controllers still rely on authentication alone, so an authenticated customer token can reach staff-only endpoints unless the controller opts into an actor guard.

The codebase also already has a role and permission model. Permissions are persisted through `Role`, `RolePermission`, and `UserRole`, and tenant admin bootstrap assigns every current permission to the default tenant admin role. What is missing is a consistent HTTP authorization layer that turns those persisted permissions into route-level enforcement.

This change is cross-cutting because it touches auth infrastructure plus launch-critical controllers across order, customer, catalog, inventory, pricing, tenant, users, and billing-unit modules. It also sets the baseline for Epic 5 without introducing staff invitation, role management UX, location-scoped enforcement, or a new authorization framework.

## Goals / Non-Goals

**Goals:**

- Prevent customer actors from accessing launch-critical staff HTTP endpoints.
- Introduce explicit tenant-wide permission enforcement for launch-critical staff reads and writes.
- Standardize staff route authorization around a small, explicit controller-layer contract.
- Reuse the existing role and permission model so current tenant admins remain authorized after the change.
- Keep the design compatible with future evolution toward scoped or richer authorization rules.

**Non-Goals:**

- Introducing location-scoped authorization in this slice.
- Replacing the current role and permission data model.
- Encoding permissions into JWT claims.
- Adopting CASL or another external authorization library.
- Delivering staff invitation, role CRUD, or role assignment management.

## Decisions

### Use a metadata-driven global authorization pipeline

Staff and customer routes will continue to rely on the global JWT guard for authentication, then use metadata-driven global guards for actor enforcement and permission enforcement. Controller methods will declare intent through route metadata rather than registering auth guards in each feature module.

The target pipeline is:

- global `JwtAuthGuard`
- global actor-type guard that enforces route actor metadata and no-ops when no actor metadata is present
- global permissions guard that enforces route permission metadata and no-ops when no permission metadata is present

The preferred controller contract for staff endpoints is a thin `StaffRoute(...)` decorator that applies staff-only actor metadata plus required permission metadata. Customer-only endpoints will continue to declare customer actor metadata explicitly.

Rationale:

- It fits the current architecture, where cross-cutting concerns are already centralized through global Nest providers such as `APP_GUARD` and `APP_INTERCEPTOR`.
- It keeps authorization explicit at the controller boundary through metadata while avoiding repeated guard provider registration in mixed-surface feature modules.
- It aligns with the existing `@Public()` style and preserves clear transport-layer access rules before commands and queries execute.

Alternatives considered:

- Per-module guard providers plus repeated `@UseGuards(...)`: rejected because authorization is cross-cutting and this approach leaks auth infrastructure into every module.
- Handler-level permission checks: rejected because it hides route authorization in business orchestration and makes HTTP denial behavior less uniform.

### Resolve effective permissions from persisted roles at request time

The new permission guard will evaluate permissions for authenticated `USER` actors by loading the user's assigned roles and flattening them into an effective tenant-wide permission set. Effective permissions are the union of permissions granted by the user's active role assignments for the tenant.

Rationale:

- It uses the source of truth that already exists in the database.
- Permission changes take effect without forcing token reissue.
- The current JWT payload intentionally remains small and actor-focused.

Alternatives considered:

- Embedding permissions in JWT claims: rejected because permissions would become stale until token refresh and would complicate future staff permission changes.
- Session-side caching as the primary design: rejected for this slice because it adds invalidation complexity before the access model is stable.

### Keep Slice 5.1 permission checks tenant-wide only

Although `UserRole` already supports `locationId`, this slice will ignore location scoping for authorization decisions. A user either has a required permission for the tenant or does not.

Rationale:

- This matches the agreed scope for Slice 5.1.
- It closes the largest security gap quickly without introducing effective-scope logic into every route.
- It keeps the permission contract simple enough to spec, implement, and test before Epic 5.2 and 5.3 expand staff management behavior.

Alternatives considered:

- Enforcing location-scoped permissions immediately: rejected because it would pull this slice into unresolved design questions about route context, query filtering, and mixed tenant-wide vs location-bound permissions.

### Use explicit route-declared permissions for launch-critical staff flows

Launch-critical back-office routes will declare required permissions directly at the controller method or controller class level through metadata. Staff-only routes should prefer the `StaffRoute(...)` decorator where possible. Routes that are staff-only but not permission-sensitive in this slice, such as authenticated staff self-context reads, may declare only staff actor metadata.

The initial permission map will cover:

- orders review and lifecycle flows
- order review-oriented and operational reads
- customer back-office reads
- catalog back-office reads and mutations
- inventory back-office reads and mutations
- pricing back-office reads and mutations
- tenant configuration, owners, locations, and billing-unit management surfaces

Rationale:

- Explicit metadata keeps the permission model readable and testable.
- The route contract remains coarse-grained and stable even if internal handlers change.
- This preserves a small migration path to a richer authorization engine later because the controller contract remains declarative.

Alternatives considered:

- Infer permissions from route naming or command class naming: rejected because it is brittle and obscures intent.

### Do not adopt CASL in this slice

CASL is a credible future option for location-scoped, record-level, and query-filtered authorization, but this slice only needs tenant-wide route-level RBAC. A custom permission decorator and guard pair is the simpler and lower-risk fit.

Rationale:

- The current problem is coarse-grained route authorization, not ABAC.
- The repository already has a permission enum and role persistence model that map directly to a simple guard.
- Avoiding a new dependency reduces concept count while the authorization surface is still stabilizing.

Alternatives considered:

- Adopt CASL now: rejected for this slice because it adds abstraction and integration overhead without solving an immediate requirement that the simpler approach cannot handle.

## Risks / Trade-offs

- [Permission map drift across modules] -> Mitigation: define the launch-critical routes and their required permissions explicitly in the spec and cover them with HTTP integration tests.
- [Per-request permission resolution adds query overhead] -> Mitigation: keep the first implementation simple and focused on launch-critical routes; optimize with caching only if measurements justify it.
- [Tenant-wide permission checks may authorize more broadly than future staff policy intends] -> Mitigation: document location scoping as a deliberate non-goal and keep the guard contract extensible.
- [Controllers may still be missed during rollout] -> Mitigation: enumerate the targeted staff surfaces in the spec and verify denial behavior through representative integration coverage.
- [Existing operator specs may assume actor-only access] -> Mitigation: update those capability specs in the same change so authorization expectations stay coherent.

## Migration Plan

1. Add the new metadata-driven authorization contract and apply it to launch-critical staff controllers.
2. Keep tenant admin fully functional by resolving permissions from existing admin role assignments.
3. Add HTTP integration coverage for customer-denied and permission-denied operator requests.
4. Deploy without data migration because the role and permission tables already exist.
5. If rollback is required, remove the new global actor/permission guard wiring while leaving persisted role data unchanged.

## Open Questions

- None for Slice 5.1. Tenant-wide permission evaluation, no CASL adoption, and launch-critical route targeting are all resolved for this change.
