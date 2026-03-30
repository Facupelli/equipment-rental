## 1. Catalog Booking Eligibility

- [x] 1.1 Add catalog public booking-eligibility DTOs and API methods for product and bundle validation in customer-facing booking flows
- [x] 1.2 Implement catalog-side booking-eligibility reads that enforce published, non-retired, tenant-scoped, and location-context checks
- [x] 1.3 Update create-order item resolution to use catalog booking-eligibility contracts instead of raw existence-only metadata checks

## 2. Customer Booking Flow Guardrails

- [x] 2.1 Restrict customer-facing booking endpoints to authenticated customer actors
- [x] 2.2 Derive order customer identity from the authenticated customer context and remove or ignore caller-supplied customer identifiers in customer booking flows
- [x] 2.3 Add explicit booking-context validation so invalid tenant/location combinations fail before slot, pricing, or allocation work proceeds

## 3. Pricing Preview Alignment

- [x] 3.1 Update cart preview validation to apply the same catalog lifecycle and booking-context guardrails as order creation
- [x] 3.2 Normalize inactive-catalog and invalid-booking-context errors across cart preview and order creation controllers

## 4. Verification

- [x] 4.1 Add backend tests covering rejected customer booking attempts for unpublished or retired products and bundles
- [x] 4.2 Add backend tests covering forbidden non-customer access and customer identity spoofing attempts on customer booking endpoints
- [x] 4.3 Add backend tests covering invalid tenant/location booking context for cart preview and order creation
