# Coupon & Discount System — Design Document

## Context

This document captures the design decisions made when implementing the coupon and discount system on top of the existing pricing calculator. It is intended as a reference for developers joining the project or continuing this work in a new session.

The pricing calculator (`PricingCalculator`) was already implemented and working for `SEASONAL` and `VOLUME` rules before this work began. The goal was to activate `COUPON` and `CUSTOMER_SPECIFIC` rules, and build the infrastructure to support them.

---

## System Overview

The discount system has two distinct tracks:

**Track 1 — Automatic promotions.** Automatic promotions fire when their conditions match the pricing context. No user action required. A customer books during a seasonal window and the discount just applies.

**Track 2 — Redemption-gated promotions.** `COUPON` promotions are inert until a `Coupon` row wraps them and a customer presents the code. The `Coupon` model owns all access control: who can use it, how many times, and when. The `Promotion` defines the discount effect.

`CUSTOMER_SPECIFIC` promotions sit on Track 1 — they fire automatically when the `customerId` in context matches the condition. No code required.

### The Mental Model

```
Promotion    →  defines the discount ("10% off")
Coupon       →  gates the promotion ("who can use it, how many times, when")
CouponRedemption  →  records each use (audit trail + usage counting)
```

---

## Architecture

### Layering

```
CreateOrderHandler
  │
  ├── CouponApplicationService.resolveCouponForPricing()   [before pricing, outside tx]
  │     └── CouponValidationService.validate()             [pure domain, no I/O]
  │
  ├── PricingApplicationService.calculateProductPrice()    [per item]
  │     └── PricingCalculator.calculate()                  [pure domain, no I/O]
  │           └── PromotionEvaluatorService.evaluate()     [trusts injected promotion ids]
  │
  └── $transaction
        ├── order save
        ├── asset assignments
        └── CouponApplicationService.redeemWithinTransaction()  [hard enforcement]
              └── CouponValidationService.validate()            [recount inside tx]
```

### Key Boundary

The pricing engine is completely unaware of coupons as a concept. It receives pre-validated promotion ids from the application layer. Coupon validation stays outside the pricing evaluator; the evaluator only applies the promotion effect.

The application layer owns the question "is this coupon valid?". The domain owns the question "what discount does this promotion produce?". These two questions never mix.

---

## Schema

### New Tables

**`coupons`**

```
id, tenantId, promotionId (FK → promotions)
code                          — unique per tenant, stored uppercase
maxUses                       — nullable, null = unlimited
maxUsesPerCustomer            — nullable, null = unlimited
restrictedToCustomerId        — nullable FK → customers
validFrom, validUntil         — nullable, defines the booking window
isActive
createdAt, updatedAt
```

**`coupon_redemptions`**

```
id
couponId    FK → coupons
orderId     FK → orders  (@unique — one redemption per order)
customerId  nullable FK → customers
redeemedAt
voidedAt    nullable — soft delete, preserves audit trail
```

### Changes to Existing Tables

**`orders`** — added `couponId` (nullable FK → coupons). One coupon per order, explicit policy.

### Index Strategy

`@@index([couponId, voidedAt])` — serves `countActive(couponId)`: total active redemptions for a coupon.

`@@index([couponId, customerId, voidedAt])` — serves `countActiveForCustomer(couponId, customerId)`: per-customer active redemptions.

Both queries filter `voidedAt IS NULL` to count only active (non-voided) redemptions.

---

## Domain Layer

### `Coupon` Entity

Pure domain entity. Owns four validation methods — each answers a single boolean question. No I/O, counts are passed in by the caller.

| Method                                                             | Question                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| `isValidAt(now)`                                                   | Is the coupon active and within its validity window? |
| `isRestrictedTo(customerId?)`                                      | Can this customer (or guest) use this coupon?        |
| `isWithinGlobalLimit(totalActiveRedemptions)`                      | Has the global usage cap been reached?               |
| `isWithinPerCustomerLimit(customerActiveRedemptions, customerId?)` | Has this customer hit their personal limit?          |

