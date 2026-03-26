# Rental Domain Model

## Overview

This document explains the core rental concepts behind the backend domain model. Its goal is to give the mental model an engineer or agent needs before modifying catalog, inventory, availability, order, bundle, or pricing behavior.

The rental business is easier to understand if you keep four concerns separate:

- catalog: what the business offers for rent
- inventory: the physical units the business can fulfill with
- fulfillment: how a commercial commitment gets backed by actual units
- pricing: how duration and discounts turn into charged amounts

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

Important fields in the schema:

- `categoryId` - optional product categorization
- `billingUnitId` - required billing unit for pricing
- `trackingMode` - `IDENTIFIED` or `POOLED`
- `attributes` - structured product-specific data
- `includedItems` - descriptive included content shown to users

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

`Location` is an operational base where assets live and orders are fulfilled.

Location-scoped behavior includes:

- assets belong to a location
- orders are placed against a location
- pricing tiers may optionally vary by location
- schedules define operational pickup/return windows

Catalog is tenant-scoped, but stock is location-specific because assets are location-specific.

### Asset assignments are the source of truth

`AssetAssignment` is the source of truth for physical availability.

An asset is unavailable for a requested period if it has any overlapping assignment in that period.

Important fields:

- `assetId` - which physical unit is blocked or reserved
- `orderItemId` / `orderId` - which rental commitment it fulfills, if any
- `type` - why the asset is blocked
- `source` - whether fulfillment came from an owned or externally sourced asset
- `period` - the reserved time window stored as `tstzrange`

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

It contains `OrderItem[]` and moves through the fulfillment lifecycle.

### Order items

`OrderItem` is the line-level boundary between what the customer bought and how the system fulfills it.

Each order item is either:

- `PRODUCT`
- `BUNDLE`

An order item references either `productTypeId` or `bundleId`, and stores `priceSnapshot` so pricing remains historically correct even if catalog pricing changes later.

Asset assignments attach at the order-item level. That is important because one order may contain multiple independently fulfilled items.

### Order lifecycle

The schema status model is:

- `PENDING_SOURCING`
- `SOURCED`
- `CONFIRMED`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

This reflects a rental workflow where taking the order and sourcing physical equipment are separate concerns.

### Fulfillment paths

There are two important fulfillment paths:

- owned fulfillment: an available owned asset is assigned
- external fulfillment: the business accepts the order first and later fulfills it with externally sourced equipment

This is why an order may exist with no assignment yet. That is not necessarily a bug or overbooking. It can represent an intentional procurement-backed commitment.

### Assignment source

`AssignmentSource` records where fulfillment came from:

- `OWNED`
- `EXTERNAL`

This supports procurement tracking and later downstream financial logic.

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

### Billing units and duration

Each product type or bundle picks a `BillingUnit`.

Conceptually:

- rental period -> duration in minutes
- duration minutes / billing unit duration -> billable units
- partial units round up

This is why short overruns or partial days still bill as a full unit under the chosen unit system.

### Pricing tiers

`PricingTier` defines the base step-function price for a product type or bundle.

Important properties:

- it attaches either to `productTypeId` or `bundleId`
- it may optionally be location-specific through `locationId`
- it uses `fromUnit` / `toUnit` ranges to express duration bands

The mental model is: once the system knows the billable unit count, it resolves the matching tier and gets the base price.

### Pricing rules

`PricingRule` defines discounts or adjustments that apply on top of the base price.

Key dimensions:

- `type` - seasonal, volume, coupon, or customer-specific
- `scope` - order, product type, category, or bundle
- `priority`
- `stackable`
- `condition` and `effect` stored as JSON

Detailed coupon behavior is explained separately in `docs/system-explanations/coupon-discount-system.md`.

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

## Scope Boundaries

### Tenant-scoped concepts

These live at the tenant level:

- product categories
- product types
- bundles
- pricing rules
- tenant-enabled billing units
- owners

### Location-scoped concepts

These are operationally location-specific:

- assets
- orders
- schedules
- optional pricing tier overrides

Request-time tenant resolution is explained in `docs/system-explanations/tenant-context-resolution.md`.

---

## Common Misunderstandings

- `ProductType` is not a physical unit. `Asset` is the physical unit.
- `Order` is not the same thing as `AssetAssignment`. The order is the commitment; the assignment is the physical reservation.
- Bundles are catalog constructs, not special inventory entities.
- Availability is not a quantity field lookup. It is derived from whether enough assets exist without conflicting assignments.
- Query-side reads do not need to instantiate aggregates just to answer reporting or list-view questions.

---

## Entity Cheat Sheet

| Concept                        | Prisma model(s)                                 | Role                                       |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------ |
| Catalog grouping               | `ProductCategory`                               | Groups related product types               |
| Rentable catalog item          | `ProductType`                                   | Defines what can be rented                 |
| Physical rentable unit         | `Asset`                                         | Concrete inventory unit                    |
| Operational base               | `Location`                                      | Where assets live and orders are fulfilled |
| Time unit for pricing          | `BillingUnit`, `TenantBillingUnit`              | Controls billable duration units           |
| Sellable package               | `Bundle`, `BundleComponent`                     | Bundle of product types sold together      |
| Commercial commitment          | `Order`, `OrderItem`                            | Accepted rental and its line items         |
| Physical reservation/block     | `AssetAssignment`                               | Source of truth for availability           |
| Historical booked bundle state | `BundleSnapshot`, `BundleSnapshotComponent`     | Preserves booked bundle composition        |
| Base pricing                   | `PricingTier`                                   | Duration-based price lookup                |
| Discounting                    | `PricingRule`, `Coupon`, `CouponRedemption`     | Pricing adjustments and redemption control |
| Ownership economics            | `Owner`, `OwnerContract`, `OrderItemOwnerSplit` | Revenue sharing and payouts                |
