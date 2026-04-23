# Rental Pricing

This document explains the high-level pricing model for the rental domain.

Related docs:

- `rental-domain-model.md` for the overview
- `rental-orders-and-fulfillment.md` for how priced items are booked into orders
- `rental-locations-and-availability.md` for location context that affects pricing interpretation

## Pricing Layers

Pricing has three main layers:

- billing unit selection
- base price lookup
- discount or promotion evaluation

The mental model is: convert duration into billable units, resolve the matching base tier, then apply any adjustments.

## Billing Units

`BillingUnit` is a system-level time unit such as hour, day, or week. Tenants activate the units they use through `TenantBillingUnit`.

Each `ProductType` and each `Bundle` chooses one billing unit. Duration is converted into billable units by dividing total minutes by the selected unit and applying the configured rounding behavior.

## Pricing Tiers

`PricingTier` defines the base step-function price for a product type or bundle.

Important properties:

- it attaches either to `productTypeId` or `bundleId`
- it may optionally be location-specific through `locationId`
- it uses `fromUnit` / `toUnit` ranges to express duration bands

Once the system knows the billable unit count, it resolves the matching tier and gets the base price.

## Promotions

`Promotion` defines discounts or adjustments that apply on top of the base price.

Promotions are a separate layer from pricing tiers because they modify an already-priced rental rather than defining the baseline price table.

## Pricing Context

Pricing depends on more than catalog definitions. The effective context may also include:

- location-specific tiers
- the location's effective timezone for duration interpretation
- tenant pricing configuration such as rounding behavior or weekend handling

This is why pricing should be understood as a domain flow, not just a static lookup table.
