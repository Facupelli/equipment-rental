# Rental Ownership And Payouts

This document explains the ownership and revenue-sharing model that sits downstream of fulfillment.

Related docs:

- `rental-domain-model.md` for the overview
- `rental-orders-and-fulfillment.md` for the fulfillment decisions that create owner splits
- `rental-locations-and-availability.md` for the asset and assignment model that precedes payout calculation

## Core Model

Not every asset is necessarily owned directly by the tenant. Assets may be associated with an `Owner`, and owner economics are defined through `OwnerContract`.

The key concepts are:

- `Owner` identifies the person or party who owns rentable assets
- `OwnerContract` defines how rental revenue is split for that owner or for a specific asset
- `OrderItemOwnerSplit` snapshots the financial split created when a concrete asset fulfills an order item

## Why This Is Downstream Of Fulfillment

Ownership does not determine base availability.

The sequence is:

1. the system decides which asset fulfills the rental
2. the chosen asset determines which owner contract applies
3. the system computes owner-side and rental-side shares for settlement

Ownership affects payouts and reporting, not whether a booking can be fulfilled in the first place.

## Snapshotting Economics

`OrderItemOwnerSplit` exists so the settlement calculation is tied to the concrete fulfillment decision at that moment in time.

This protects downstream financial logic from later changes in ownership configuration or contract terms.
