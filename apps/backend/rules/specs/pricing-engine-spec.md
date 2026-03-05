# Spec: Calculate Price

## What

A cross-module pricing service that calculates the final price for a single order item — either a PRODUCT or a BUNDLE — given a rental period. Called by the order module during order creation. Contains no side effects: it reads data and returns a number.

The calculation resolves a base price from pricing tiers, then applies applicable pricing rules (discounts) using an additive strategy. The result is a `Money` value object representing the final price for that item.

---

## Layers Touched

- `pricing-module` > Domain (PricingCalculator domain service, Money VO, RentalPeriod VO, PricingTier entity, PricingRule entity)
- `pricing-module` > Application (CalculatePriceHandler, PricingPublicApi)
- `pricing-module` > Infrastructure (PricingReadRepository — reads tiers and rules)
- `order-module` > Application (CreateOrderHandler will call PricingPublicApi)

---

## Implementation Plan

### 1. Value Objects & Domain primitives

**`pricing/domain/value-objects/money.vo.ts`** — Create `Money` VO

- Wraps a `number` (stored as integer cents to avoid floating point)
- Exposes `fromCents(n)`, `fromDecimal(n)` static factories
- Exposes `.cents`, `.toDecimal()`, `.add(other)`, `.subtract(other)`, `floor(min)`
- Immutable, structurally equal

**`pricing/domain/value-objects/rental-period.vo.ts`** — Create `RentalPeriod` VO

- Wraps `{ start: Date, end: Date }`
- Validates `end > start`, throws `InvalidRentalPeriodException` otherwise
- Exposes `.durationMinutes(): number`
- Shared concept — will also be used by inventory. For now lives in pricing, can be moved to a shared kernel later if needed.

---

### 2. Domain entities

**`pricing/domain/entities/pricing-tier.entity.ts`**

- Props: `id`, `productTypeId?`, `bundleId?`, `locationId?`, `fromUnit`, `toUnit?`, `pricePerUnit: Money`
- Static `reconstitute()` only — never created in domain, only loaded from DB
- No business methods needed beyond data access

**`pricing/domain/entities/pricing-rule.entity.ts`**

- Props: `id`, `type: PricingRuleType`, `scope: PricingRuleScope`, `priority`, `stackable`, `condition: unknown`, `effect: unknown`
- Static `reconstitute()` only
- Exposes `.isApplicableTo(context: RuleApplicationContext): boolean` — evaluates the `condition` JSON against the context
- Exposes `.discountEffect(): DiscountEffect` — parses and returns the `effect` JSON as a typed object

**Types:**

```typescript
type RuleApplicationContext = {
  period: RentalPeriod;
  productTypeId?: string;
  bundleId?: string;
  categoryId?: string;
  orderItemCountByCategory: Record<string, number>; // categoryId → count of OrderItems in that category
};

type DiscountEffect =
  | { type: 'PERCENTAGE'; value: number } // 0–100
  | { type: 'FLAT'; value: Money };
```

---

### 3. Domain service

**`pricing/domain/services/pricing-calculator.domain-service.ts`**

This is the heart of the pricing logic. Pure function — no I/O.

```
calculate(input: PricingCalculatorInput): Money
```

```typescript
type PricingCalculatorInput = {
  period: RentalPeriod;
  billingUnitDurationMinutes: number;
  tiers: PricingTier[];
  rules: PricingRule[];
  context: RuleApplicationContext;
};
```

**Internal steps:**

1. **Resolve units**

   ```
   units = ceil(period.durationMinutes() / billingUnitDurationMinutes)
   ```

2. **Resolve tier** — find the tier where `fromUnit <= units` and (`toUnit` is null OR `toUnit >= units`). If no tier matches, throw `NoPricingTierFoundException` (invariant violation — catalog is misconfigured).

3. **Base price**

   ```
   base = tier.pricePerUnit * units
   ```

4. **Apply rules**
   - Filter rules to those where `rule.isApplicableTo(context) === true`
   - Separate into stackable and non-stackable
   - Non-stackable: take the single highest-priority (lowest `priority` number) applicable rule
   - Stackable: take all applicable stackable rules
   - Combine into one effective rule list (non-stackable winner + all stackable)
   - Sum all PERCENTAGE discounts → apply once to base
   - Subtract all FLAT discounts after
   - Floor at zero

5. Return `Money`

**Exceptions (thrown, not returned):**

- `NoPricingTierFoundException` — no tier covers the calculated units
- `InvalidRentalPeriodException` — thrown by RentalPeriod VO constructor

---

### 4. Port

**`pricing/domain/ports/pricing-read.repository-port.ts`**

```typescript
export abstract class PricingReadRepositoryPort {
  abstract loadTiersForProduct(productTypeId: string, locationId?: string): Promise<PricingTier[]>;
  abstract loadTiersForBundle(bundleId: string, locationId?: string): Promise<PricingTier[]>;
  abstract loadActiveRulesForTenant(tenantId: string): Promise<PricingRule[]>;
}
```

Note: tier loading always fetches both null-locationId (global) and specific-locationId rows. Resolution priority: specific location > global. This logic lives in the repository implementation, not in the domain.

---

### 5. Public API contract

**`pricing/application/pricing.public-api.ts`**

```typescript
export abstract class PricingPublicApi {
  abstract calculateProductPrice(dto: CalculateProductPriceDto): Promise<Money>;
  abstract calculateBundlePrice(dto: CalculateBundlePriceDto): Promise<Money>;
}

export type CalculateProductPriceDto = {
  tenantId: string;
  locationId: string;
  productTypeId: string;
  categoryId?: string;
  period: { start: Date; end: Date };
  orderItemCountByCategory: Record<string, number>; // needed for VOLUME rule evaluation
};

export type CalculateBundlePriceDto = {
  tenantId: string;
  locationId: string;
  bundleId: string;
  period: { start: Date; end: Date };
};
```

