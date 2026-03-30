## Why

Storefront catalog availability still behaves like raw stock in places, even though booking-time allocation already treats both `ORDER/HOLD` and `ORDER/COMMITTED` assignments as blocking. This creates a semantic mismatch where customer-facing availability can disagree with operator-facing allocation and bundle component blocking rules.

## What Changes

- Align storefront product availability reads with the existing booking policy so overlapping `ORDER/HOLD` and `ORDER/COMMITTED` assignments both reduce availability.
- Align storefront bundle availability reads with the same blocking semantics by deriving bundle availability from component-level availability.
- Preserve existing blackout and maintenance blocking behavior anywhere availability is presented through these storefront reads.
- Keep this slice focused on storefront/catalog availability semantics and exclude broader admin or schedule read-model cleanup.
- Do not add new catalog query integration coverage in this change.

## Capabilities

### New Capabilities

- `storefront-availability`: Defines how storefront-facing product and bundle availability reads must reflect inventory-blocking assignment stages and component-level blocking.

### Modified Capabilities

- `pending-review-bookings`: Clarify that the booking policy established by hold and committed assignments must remain consistent with storefront-facing availability semantics.

## Impact

- Affected backend code in `src/modules/catalog/application/queries/get-rental-product-types/` and `src/modules/catalog/application/queries/get-rental-bundles/`.
- Depends on existing inventory availability semantics in `src/modules/inventory/infrastructure/read-services/asset-availability.service.ts`.
- May affect storefront API response semantics and any web UI behavior that currently interprets raw stock as availability.
