## Why

Tenant configuration currently exposes pricing, timezone, and catalog-related settings, but it does not store the booking acceptance policy that upcoming booking workflows need. Adding booking mode now gives the platform a single tenant-scoped source of truth before order lifecycle rules begin depending on it.

## What Changes

- Add a tenant-configurable `bookingMode` setting to tenant config with allowed values `instant-book` and `request-to-book`.
- Default new and existing tenant configs to `instant-book` when no booking mode has been set.
- Expose `bookingMode` through the existing tenant config read and update contracts used by operator settings flows.
- Validate invalid booking mode updates consistently across domain, API schema, and persistence boundaries.

## Capabilities

### New Capabilities

- `tenant-booking-mode-config`: Tenant-scoped rental setting that stores, returns, and updates the booking acceptance mode.

### Modified Capabilities

## Impact

- Affected backend tenant config domain model, command/query flows, persistence mapping, and defaults.
- Affected shared tenant config schemas consumed by backend and web settings forms.
- Creates the configuration contract that future order submission logic can read when deciding between instant confirmation and request review flows.