**Code normalization:** `create()` calls `code.trim().toUpperCase()`. All lookup queries must normalize to uppercase before querying. This avoids case-sensitivity issues without requiring a case-insensitive DB collation.

### `CouponValidationService`

Pure domain service — same pattern as `PricingCalculator`. Takes a `CouponValidationInput`, calls the four entity methods in order, returns the first failure with a typed reason or `{ valid: true, promotionId }` on success.

**Validation order (cheapest first):**

1. `INACTIVE` — active flag check
2. `NOT_YET_VALID` — before validity window
3. `EXPIRED` — after validity window
4. `CUSTOMER_RESTRICTED` — wrong customer or guest on restricted coupon
5. `MAX_USES_REACHED` — global cap hit
6. `MAX_USES_PER_CUSTOMER_REACHED` — per-customer cap hit

`NOT_YET_VALID` and `EXPIRED` are distinct reasons (both caught by the validity window check) so the application layer can surface different messages to the customer.

### Updated Pricing Context

The pricing application service passes pre-validated coupon-backed `promotionId` values into the promotion evaluation flow alongside `customerId`.

---

## Application Layer

### `CouponApplicationService`

Three responsibilities:

**`resolveCouponForPricing(input)`** — soft validation pass, called before pricing, outside the transaction.

- Loads coupon by code + tenantId
- Fetches `totalActiveRedemptions` and `customerActiveRedemptions` in parallel
- Calls `CouponValidationService.validate()`
- Returns `{ couponId, promotionId }` on success
- Throws `CouponNotFoundException` or `CouponValidationException` on failure

**`redeemWithinTransaction(input, tx)`** — hard enforcement pass, called inside the order `$transaction` after `order.transitionTo(SOURCED)`.

- Reloads the coupon by id (not code — id was already resolved in the soft pass)
- Recounts redemptions inside the transaction (race condition guard)
- Calls `CouponValidationService.validate()` again
- If valid, writes the `CouponRedemption` row
- If invalid, throws — rolling back the entire transaction including the order save

**`voidRedemption(orderId, tx)`** — called from the order cancellation flow. Delegates to repository. No-ops if the order had no coupon.

### `CouponRedemptionRepository`

Not a domain repository (no rich entity, no mapper). Direct Prisma queries:

- `countActive(couponId)` — count non-voided redemptions
- `countActiveForCustomer(couponId, customerId)` — returns 0 for guests
- `redeem(input, tx)` — must be called inside a transaction
- `voidByOrderId(orderId, tx)` — uses `updateMany`, silently no-ops if no redemption exists

---

## Integration: `CreateOrderHandler`

Three insertion points:

**Before `resolveItems()`:**

```typescript
const now = new Date(); // captured once, reused for both validation passes
let resolvedCoupon: { couponId: string; ruleId: string } | undefined;

if (command.couponCode) {
  resolvedCoupon = await this.couponService.resolveCouponForPricing({
    tenantId: command.tenantId,
    code: command.couponCode,
    customerId: command.customerId,
    now,
  });
}
```

**Inside `resolveItems()`** — pass to each pricing call:

```typescript
applicableCouponRuleIds: resolvedCoupon ? [resolvedCoupon.ruleId] : undefined,
customerId: command.customerId,
```

**Inside `$transaction`, after `order.transitionTo(SOURCED)`:**

```typescript
if (resolvedCoupon) {
  await this.couponService.redeemWithinTransaction(
    { couponId: resolvedCoupon.couponId, orderId: order.id, customerId: command.customerId, now },
    tx,
  );
}
```

**`now` is captured once** at the top of `execute()` and reused across both validation passes. This ensures both passes reason about the same point in time — a coupon expiring at exactly midnight could otherwise pass one check and fail the other due to millisecond drift.

---

## Key Decisions

### Why validation happens twice

The soft pass (`resolveCouponForPricing`) gives the customer early feedback before touching inventory. The hard pass (`redeemWithinTransaction`) is the real enforcement — it runs inside the transaction and closes the race condition window.

They are not redundant. They serve different purposes.

### Race condition strategy

Two concurrent orders can both pass the soft validation check before either has written a redemption row. The hard guard has two layers:

