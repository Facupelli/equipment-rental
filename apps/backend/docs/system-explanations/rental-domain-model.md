# Rental Domain Model

## Overview

This document is the overview of the rental domain model. Its goal is to give the mental model an engineer or agent needs before modifying catalog, inventory, availability, order, bundle, or pricing behavior.

Use this file to orient first, then load the focused docs that match the change:

- `rental-locations-and-availability.md`
- `rental-orders-and-fulfillment.md`
- `rental-pricing.md`
- `rental-ownership-and-payouts.md`

Related subsystem docs:

- `tenant-context-resolution.md` for hostname and tenant context resolution
- `user-customer-auth.md` for user/customer identity boundaries around admin and portal flows

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

Catalog concepts are summarized here because they frame the rest of the rental model, but the operational mechanics now live in the focused docs below.

---

## Inventory And Availability

Availability is an asset-based model, not a stock-count model.

Short summary:

- every rentable physical unit is an `Asset`
- assets belong to a `ProductType` and a `Location`, and may also belong to an `Owner`
- pooled versus identified tracking changes fulfillment behavior, not the underlying inventory primitive
- `AssetAssignment` is the physical source of truth for availability
- locations provide operational context such as schedules, delivery capability, and effective timezone

Load `rental-locations-and-availability.md` for the operational details.

---

## Order And Fulfillment Model

Orders are commercial commitments with one shared booking period.

Short summary:

- one order has one booking window and many `OrderItem`s
- order items may be product or bundle lines
- orders preserve booking snapshot details and fulfillment method
- booking mode controls whether a new order starts in review or as accepted
- assignment stage controls whether physical reservations are tentative (`HOLD`) or committed (`COMMITTED`)
- assignment source is still relevant, but it is secondary to assignment stage in the current operational model

Load `rental-orders-and-fulfillment.md` for lifecycle, booking mode, assignment stage, and delivery details.

---

## Bundle Booking Behavior

Bundles are catalog sellables, not special inventory entities.

Short summary:

- a customer can book a bundle as one order item
- fulfillment still expands to component product demand
- bundle composition is snapshotted at booking time
- bundle availability is satisfied only when all component requirements can be met for the requested period

The order and availability implications are covered in `rental-orders-and-fulfillment.md` and `rental-locations-and-availability.md`.

---

## Pricing Model

Pricing has three main layers:

- billing unit selection
- base price lookup
- discount rule evaluation

Short summary:

- `PricingTier` provides the base step-function price for a product type or bundle
- tiers may be location-specific
- duration is converted into billable units before tier resolution
- promotions then apply adjustments on top of the base result

Load `rental-pricing.md` for pricing and promotion details.

---

## Ownership And Revenue Sharing

Ownership is downstream of fulfillment.

Short summary:

- `Owner` identifies who owns rentable assets
- `OwnerContract` defines how revenue is split
- `OrderItemOwnerSplit` snapshots the applied economics when an asset fulfills an order item

Ownership affects payouts and reporting, not base availability. Load `rental-ownership-and-payouts.md` for details.

---
