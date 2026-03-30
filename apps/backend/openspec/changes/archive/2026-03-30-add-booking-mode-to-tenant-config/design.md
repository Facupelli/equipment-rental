## Context

Tenant config already acts as the backend source of truth for operator-managed rental settings, with values flowing through the tenant domain value object, shared schema package, persistence mapping, and the existing read/update endpoints. Booking mode is planned as a tenant-level policy in backlog work, but the current config model has no field for it, so downstream order workflows have nothing stable to read.

## Goals / Non-Goals

**Goals:**

- Add `bookingMode` to the tenant config contract with strict allowed values.
- Preserve current tenant config read/update flows instead of introducing a separate settings surface.
- Ensure defaulting works for new tenants and for persisted configs that predate the new field.

**Non-Goals:**

- Changing order submission behavior, order lifecycle states, or inventory assignment semantics.
- Adding request-to-book hold expiry settings in this change.
- Introducing a new tenant settings module or dedicated booking policy aggregate.

## Decisions

Use the existing tenant config object as the home for booking mode. This keeps booking policy tenant-scoped alongside other operator-managed rental settings and avoids splitting configuration across multiple APIs.

Represent `bookingMode` as a closed enum-like string union with `instant-book` and `request-to-book`. This matches the backlog terminology, keeps contracts portable across backend and web packages, and lets validation happen consistently in the domain value object and shared Zod schemas.

Default missing `bookingMode` values to `instant-book` at config construction boundaries. New tenants should receive the default automatically, and older persisted JSON configs should also be normalized when they are mapped back into the domain or returned through read models so the system does not depend on an immediate data migration.

Extend the existing tenant config update/read surfaces rather than adding new commands or controllers. The change is additive to a current settings capability, so reusing the same flow keeps the operator API stable and minimizes cross-module churn.

## Risks / Trade-offs

- Existing tenant config JSON may not include `bookingMode` -> Normalize missing values to `instant-book` in mapping/default paths and cover this with tests.
- Adding a new field to shared schemas affects backend and web consumers -> Update both response and patch schemas together so contracts stay aligned.
- Order flows may later require stronger typing around booking policy -> Start with a narrow config field now and evolve behavior-specific domain logic in later changes instead of over-designing this slice.
