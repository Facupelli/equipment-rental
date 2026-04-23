# Rental Domain Model

## Overview

This document explains the core rental concepts behind the backend domain model. Its goal is to give the mental model an engineer or agent needs before modifying catalog, inventory, availability, order, bundle, or pricing behavior.

The rental business is easier to understand if you keep four concerns separate:

- catalog: what the business offers for rent
- inventory: the physical units the business can fulfill with
- fulfillment: how a commercial commitment gets backed by actual units
- pricing: how duration and discounts turn into charged amounts

One additional distinction matters in the current model:

- booking mode controls whether a new order is accepted immediately or held for review
- assignment stage controls whether physical units are tentatively held or fully committed

---

## Core Mental Model

The most important distinction in the system is this:

- `ProductType` defines what can be rented
- `Asset` is a concrete physical unit of a product type
- `Order` is a commercial commitment to fulfill a rental
- `AssetAssignment` is the physical reservation or block that makes availability true or false

Orders express demand. Asset assignments express reserved physical reality.

These concepts are intentionally separate:

- an order can exist before any asset has been assigned
- an asset assignment can exist without an order, for example for blackout or maintenance
- a product type can exist in the catalog even if a location currently has zero available assets for it

---

## Catalog Model

### Tenant-scoped catalog

The catalog belongs to the tenant, not to an individual location.

- `ProductCategory` groups catalog items
- `ProductType` defines a rentable offering
- `BillingUnit` defines how duration is converted into billable units
- `Bundle` defines a sellable package of product types

Locations do not own a separate catalog. They own operational stock through assets.

### Product types

`ProductType` is the core catalog entity.

It answers questions like:

- what is this rentable thing called?
- what category does it belong to?
- how is it billed?
- is it tracked as individually identifiable units or interchangeable pooled units?

`ProductType` is a catalog definition. It is not a physical unit and it is not itself what gets assigned to an order.

### Billing units

`BillingUnit` is a system-level time unit such as hour, day, or week. Tenants activate the units they use through `TenantBillingUnit`.

Each `ProductType` and each `Bundle` chooses one billing unit. Duration is converted into billable units by dividing total minutes by the selected unit and rounding up.

### Bundles

`Bundle` is a tenant-scoped catalog offering composed of multiple product types.

`BundleComponent` is the composition table:

- one bundle
- many component product types
- each component has a `quantity`

That quantity is important: this is one of the few places where quantity exists explicitly in the data model. Inventory itself is still represented as assets, not as a stock count field.

---

## Inventory And Availability

### Assets are physical units

Every rentable physical unit is an `Asset`.

An asset belongs to:

- one `ProductType`
- one `Location`
- optionally one `Owner`

Important implication: availability is not computed from a quantity column. It is derived from whether enough assets exist with no conflicting assignment for the requested period.

### Tracking mode

`ProductType.trackingMode` tells the system how much individual identity matters.

- `IDENTIFIED` means the specific unit matters, usually because the item has a serial number or unique identity
- `POOLED` means units are operationally interchangeable for fulfillment purposes

Even for pooled products, the schema still uses concrete `Asset` records. Pooling changes assignment behavior, not the underlying inventory model.

### Locations

`Location` is the operational booking and fulfillment context for a rental.

Location-scoped behavior includes:

- assets belong to a location
- orders are placed against a location
- pricing tiers may optionally vary by location
- schedules define operational pickup and return windows
- delivery capability is configured per location
- timezone behavior is resolved through the location context

Catalog is tenant-scoped, but stock is location-specific because assets are location-specific.

### Location context

The persisted location record is only part of the story. The rest of the system usually works with a derived location context:

- `supportsDelivery` determines whether delivery bookings are allowed at that location
- `effectiveTimezone` is the timezone used for booking-period and calendar calculations
- the effective timezone may come from the location itself or fall back to the tenant timezone

That means location affects more than stock placement. It also affects whether a booking is valid and how local pickup and return times are interpreted.

### Schedules and slot types

Location schedules are not generic opening hours. They define bookable operational slots.

Each schedule row is typed as either:

- `PICKUP`
- `RETURN`

This matters because the system validates requested pickup and return times against the location's configured slots before creating an order.

### Delivery capability

Locations can opt into delivery fulfillment.

- if a location does not support delivery, delivery bookings for that location are invalid
- if a location does support delivery, delivery defaults such as country, state/region, city, and postal code can be stored on the location

So a location is both a stock base and a booking-policy boundary.

### Asset assignments are the source of truth

`AssetAssignment` is the source of truth for physical availability.

An asset is unavailable for a requested period if it has any overlapping assignment in that period.

### Assignment types

`AssignmentType` defines why an assignment exists:

- `ORDER` - assigned to fulfill a rental order
- `BLACKOUT` - admin-defined unavailability
- `MAINTENANCE` - internal maintenance block

This is why an assignment is broader than an order fulfillment record. It is the single primitive for reserving physical availability.

### Time and overlap protection

`AssetAssignment.period` is stored as PostgreSQL `tstzrange`.

That matters because the rental domain needs overlap-aware behavior at the database level. The exclusion constraint on asset assignments ensures a single physical asset cannot be double-booked for overlapping periods.

Conceptually:

- `Order` says the business accepted the rental
- `AssetAssignment` says a physical unit is blocked for that period

---

## Order And Fulfillment Model

### Orders are commercial commitments

