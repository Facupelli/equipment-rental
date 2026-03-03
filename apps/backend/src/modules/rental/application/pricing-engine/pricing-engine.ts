import { Injectable } from '@nestjs/common';

import { decomposeIntoUnits } from './unit-decomposition';
import { resolveTier } from './tier-resolution';
import { calculateAmount } from './amount-calculation';
import { PriceBreakdown } from '../../domain/value-objects/price-breakdown.vo';
import { BillingUnitReadModel } from 'src/modules/tenancy/infrastructure/persistance/prisma-tenant-config.adapter';
import { TenantPricingConfig } from 'src/modules/tenancy/domain/value-objects/tenant-config.vo';
import { RentalPricingTierView } from '../ports/rental-product.port';

export interface PricingEngineInput {
  startDate: Date;
  endDate: Date;

  /**
   * The specific inventory item being priced.
   * - SERIALIZED: set to the assigned inventoryItemId so the engine can apply
   *   item-level tier precedence over product-level tiers.
   * - BULK: null — product-level tiers always apply.
   */
  inventoryItemId: string | null;

  /**
   * All pricing tiers for this product — both product-level
   * (inventoryItemId: null) and item-level (inventoryItemId: string).
   * The engine applies precedence internally: item-level wins if present.
   */
  tiers: readonly RentalPricingTierView[];

  /** All billing units configured for this tenant. */
  units: BillingUnitReadModel[];

  config: TenantPricingConfig;
}

export interface BundlePricingEngineInput {
  startDate: Date;
  endDate: Date;

  /** Bundle-specific pricing tiers — no item-level concept exists for bundles. */
  tiers: readonly BundlePricingTierView[];

  units: BillingUnitReadModel[];
  config: TenantPricingConfig;
}

export interface BundlePricingTierView {
  id: string;
  billingUnitId: string;
  fromUnit: number;
  pricePerUnit: number;
  currency: string;
}

export type PricingEngineResult = PriceBreakdown;

export interface CalendarAdjustment {
  type: 'WEEKEND_MERGED';
  saturdayDate: string;
  hoursDeducted: number;
}

@Injectable()
export class PricingEngine {
  /**
   * Prices a direct product booking (SERIALIZED or BULK).
   * Applies item-level tier precedence when inventoryItemId is set.
   */
  calculate(input: PricingEngineInput): PricingEngineResult {
    this.validateDateRange(input.startDate, input.endDate);

    const rawDurationHours = this.computeRawHours(input.startDate, input.endDate);

    const { billableHours, adjustments } = this.applyCalendarRules(
      input.startDate,
      input.endDate,
      rawDurationHours,
      input.config,
    );

    const decomposition = decomposeIntoUnits(billableHours, input.units, input.config.roundingRule);

    // Apply precedence: prefer item-level tiers if this is a SERIALIZED booking
    // with an assigned unit. Fall back to product-level tiers if none exist.
    const resolvedTiers = this.resolveProductTiers(input.tiers, input.inventoryItemId);

    const tierResolution = resolveTier(decomposition, resolvedTiers, input.units);

    return calculateAmount(decomposition, tierResolution, input.units, rawDurationHours, adjustments);
  }

  /**
   * Prices a bundle booking.
   * Bundles have their own BundlePricingTier rows — no item-level concept applies.
   * The pipeline is identical; only the tier input shape differs.
   */
  calculateForBundle(input: BundlePricingEngineInput): PricingEngineResult {
    this.validateDateRange(input.startDate, input.endDate);

    const rawDurationHours = this.computeRawHours(input.startDate, input.endDate);

    const { billableHours, adjustments } = this.applyCalendarRules(
      input.startDate,
      input.endDate,
      rawDurationHours,
      input.config,
    );

    const decomposition = decomposeIntoUnits(billableHours, input.units, input.config.roundingRule);

    // Bundle tiers have no inventoryItemId concept — pass through directly.
    const tierResolution = resolveTier(decomposition, input.tiers, input.units);

    return calculateAmount(decomposition, tierResolution, input.units, rawDurationHours, adjustments);
  }

  // ---------------------------------------------------------------------------
  // Tier precedence
  // ---------------------------------------------------------------------------

  /**
   * Applies the item-level override rule:
   *   1. If inventoryItemId is set, collect tiers scoped to that specific unit.
   *   2. If any item-level tiers exist — use them exclusively.
   *   3. If none exist (or inventoryItemId is null) — fall back to product-level tiers.
   *
   * This means a partial item-level override (e.g. only a "week" tier defined
   * at item level) will shadow ALL product-level tiers. Tier sets should always
   * be complete for a given billing unit scope.
   */
  private resolveProductTiers(
    tiers: readonly RentalPricingTierView[],
    inventoryItemId: string | null,
  ): readonly RentalPricingTierView[] {
    if (inventoryItemId === null) {
      return tiers.filter((t) => t.inventoryItemId === null);
    }

    const itemTiers = tiers.filter((t) => t.inventoryItemId === inventoryItemId);

    if (itemTiers.length > 0) {
      return itemTiers;
    }

    // No item-level tiers for this unit — fall back to product-level.
    return tiers.filter((t) => t.inventoryItemId === null);
  }

  // ---------------------------------------------------------------------------
  // Calendar rules
  // ---------------------------------------------------------------------------

  private applyCalendarRules(
    startDate: Date,
    endDate: Date,
    rawHours: number,
    config: TenantPricingConfig,
  ): { billableHours: number; adjustments: CalendarAdjustment[] } {
    const adjustments: CalendarAdjustment[] = [];

    if (!config.weekendCountsAsOne) {
      return { billableHours: rawHours, adjustments };
    }

    let deductedHours = 0;

    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);

    const endDay = new Date(endDate);
    endDay.setUTCHours(0, 0, 0, 0);

    while (cursor < endDay) {
      const dayOfWeek = cursor.getUTCDay();

      if (dayOfWeek === 6) {
        const sunday = new Date(cursor);
        sunday.setUTCDate(sunday.getUTCDate() + 1);

        if (sunday < endDay) {
          deductedHours += 24;
          adjustments.push({
            type: 'WEEKEND_MERGED',
            saturdayDate: cursor.toISOString().split('T')[0],
            hoursDeducted: 24,
          });
          cursor.setUTCDate(cursor.getUTCDate() + 2);
          continue;
        }
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return {
      billableHours: rawHours - deductedHours,
      adjustments,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private computeRawHours(startDate: Date, endDate: Date): number {
    const ms = endDate.getTime() - startDate.getTime();
    return ms / (1000 * 60 * 60);
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (endDate <= startDate) {
      throw new Error(
        `endDate must be after startDate. Received: start=${startDate.toISOString()}, end=${endDate.toISOString()}`,
      );
    }
  }
}
