## Context

Booking-time allocation already uses inventory availability semantics where any overlapping assignment blocks the asset while the row exists. That includes `ORDER` assignments in both `HOLD` and `COMMITTED` stages, plus non-order blocking assignments such as blackout and maintenance.

Storefront catalog reads do not currently inherit those semantics consistently. Product rental reads expose `availableCount` based on raw active asset counts at a location, and rental bundle reads present bundle data without deriving fulfillment from component availability. As a result, customer-facing availability can disagree with operator-facing allocation behavior even when they refer to the same inventory pool.

This change is intentionally narrow. It aligns storefront/catalog availability semantics with the booking policy already used during allocation, scoped to the storefront reads that already present availability-like data. Because `availableCount` is meant to represent fulfillable inventory rather than raw stock, storefront reads must evaluate blocking assignments for the rental period requested by the user instead of using a server-defined window.

## Goals / Non-Goals

**Goals:**

- Make storefront product availability reflect the same blocking semantics already enforced by inventory availability reads.
- Make storefront bundle availability derive from component-level blocking under the same semantics.
- Preserve blackout and maintenance blocking behavior in storefront availability results.
- Centralize blocking semantics in inventory-owned read logic instead of duplicating stage rules in catalog queries.
- Evaluate storefront availability for a user-requested rental period supplied through storefront query params.

**Non-Goals:**

- Refactoring admin, schedule, calendar, or customer-detail read models.
- Adding new catalog query integration coverage in this slice.
- Changing assignment lifecycle rules or order status transitions.

## Decisions

### Reuse inventory availability as the semantic source of truth through a public query contract

Storefront reads will consume inventory-owned availability behavior through a public query contract rather than reimplementing `HOLD` versus `COMMITTED` rules inside catalog query handlers or calling inventory services directly.

- Why: the inventory read service already encodes the required blocking semantics and is covered by tests for overlapping `HOLD`, overlapping `COMMITTED`, blackout, and maintenance cases.
- Why: `architecture.md` allows cross-module reads through explicit public query contracts, while direct module-to-module service wiring introduces an avoidable circular dependency between catalog and inventory.
- Alternative considered: recompute blocking inside each catalog query with Prisma counts or raw SQL. Rejected because it would duplicate business semantics, increase drift risk, and make bundles harder to keep consistent with products.
- Alternative considered: inject `InventoryPublicApi` into catalog query handlers. Rejected because it couples the modules in the wrong direction for a read concern and creates circular-dependency pressure.

### Interpret storefront availability as currently fulfillable inventory, not raw stock

Existing storefront fields that imply availability, especially product `availableCount`, should represent unblocked fulfillable assets under current booking policy rather than total active assets.

- Why: the storefront currently uses availability-like naming while returning stock-like values, which is the source of the semantic mismatch.
- Alternative considered: keep raw counts and only rename fields later. Rejected for this slice because the requirement is semantic alignment, not documentation of the mismatch.

### Evaluate storefront availability for the requested rental period

Storefront availability reads must use the rental period supplied by the requester. The implementation must not invent a synthetic server-side window such as "right now" when computing `availableCount` or bundle fulfillability.

- Why: availability depends on overlap with assignment periods, so the result is only meaningful relative to the customer's requested period.
- Why: using a server-generated window silently changes the endpoint contract and can disagree with the period the customer is actually shopping for.
- Alternative considered: keep storefront queries period-agnostic and evaluate availability against a synthetic current window. Rejected because it produces misleading `availableCount` values while still presenting them as fulfillable availability.

### Derive bundle availability from component satisfiability

Bundle storefront reads should be computed from whether each component product type can satisfy its required quantity under the same blocking rules used for standalone products.

- Why: bundles are only fulfillable when all required component quantities are fulfillable, and this is already how booking-time allocation reasons about bundles.
- Alternative considered: leave bundle reads as descriptive-only and defer availability consistency to a later slice. Rejected because it would keep storefront bundles out of sync with storefront products and with booking-time allocation.

### Batch availability counts across product types when crossing the module boundary

The inventory public query contract should support batched availability counts for multiple product types within one requested period and location so storefront product and bundle reads can stay efficient.

- Why: catalog list and bundle endpoints often need counts for many product types at once.
- Why: batching preserves the clean module boundary without creating an avoidable N+1 query pattern through the public query contract.
- Alternative considered: one public query per product type. Rejected because it keeps the architecture cleaner than a circular dependency but still scales poorly for storefront lists and bundle composition checks.

## Risks / Trade-offs

- [Risk] Storefront endpoints may become more expensive if they need per-product or per-component availability resolution. -> Mitigation: expose batched availability counts through an inventory public query contract rather than issuing one query per product type.
- [Risk] Product and bundle responses may still mix availability and stock semantics if adjacent read models remain unchanged. -> Mitigation: constrain this change to storefront-facing queries and document broader raw-stock reads as follow-up work.
- [Risk] Bundle availability can drift if component checks do not use the same availability source as standalone products. -> Mitigation: derive bundle results from the same inventory public query contract used for storefront product counts.
- [Risk] Omitting new storefront query integration coverage reduces direct regression protection. -> Mitigation: rely on existing inventory availability coverage for the blocking semantics and keep the implementation narrow enough to review carefully.
