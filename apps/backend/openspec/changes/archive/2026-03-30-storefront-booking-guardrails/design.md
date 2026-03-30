## Context

Customer-facing pricing and booking flows currently diverge from storefront eligibility rules. Storefront rental queries already exclude unpublished or retired catalog items and evaluate availability against the requested location and period, but cart preview and order creation still rely mainly on raw entity existence, pricing metadata, and schedule validation.

This change crosses the catalog, pricing, order, auth, and tenant-location boundaries. It must preserve existing module boundaries by reusing public contracts instead of introducing cross-module imports from private internals. It also affects customer-facing request validation and therefore needs a consistent failure model for inactive catalog items, invalid location context, and authenticated customer enforcement.

## Goals / Non-Goals

**Goals:**

- Make customer-facing cart preview and order creation enforce the same catalog lifecycle rules as storefront browse flows.
- Ensure booking context validation consistently covers tenant, location, and catalog eligibility before pricing or order creation proceeds.
- Bind customer booking requests to the authenticated customer actor rather than trusting arbitrary request-body customer identifiers.
- Keep the implementation aligned with existing public API and CQRS boundaries.

**Non-Goals:**

- Rework operator-facing order creation or admin catalog flows.
- Change booking mode behavior itself beyond enforcing the existing policy in customer-facing flows.
- Add new persistence models or database migrations.
- Expand storefront availability semantics beyond what is already covered by `storefront-availability`.

## Decisions

### Reuse catalog-owned eligibility as the source of truth

Customer booking flows should not duplicate ad hoc lifecycle checks in order and pricing modules. The catalog module already owns publish/retire semantics, so booking-time validation should consume catalog-owned metadata through its public API.

Rationale:

- Keeps lifecycle ownership in the catalog bounded context.
- Avoids drift between storefront browse rules and booking rules.
- Preserves the architecture rule that modules communicate through explicit public surfaces.

Alternative considered:

- Query product and bundle lifecycle directly from order/pricing with local Prisma reads. Rejected because it duplicates catalog rules and weakens module boundaries.

### Introduce an explicit booking-eligibility read contract instead of overloading storefront query handlers

The existing storefront browse queries are list-oriented and optimized for browse read models. Booking flows need a narrower validation contract for one product or bundle at a time, including lifecycle and tenant-scoped eligibility details needed during pricing and order creation.

Rationale:

- Keeps booking validation focused and reusable.
- Avoids coupling booking flows to storefront list read models.
- Makes catalog lifecycle checks available to both cart preview and order creation through a single contract.

Alternative considered:

- Reuse `getProductTypeOrderMeta` and `getBundleOrderMeta` and add more fields there. Rejected because those methods are currently order-resolution metadata helpers, not explicit booking guardrail contracts.

### Validate booking context in layers, not in one monolithic guard

Actor validation, location validation, and catalog eligibility should happen in the layer that owns each concern:

- auth layer enforces customer-only access for customer-facing booking endpoints
- application layer validates tenant/location context before pricing or booking proceeds
- catalog public API validates product and bundle lifecycle eligibility

Rationale:

- Matches existing responsibility boundaries.
- Produces clearer failure reasons.
- Prevents overloading a Nest guard with business validation it should not own.

Alternative considered:

- Implement a single transport guard for all booking validation. Rejected because lifecycle and location checks are business/application concerns, not just transport authorization.

### Derive the booking customer from authentication context for customer flows

Customer-facing order creation should use the authenticated customer identity instead of trusting a request-body `customerId`. The transport contract may need to stop accepting that field for customer flows or ignore it server-side.

Rationale:

- Prevents customer spoofing across accounts.
- Aligns booking ownership with the authenticated actor.
- Makes booking policy enforcement depend on session context rather than caller-supplied identifiers.

Alternative considered:

- Keep `customerId` in the request body and validate equality with the authenticated user. Rejected because it preserves unnecessary mutable input for a value the server already knows.

### Keep pricing preview and order creation behavior aligned

Cart preview and order creation should reject the same inactive catalog items and invalid location context so the preview path cannot present a rentable state that the order path later rejects for eligibility reasons alone.

Rationale:

- Reduces customer confusion.
- Prevents pricing endpoints from becoming a bypass around storefront guardrails.
- Makes customer-facing flow behavior internally consistent.

Alternative considered:

- Enforce guardrails only in order creation. Rejected because it leaves preview behavior inconsistent and allows inactive items to be priced.

## Risks / Trade-offs

- [Guardrail checks broaden catalog public contracts] -> Mitigate by introducing narrowly named booking-eligibility DTOs rather than leaking persistence-shaped fields.
- [Changing customer identity handling may require web contract updates] -> Mitigate by coordinating schema and frontend request changes together and keeping the server backward-safe during rollout if needed.
- [Different endpoints may return different error shapes for similar eligibility failures] -> Mitigate by defining a small set of booking-context and inactive-catalog error cases up front and using them consistently in pricing/order controllers.
- [Location validation may overlap with existing schedule-slot validation] -> Mitigate by validating location context earlier so slot errors remain about schedule availability, not missing or foreign locations.
