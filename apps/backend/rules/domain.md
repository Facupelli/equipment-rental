# Domain Rules

## Product Tracking Types

The `TrackingType` enum determines how availability is calculated. Always check it first.

| Type         | Meaning                                     | Availability Check                           |
| ------------ | ------------------------------------------- | -------------------------------------------- |
| `SERIALIZED` | Tracked individually by Serial Number / ID  | Is this specific unit already booked?        |
| `BULK`       | Tracked by quantity (interchangeable units) | Is available quantity >= requested quantity? |

**Rule:** Never assume tracking type. Read the product's `trackingType` field before writing
any booking or availability logic.

---

## Owners & Revenue Splits

A product can have units owned by third parties (e.g. a friend's equipment placed in your rental inventory).
Ownership and revenue split rules are tracked at the **`inventory_item` level**, not the product level.

- An `inventory_item` with no `owner_id` is owned by the tenant.
- An `inventory_item` with an `owner_id` belongs to an external owner.
- `revenue_splits` defines the percentage of earnings owed to that owner for bookings of that item.

**Rule:** Only `SERIALIZED` products have `inventory_items`, and therefore only SERIALIZED items
support per-unit ownership. If a tenant wants to rent out a third party's equipment, it must be
modeled as a SERIALIZED product — not BULK — because physical accountability requires knowing
exactly which unit is out.

---

## Bookings & Rental Orders

### Model

A `rental_order` is the customer-facing transaction: one customer, one date range, one contract.
A `booking` is a single line within that order: one product/unit reserved for the order's range.

```
rental_orders (1) ──── (N) bookings
```

**Rule:** `booking_range` lives on `rental_orders`, not on individual bookings. All bookings
within an order share the same range. If a customer needs different ranges, they create separate orders.

### Storage

`rental_orders.booking_range` is stored as `tstzrange` in Postgres. Prisma does not support this
type natively. All reads and writes for booking ranges must use raw SQL. See `rules/multi-tenancy.md`
for the mandatory `tenantId` injection pattern.

### Overlap Detection

Use the Postgres `&&` (overlaps) operator to check for conflicts before inserting a booking.
Availability checks join `bookings → rental_orders` to access the range.
Check availability at the Application layer to return user-friendly conflict information.

**SERIALIZED — check if a specific unit is already booked:**

```typescript
const conflicts = await this.prisma.$queryRaw<{ id: string }[]>`
  SELECT b.id
  FROM bookings b
  JOIN rental_orders ro ON ro.id = b.rental_order_id
  WHERE b.tenant_id = ${tenantId}
    AND b.inventory_item_id = ${inventoryItemId}
    AND ro.status NOT IN ('CANCELLED', 'COMPLETED')
    AND ro.booking_range && ${requestedRange}::tstzrange
  LIMIT 1
`;

if (conflicts.length > 0) {
  throw new ConflictException(
    `Equipment is already booked during the requested period. Conflicts with booking #${conflicts[0].id}`,
  );
}
```

**BULK — check if enough quantity is available:**

```typescript
const bookedQuantity = await this.prisma.$queryRaw<{ total: number }[]>`
  SELECT COALESCE(SUM(b.quantity), 0) AS total
  FROM bookings b
  JOIN rental_orders ro ON ro.id = b.rental_order_id
  WHERE b.tenant_id = ${tenantId}
    AND b.product_id = ${productId}
    AND ro.status NOT IN ('CANCELLED', 'COMPLETED')
    AND ro.booking_range && ${requestedRange}::tstzrange
`;

const available = product.totalStock - Number(bookedQuantity[0].total);

if (available < requestedQuantity) {
  throw new ConflictException(`Insufficient stock. Requested: ${requestedQuantity}, Available: ${available}`);
}
```

> **Note:** Application-layer checks have a race condition risk at extreme concurrency.
> Verify with the team if a Postgres Exclusion Constraint exists as a hard stop on the DB level.

---

## Pricing Engine

- **Location:** `RentalModule`, provider: `PriceEngine`
- **Capabilities:** Pricing tiers (longer duration = cheaper), billing units (hour/day/week)

**Rule:** Never write pricing math manually inside a Use Case. Always inject `PriceEngine`
and delegate calculation to it.

```typescript
// ✅ CORRECT
const price = await this.priceEngine.calculate({ productId, range, tenantId });

// ❌ WRONG — manual pricing logic in a Use Case
const days = differenceInDays(end, start);
const price = days * product.dailyRate;
```

---

## Product Bundles

A bundle is a **marketing grouping**, not a physical item. It has no stock of its own.
Bundles cannot be nested — a bundle component must always be a plain product, never another bundle.

A bundle's price is either:

- A fixed `price_override` defined on the bundle, or
- The sum of its components' prices, with an optional `discount_percentage` applied.

PriceEngine is responsible for resolving which applies. Never compute bundle pricing manually.

**Rule:** Booking a bundle must be decomposed into individual bookings for each
underlying component product before any availability check or persistence.

```typescript
// Pseudocode — implement in a dedicated Use Case
async function bookBundle(bundleId, orderId, tenantId) {
  const components = await this.bundleRepo.getComponents(bundleId, tenantId);

  // Check availability for ALL components first — fail fast before any insert
  for (const component of components) {
    await this.checkAvailability(component, orderId, tenantId); // throws if unavailable
  }

  // Only persist after all checks pass
  for (const component of components) {
    await this.createBooking(component, orderId, tenantId);
  }
}
```

**Do not check-and-book in the same loop.** Check all first, book all second. Otherwise
a partial failure leaves orphaned bookings.

---

## Background Jobs: Sync vs Async

| Operation        | Mode             | Reason                         |
| ---------------- | ---------------- | ------------------------------ |
| Booking creation | Synchronous      | User waits for confirmation    |
| Invoicing        | Async via BullMQ | Non-critical for HTTP response |
| Notifications    | Async via BullMQ | Non-critical for HTTP response |

**Rule:** Do not block the HTTP response for side effects. Emit a Domain Event after
booking creation and let BullMQ handlers process invoicing and notifications.
