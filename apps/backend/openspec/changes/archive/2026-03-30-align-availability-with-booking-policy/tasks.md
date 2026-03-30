## 1. Product Availability Alignment

- [x] 1.1 Extend storefront rental product query inputs to require the user-requested rental period needed to evaluate availability.
- [x] 1.2 Update storefront product availability reads to derive `availableCount` for the requested period from inventory-blocking availability semantics instead of raw active asset counts.
- [x] 1.3 Ensure storefront product availability treats overlapping `ORDER/HOLD`, `ORDER/COMMITTED`, `BLACKOUT`, and `MAINTENANCE` assignments as blocking through the shared inventory availability path.

## 2. Bundle Availability Alignment

- [x] 2.1 Extend storefront rental bundle query inputs to require the same user-requested rental period used for product availability.
- [x] 2.2 Update storefront bundle availability reads to derive bundle fulfillability for the requested period from component-level availability under the shared blocking semantics.
- [x] 2.3 Ensure bundle presentation stays consistent with component requirements so bundles are not presented as available when any required component quantity cannot be satisfied.

## 3. Cross-Module Availability Contract

- [x] 3.1 Introduce an inventory public query contract that returns batched available-asset counts for product types within a requested location and rental period.
- [x] 3.2 Update catalog storefront queries to consume that inventory public query contract without introducing a circular dependency between catalog and inventory modules.

## 4. API Contract Consistency

- [x] 4.1 Review storefront rental query response fields and keep availability-like fields semantically aligned with fulfillable inventory rather than raw stock.
- [x] 4.2 Verify storefront availability behavior remains aligned with operator-facing allocation semantics for the requested rental period.
