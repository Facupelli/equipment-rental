# Rental Domain Rules

## Concepts & Relationships

```
Order (one customer, one booking_range, one contract)
 ├── status: PENDING_CONFIRMATION → RESERVED → ACTIVE → COMPLETED | CANCELLED
 ├── subtotal / totalDiscount / totalTax / grandTotal
 └── Booking[] (one row per product/unit)
      ├── productId          — always set
      ├── bundleId           — set if this booking was spawned from a bundle
      ├── inventoryItemId    — SERIALIZED only, null for BULK
      ├── quantity           — BULK only, null for SERIALIZED
      ├── unitPrice          — price for this line as calculated by PriceEngine
      └── priceBreakdown     — JSON snapshot of how PriceEngine calculated the price
```

---

## Order

An `Order` is the customer-facing rental transaction. It owns the `booking_range`
(the single date range that applies to every booking line within it).

**Rule:** All bookings within an order share the same `booking_range`. If a customer
needs different ranges for different products, they must create separate orders.
This keeps contracts, invoices, and pickup/return logistics unambiguous.

### Order Status Lifecycle

```
PENDING_CONFIRMATION → RESERVED → ACTIVE → COMPLETED
                                         ↘ CANCELLED
         ↘ CANCELLED
```

- `PENDING_CONFIRMATION` — order created but not yet confirmed (e.g. awaiting deposit).
- `RESERVED` — confirmed, equipment is reserved, not yet picked up.
- `ACTIVE` — equipment has been picked up, rental is in progress.
- `COMPLETED` — equipment returned, rental closed.
- `CANCELLED` — order cancelled at any point before COMPLETED.

Cancelled and Completed orders are excluded from availability overlap checks.

### Order Financials

The Order stores the computed financial totals as a snapshot at the time of confirmation:

- `subtotal` — sum of all `Booking.unitPrice` values.
- `totalDiscount` — discount applied (discount engine, to be implemented).
- `totalTax` — tax applied (to be implemented).
- `grandTotal` — `subtotal - totalDiscount + totalTax`.

---

## Booking

A `Booking` is one line within an Order. It represents one product or unit reserved
for the order's range.

### SERIALIZED Booking

- `inventoryItemId` is set — a specific physical unit is reserved.
- `quantity` is null.
- Availability check: is this specific unit already booked or blacked out?

### BULK Booking

- `quantity` is set — a number of interchangeable units is reserved.
- `inventoryItemId` is null.
- Availability check: is `totalStock - bookedQty - blockedQty >= requestedQty`?

The mutual exclusivity of these two fields is enforced by a DB check constraint.
See `rules/domain.md` — Overlap Detection for the raw SQL patterns.

---

## Creating an Order: Standard Flow (Direct Products)

When a customer selects one or more products directly (no bundle):

```
1. Validate the booking_range (start < end, not in the past).
2. For each product in the order:
   a. Read trackingType.
   b. Run availability check (see domain.md). Throw on conflict.
   c. Call PriceEngine to calculate unitPrice for this product + range.
3. Only after ALL availability checks pass — persist the Order and all Bookings.
4. Emit OrderCreatedEvent (triggers async invoicing and notifications via BullMQ).
```

**Rule:** Never persist any Booking until all availability checks pass. A partial
insert on failure leaves orphaned bookings that block availability for other customers.

---

## Creating an Order: Bundle Flow

When a customer selects a bundle, the bundle is decomposed into individual Bookings
before any availability check or persistence.

```
1. Load the ProductBundle and its BundleComponents.
2. Expand components into a flat list of (product, quantity) pairs.
   — If a component has quantity 2, it produces 2 booking candidates.
3. Run availability checks for ALL expanded components. Throw on any conflict.
4. Call PriceEngine to calculate the bundle price for the full range.
5. Distribute the bundle price across the individual Bookings.
6. Only after ALL checks pass — persist the Order and all Bookings, each carrying
   the bundleId of their originating bundle.
7. Emit OrderCreatedEvent.
```

**Rule:** Bookings spawned from a bundle always carry `bundleId`. This is the only
way to answer "which bookings in this order came from a bundle?" without a separate
join table.

**Rule:** Bundles cannot be nested. A BundleComponent always points to a plain
Product, never to another ProductBundle.

---

## PriceEngine: Resolution Logic

PriceEngine is the single authority for all price calculations. Never write pricing
math in a Use Case.

### For a direct product booking:

```
1. Determine the rental duration from booking_range.
2. Find the matching BillingUnit (the one whose durationHours fits the range).
3. Resolve PricingTier scope:
   a. If inventoryItemId is set: look for item-level tiers first.
   b. Fall back to product-level tiers if no item-level tiers exist.
4. Select the applicable tier: highest fromUnit that does not exceed the
   rental duration in billing units.
5. unitPrice = pricePerUnit × numberOfUnits.
```

### For a bundle booking:

```
1. Look for BundlePricingTier rows for this bundle + BillingUnit.
2. Select the applicable tier by the same fromUnit logic.
3. bundlePrice = pricePerUnit × numberOfUnits.
```

### PriceEngine interface:

```typescript
// ✅ CORRECT — always delegate to PriceEngine
const price = await this.priceEngine.calculateForProduct({
  productId,
  inventoryItemId, // null for BULK
  billingUnitId,
  range,
  tenantId,
});

const bundlePrice = await this.priceEngine.calculateForBundle({
  bundleId,
  billingUnitId,
  range,
  tenantId,
});

// ❌ WRONG — manual pricing in a Use Case
const days = differenceInDays(end, start);
const price = days * product.dailyRate;
```

---

## Availability Check: Full Picture

Before inserting any Booking, the Use Case must verify three things:

**For SERIALIZED:**

1. The specific `InventoryItem` has no overlapping active Booking.
2. The specific `InventoryItem` has no overlapping BlackoutPeriod.
3. The `InventoryItem.status` is `OPERATIONAL`.
   (Status check is in-memory after loading the item — no extra query needed.)

**For BULK:**

1. `totalStock - bookedQuantity - blockedQuantity >= requestedQuantity`.
   (bookedQuantity and blockedQuantity both come from raw SQL overlap queries.)

See `rules/domain.md` for the exact raw SQL patterns for each case.

---

## Background Jobs

After an Order is persisted, the HTTP response is returned immediately.
Side effects are handled asynchronously via BullMQ:

| Event               | Handler             | Responsibility                |
| ------------------- | ------------------- | ----------------------------- |
| OrderCreatedEvent   | InvoicingHandler    | Generate and store invoice    |
| OrderCreatedEvent   | NotificationHandler | Send confirmation to customer |
| OrderCancelledEvent | NotificationHandler | Send cancellation notice      |

**Rule:** Never block the HTTP response for invoicing or notifications.

---

## Creation Checklist

### Creating an Order (direct products)

- [ ] `booking_range` is valid (start < end)
- [ ] All availability checks pass before any insert
- [ ] PriceEngine called for each booking line
- [ ] Order and all Bookings persisted in a single transaction
- [ ] Order financials (subtotal, grandTotal) computed and stored
- [ ] `OrderCreatedEvent` emitted after successful persist

### Creating an Order (bundle)

- [ ] Bundle loaded with all BundleComponents
- [ ] Components expanded to flat (product, quantity) list
- [ ] All availability checks pass before any insert
- [ ] PriceEngine called for the bundle price
- [ ] Each Booking row carries `bundleId`
- [ ] Order and all Bookings persisted in a single transaction
- [ ] `OrderCreatedEvent` emitted after successful persist