Both methods return `Money`. They do not return a `Result` — a pricing failure (no tier found, invalid period) is a system misconfiguration, not a recoverable business outcome. It throws.

---

### 6. Application service

**`pricing/application/pricing.application-service.ts`** — implements `PricingPublicApi`

For `calculateProductPrice`:

1. Load `ProductType` to get `billingUnitDurationMinutes` and `categoryId`
2. Load tiers via `PricingReadRepositoryPort.loadTiersForProduct()`
3. Load active rules via `loadActiveRulesForTenant()`
4. Build `RuleApplicationContext` from dto + loaded data
5. Construct `RentalPeriod` VO
6. Delegate to `PricingCalculator.calculate()`
7. Return `Money`

For `calculateBundlePrice`: same shape but loads bundle tiers instead.

Note: we need to load the ProductType to get the billingUnit. This means `PricingReadRepositoryPort` needs one more method:

```typescript
abstract loadProductTypeMeta(productTypeId: string): Promise<{ billingUnitDurationMinutes: number; categoryId?: string }>;
abstract loadBundleMeta(bundleId: string): Promise<{ billingUnitDurationMinutes: number }>;
```

Wait — bundles don't have a billing unit in the schema. **Open question flagged below.**

---

### 7. Infrastructure

**`pricing/infrastructure/pricing-read.repository.ts`** — implements `PricingReadRepositoryPort`

- Uses PrismaService directly (query handler pattern — no domain mappers needed for reads)
- Tier location resolution: fetch rows where `locationId = $locationId OR locationId IS NULL`, then in-memory prefer specific over global per `fromUnit`
- Maps DB rows to `PricingTier` and `PricingRule` entities via `reconstitute()`

**`pricing/infrastructure/mappers/pricing-tier.mapper.ts`**
**`pricing/infrastructure/mappers/pricing-rule.mapper.ts`**

---

### 8. Module wiring

**`pricing/pricing.module.ts`**

- Provides `PricingReadRepositoryPort → PricingReadRepository`
- Provides `PricingPublicApi → PricingApplicationService`
- Exports `PricingPublicApi`
- `PricingCalculator` is instantiated directly by the application service (it's a pure domain service, no injection needed)

---

## Edge Cases

- **No matching tier**: units fall outside all tier ranges → `NoPricingTierFoundException`. This is a catalog misconfiguration. Throws.
- **Multiple non-stackable rules at same priority**: undefined behavior in current design. Mitigation: add a `@@unique([tenantId, priority])` constraint at DB level, or document that ties are broken arbitrarily. Flag as open question.
- **Stackable + non-stackable interaction**: the non-stackable winner and all stackable rules are combined. A stackable rule never blocks a non-stackable rule and vice versa.
- **Discount exceeds base price**: floored at zero. Never negative.
- **VOLUME rule**: `condition.threshold` is a count of OrderItems belonging to a given category within the same order. Evaluated via `context.orderItemCountByCategory[condition.categoryId] >= condition.threshold`. The application service must pass the full item count map — it cannot be derived from a single item in isolation.
- **SEASONAL rule**: `condition.dateFrom / dateTo` is compared against `period.start`. If the rental starts within the seasonal window, the rule applies. Edge: rental starts inside window but ends outside — rule still applies (start date governs).
- **Location-specific tiers**: if a specific-location tier exists for a `fromUnit`, it shadows the global tier for that unit band. If no specific tier exists for a band, fall back to global.
- **Bundle billing unit**: bundles do not have a `billingUnitId` in the schema. See open questions.

---

## Acceptance Criteria

- [ ] `RentalPeriod` with `end <= start` throws `InvalidRentalPeriodException`
- [ ] `Money` arithmetic never produces floating point errors (uses integer cents internally)
- [ ] `PricingCalculator` resolves the correct tier for a given unit count
- [ ] `PricingCalculator` applies only the highest-priority non-stackable rule when multiple apply
- [ ] `PricingCalculator` sums all stackable percentage discounts and applies them in one pass
- [ ] `PricingCalculator` applies flat discounts after percentage discounts
- [ ] Final price is never negative
- [ ] Location-specific tier shadows global tier for the same unit band
- [ ] `calculateProductPrice` returns correct `Money` for a POOLED product with no applicable rules
- [ ] `calculateProductPrice` returns correct `Money` for a POOLED product with one SEASONAL rule active
- [ ] `calculateBundlePrice` uses bundle tiers, not component tiers
- [ ] No tier found → throws, does not return a Result

---

## Open Questions

1. ~~**Bundle billing unit**~~ — **Resolved**: add `billingUnitId` to `Bundle` model. Schema migration required before implementation.

2. ~~**VOLUME rule scope**~~ — **Resolved**: threshold is a count of `OrderItem` records in the same category within the same order. `CalculateProductPriceDto` carries `orderItemCountByCategory` for this purpose.

3. ~~**Tie-breaking for non-stackable rules at equal priority**~~ — **Resolved**: DB-level partial unique index on active rules only:
   ```sql
   CREATE UNIQUE INDEX idx_pricing_rules_active_priority_unique
     ON pricing_rules (tenant_id, priority)
     WHERE is_active = true;
   ```
   Inactive rules may share priority values freely.

---

## Handoff Note — Price Snapshotting

`PricingPublicApi` returns `Money` and has no side effects. The responsibility for writing `priceSnapshot` onto `OrderItem` belongs entirely to `CreateOrderHandler`. This must be explicitly documented in the order module spec to prevent the value from being calculated but never persisted.
