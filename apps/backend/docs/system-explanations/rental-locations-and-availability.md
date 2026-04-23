# Rental Locations And Availability

This document explains how location context, assets, and assignments determine operational availability in the rental domain.

Related docs:

- `rental-domain-model.md` for the overview
- `rental-orders-and-fulfillment.md` for how booking mode and assignment stage consume availability
- `rental-pricing.md` for location-aware pricing context
- `tenant-context-resolution.md` for tenant and face resolution outside the rental domain itself

## Core Model

Availability is an asset-based model, not a quantity-column model.

- `Asset` is the physical unit that can fulfill a rental
- `Location` is the operational booking and fulfillment context
- `AssetAssignment` is the source of truth for physical reservation

That means a product is available only when enough qualifying assets exist without conflicting assignments for the requested period.

## Assets And Tracking Mode

Every rentable physical unit is an `Asset`.

An asset belongs to:

- one `ProductType`
- one `Location`
- optionally one `Owner`

`ProductType.trackingMode` controls how much individual identity matters:

- `IDENTIFIED` means the specific unit matters
- `POOLED` means units are operationally interchangeable for fulfillment purposes

Even for pooled products, the persistence model still uses concrete assets. Pooling changes how fulfillment is resolved, not the inventory primitive itself.

## Locations As Booking Context

`Location` is more than a storage place for assets. It is the operational context that determines:

- which assets can fulfill the booking
- which pickup and return slots are valid
- whether delivery is supported
- which effective timezone is used for booking-period interpretation
- whether location-specific pricing tiers apply

Catalog is tenant-scoped, but stock and operational fulfillment are location-scoped.

## Location Context

Most runtime flows work with a derived location context rather than just the persisted location row.

Important fields include:

- `supportsDelivery`
- `effectiveTimezone`
- `locationTimezone`
- `tenantTimezone`
- `timezoneSource`

The effective timezone may come from the location itself or fall back to the tenant timezone. This matters because booking periods and calendar views are interpreted in local operational time, not only in raw UTC timestamps.

For how tenant and face resolution happen before location context is used, see `tenant-context-resolution.md`.

## Schedules And Slot Types

Location schedules are bookable operational slots, not generic opening hours.

Each schedule row is typed as either:

- `PICKUP`
- `RETURN`

The system validates requested pickup and return times against those configured slots before creating an order.

## Delivery Capability

Delivery support is location-scoped.

- If a location does not support delivery, delivery bookings for that location are invalid.
- If it does support delivery, the location may store delivery defaults such as country, state/region, city, and postal code.

So location acts as both a stock base and a booking-policy boundary.

## Asset Assignments

`AssetAssignment` is the source of truth for physical availability.

An asset is unavailable for a requested period if it has any overlapping assignment in that period.

`AssignmentType` defines why an assignment exists:

- `ORDER`
- `BLACKOUT`
- `MAINTENANCE`

This is why assignments are broader than order fulfillment records. They are the single reservation primitive for physical availability.

## Overlap Protection

`AssetAssignment.period` is stored as PostgreSQL `tstzrange`.

The exclusion constraint on asset assignments ensures a single physical asset cannot be double-booked for overlapping periods.

Conceptually:

- `Order` expresses accepted demand
- `AssetAssignment` expresses blocked physical reality