1. **Recount inside the transaction** — any concurrent order that committed between the soft check and now will be visible here. If limits are now exceeded, throws and rolls back.
2. **`@unique` on `CouponRedemption.orderId`** — database-level guard. A duplicate redemption for the same order is a hard constraint violation.

No reservation/hold model for MVP. A race failure returns a typed error — the customer is asked to try again.

### `CUSTOMER_SPECIFIC` vs coupons

Both patterns are supported:

- **Ongoing contract pricing** (e.g. a B2B client always gets 15% off): use a `CUSTOMER_SPECIFIC` `PricingRule`. No coupon row needed. Fires automatically when `customerId` matches.
- **One-time or targeted discount** (e.g. send a personal offer to a customer): use a `COUPON` rule wrapped by a `Coupon` row with `restrictedToCustomerId` set and `maxUses: 1`.

### Validity window reference point

`validFrom`/`validUntil` on `Coupon` is checked against **order creation time** (`now` at command execution), not the rental period. A coupon valid "this week" means you must _book_ this week. You can book now for a rental 3 months from now and the coupon still applies.

### Guest orders

Guests (undefined `customerId`) skip the per-customer limit check entirely — `countActiveForCustomer` returns 0 for undefined. Per-customer limits cannot be enforced without identity. Guests are still subject to global `maxUses` limits and customer restriction checks (a coupon with `restrictedToCustomerId` is not usable by guests).

### Void policy

Redemption rows are never deleted — `voidedAt` is set instead. This preserves the audit trail.

Coupon slots are freed (redemption voided) **only if the order is cancelled from `SOURCED` status** — meaning assets were assigned but the rental never started. Once an order reaches `ACTIVE`, the rental happened and the slot is permanently consumed regardless of later cancellation.

### One coupon per order

Explicit policy. `Order` has a single nullable `couponId` FK. Multiple coupons per order are not supported.

### Pricing is per item, not per order

Each `OrderItem` owns its `priceSnapshot`. Coupon rule IDs are passed to every item's pricing call — the calculator applies the discount to each item individually. This is correct for this domain: items can have different tiers, categories, and billing units. `ORDER`-scoped coupon discounts are distributed per item at calculation time.

---

## What Is Not Built Yet

- **Cancellation flow** — `voidRedemption` is implemented in `CouponApplicationService` but has no caller yet. Wire it into the cancellation handler when that flow is built. Policy: only void if cancelling from `SOURCED`, not after `ACTIVE`.
- **Coupon management API** — CRUD endpoints for creating and managing coupons (admin back-office).
- **Bulk code generation** — campaign-style codes (e.g. `SUMMER-XXXX`), not in scope for MVP.
- **Coupon analytics** — redemption reporting, campaign performance tracking.

---

## File Map

```
src/modules/pricing/
  domain/
    entities/
      coupon.entity.ts                          — Coupon domain entity
    services/
      coupon-validation.service.ts              — Pure validation orchestrator
    ports/
      coupon.repository.port.ts                 — Abstract repository interface
    types/
      pricing-rule.types.ts                     — Updated: added customerId, applicableCouponRuleIds
    entities/
      pricing-rule.entity.ts                    — Updated: un-stubbed COUPON + CUSTOMER_SPECIFIC

  application/
    services/
      coupon-application.service.ts             — Orchestrator: resolve, redeem, void
    exceptions/
      coupon.exceptions.ts                      — CouponNotFoundException, CouponValidationException

  infrastructure/
    persistence/
      repositories/
        coupon.repository.ts                    — Load by id, load by code, save
        coupon-redemption.repository.ts         — Count, redeem, void (no domain entity)
      mappers/
        coupon.mapper.ts                        — PrismaCoupon ↔ Coupon domain entity

src/modules/order/
  application/
    commands/
      create-order/
        create-order.command.ts                 — Updated: couponCode?, customerId → string | undefined
        create-order.handler.ts                 — Updated: three coupon insertion points

pricing.public-api.ts                           — Updated: applicableCouponRuleIds?, customerId? on DTOs
```
