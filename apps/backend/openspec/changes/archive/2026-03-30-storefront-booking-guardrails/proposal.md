## Why

Customer-facing booking flows still rely on entity existence and pricing resolution more than on storefront eligibility rules. That leaves room for unpublished or retired catalog items, invalid location/catalog combinations, and customer booking requests with mismatched actor context to slip past the intended guardrails.

## What Changes

- Enforce storefront booking guardrails for customer booking and cart-preview flows so unpublished or retired products and bundles cannot be priced or booked.
- Validate booking context consistently across tenant, location, and catalog lifecycle state before pricing or order creation proceeds.
- Bind customer booking behavior to the authenticated customer context so customer-facing flows cannot bypass booking-policy expectations by supplying arbitrary request data.

## Capabilities

### New Capabilities

- `storefront-booking-guardrails`: Defines the catalog lifecycle, location-context, and authenticated-customer validation rules that customer-facing pricing and booking flows must enforce.

### Modified Capabilities

- None.

## Impact

- Affects customer-facing order creation and cart price preview APIs.
- Affects catalog public read contracts used during booking resolution.
- Affects pricing read flows that currently price by raw entity existence rather than storefront booking eligibility.
- Affects error handling for rejected customer booking attempts caused by inactive catalog items or invalid booking context.