`Order` represents the rental agreement the business accepted.

An order belongs to:

- one tenant
- one location
- optionally one customer

It contains `OrderItem[]`, one shared booking period, and booking metadata that preserves how the rental was requested.

The important shape is:

- one order has one rental period
- all order items share that order-level period
- an order may mix product items and bundle items
- the order stores a booking snapshot so the original local pickup and return details remain stable even if derived views change later

This is why the order is the commercial commitment boundary. Items describe what was bought, but the booking window belongs to the order as a whole.

### Order items

`OrderItem` is the line-level boundary between what the customer bought and how the system fulfills it.

Each order item is either:

- `PRODUCT`
- `BUNDLE`

An order item references either `productTypeId` or `bundleId`, and stores `priceSnapshot` so pricing remains historically correct even if catalog pricing changes later.

Asset assignments attach at the order-item level. That is important because one order may contain multiple independently fulfilled items.

For bundle items, fulfillment still expands into the component product types behind the bundle. The customer buys one bundle line, but physical fulfillment still happens through concrete assets.

### Booking snapshot and fulfillment method

Orders keep a booking snapshot that preserves the local booking inputs used at checkout:

- pickup date
- pickup time
- return date
- return time
- timezone used to interpret those values

Orders also carry a fulfillment method:

- `PICKUP`
- `DELIVERY`

If the order uses delivery, it also carries an `OrderDeliveryRequest` with the recipient and address details needed to fulfill that delivery.

### Order lifecycle

The current status model is:

- `PENDING_REVIEW`
- `CONFIRMED`
- `REJECTED`
- `EXPIRED`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

The initial status depends on tenant booking mode:

- `INSTANT_BOOK` creates the order as `CONFIRMED`
- `REQUEST_TO_BOOK` creates the order as `PENDING_REVIEW`

The valid transition shape is:

- `PENDING_REVIEW -> CONFIRMED | REJECTED | EXPIRED`
- `CONFIRMED -> ACTIVE | CANCELLED`
- `ACTIVE -> COMPLETED`

This reflects a workflow where review and acceptance may be separate from final operational execution.

### Assignment stage and fulfillment

Asset assignments are still the physical availability primitive, but the current model adds an assignment stage:

- `HOLD`
- `COMMITTED`

Assignment stage is driven by booking mode:

- request-to-book orders start with `HOLD` assignments while the booking is still pending review
- instant-book orders start with `COMMITTED` assignments because the booking is already accepted

Later lifecycle actions update the order and the physical reservation together:

- confirming a pending-review order promotes assignments from `HOLD` to `COMMITTED`
- rejecting or expiring a pending-review order releases held assignments
- cancelling a confirmed order releases committed assignments
- activating and completing an order do not create a new reservation primitive; they advance the lifecycle around already committed fulfillment

So the current fulfillment story is less about a generic "sourcing" state and more about whether physical reservations are tentative or committed.

### Assignment source

`AssignmentSource` records where fulfillment came from:

- `OWNED`
- `EXTERNAL`

This is still useful for procurement tracking and downstream financial logic, but it is secondary to the main availability model. The primary operational question is still whether the order's demand has matching asset assignments, and whether those assignments are held or committed.

---

## Bundle Booking Behavior

Bundles are sellable catalog objects, not special inventory entities.

That means:

- customers can rent a bundle as one order item
- the system still fulfills it using the component product types inside that bundle
- bundle booking eventually results in asset assignments against concrete assets

### Snapshotting

Bundles are snapshotted at booking time:

- `BundleSnapshot`
- `BundleSnapshotComponent`

This preserves the booked bundle composition and bundle-level price even if the catalog bundle definition changes later.

### Availability of a bundle

A bundle is only fulfillable if all required component quantities can be satisfied for the requested period.

So bundle availability is effectively an AND across all required component lines, each evaluated against real asset availability.

### Mixed orders are valid

An order may contain:

- a bundle item
- a standalone product item
- even a standalone product that also appears inside the bundle

This is valid. The order model does not treat those as mutually exclusive.

---

## Pricing Model

Pricing in the rental domain has three main layers:

- billing unit selection
- base price lookup
- discount rule evaluation

### Pricing tiers

`PricingTier` defines the base step-function price for a product type or bundle.

Important properties:

- it attaches either to `productTypeId` or `bundleId`
- it may optionally be location-specific through `locationId`
- it uses `fromUnit` / `toUnit` ranges to express duration bands

The mental model is: once the system knows the billable unit count, it resolves the matching tier and gets the base price.

### Promotions

`Promotion` defines discounts or adjustments that apply on top of the base price.

---

## Ownership And Revenue Sharing

Ownership is a secondary but important part of the rental model.

Not every asset is necessarily owned directly by the tenant. Assets may be associated with an `Owner`, and owner economics are defined through `OwnerContract`.

The short mental model is:

- `Owner` identifies the person or party who owns rentable assets
- `OwnerContract` defines how rental revenue is split for that owner or for a specific asset
- `OrderItemOwnerSplit` snapshots the financial split created when a concrete asset fulfills an order item

This is downstream of fulfillment:

- first the system decides which asset fulfills the rental
- then that chosen asset determines which owner contract applies
- then the system computes owner and rental-side shares for settlement

Ownership affects payouts and reporting, but it is not the primitive used to determine basic physical availability. Availability still comes from assets plus asset assignments.

---
