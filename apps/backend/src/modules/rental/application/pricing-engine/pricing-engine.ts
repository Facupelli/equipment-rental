import { Injectable } from '@nestjs/common';

import { decomposeIntoUnits } from './unit-decomposition';
import { resolveTier } from './tier-resolution';
import { calculateAmount } from './amount-calculation';
import { PriceBreakdown } from '../../domain/value-objects/price-breakdown.vo';
import { BillingUnitReadModel } from 'src/modules/tenancy/infrastructure/persistance/prisma-tenant-config.adapter';
import { RentalPricingTierView } from '../../domain/ports/rental-product.port';
import { TenantPricingConfig } from 'src/modules/tenancy/domain/value-objects/tenant-config.vo';

/**
 * Everything the engine needs to compute a price.
 * The application layer (CreateBookingHandler) is responsible for fetching
 * tiers and units from the DB before calling the engine.
 */
export interface PricingEngineInput {
  startDate: Date;
  endDate: Date;

  /** Pre-fetched tiers for this product/item. Includes both product-level
   *  and any item-level overrides — the engine handles precedence internally. */
  tiers: readonly RentalPricingTierView[];

  /** All billing units configured for this tenant. */
  units: BillingUnitReadModel[];

  config: TenantPricingConfig;
}

/** The engine returns the PriceBreakdown VO directly — it is already the complete snapshot. */
export type PricingEngineResult = PriceBreakdown;

/**
 * A single calendar rule application, persisted in the snapshot so
 * disputes can be resolved without re-running the engine.
 */
export interface CalendarAdjustment {
  type: 'WEEKEND_MERGED';
  /** ISO date string of the Saturday that triggered the merge. */
  saturdayDate: string;
  /** Hours removed from the billable total (always 24 — one day). */
  hoursDeducted: number;
}

@Injectable()
export class PricingEngine {
  /**
   * Entry point. Runs the full pricing pipeline:
   *   1. Calendar rules  → billable hours
   *   2. Decomposition   → unit quantities
   *   3. Tier resolution → matched rate
   *   4. Amount calc     → line items + total
   *
   * This method is pure in intent: given the same inputs it always produces
   * the same output. The @Injectable decorator is the only NestJS concern here.
   */
  calculate(input: PricingEngineInput): PricingEngineResult {
    this.validateDateRange(input.startDate, input.endDate);

    // --- Stage 1a: raw duration ---
    const rawDurationHours = this.computeRawHours(input.startDate, input.endDate);

    // --- Stage 1b: apply calendar rules ---
    const { billableHours, adjustments } = this.applyCalendarRules(
      input.startDate,
      input.endDate,
      rawDurationHours,
      input.config,
    );

    // --- Stage 2: decompose into billing units ---
    const decomposition = decomposeIntoUnits(billableHours, input.units, input.config.roundingRule);

    // --- Stage 3: resolve the matching tier ---
    const tierResolution = resolveTier(decomposition, input.tiers, input.units);

    // --- Stage 4: calculate amounts and assemble the PriceBreakdown VO ---
    return calculateAmount(decomposition, tierResolution, input.units, rawDurationHours, adjustments);
  }

  // =============================================================================
  // Private — Calendar Rules
  // =============================================================================

  /**
   * Applies tenant calendar rules to produce a billable hour count.
   *
   * weekendCountsAsOne: for every Saturday–Sunday pair fully contained within
   * the booking window, deduct 24 billable hours (one day). A lone Saturday
   * or Sunday at the boundary is not deducted — the pair must be complete.
   */
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

    // Iterate day-by-day through the booking window looking for Sat+Sun pairs.
    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);

    const endDay = new Date(endDate);
    endDay.setUTCHours(0, 0, 0, 0);

    while (cursor < endDay) {
      const dayOfWeek = cursor.getUTCDay(); // 0=Sun, 6=Sat

      if (dayOfWeek === 6) {
        // Found a Saturday — check if Sunday is also within the window.
        const sunday = new Date(cursor);
        sunday.setUTCDate(sunday.getUTCDate() + 1);

        if (sunday < endDay) {
          // Complete weekend found: deduct one day (24h).
          deductedHours += 24;
          adjustments.push({
            type: 'WEEKEND_MERGED',
            saturdayDate: cursor.toISOString().split('T')[0],
            hoursDeducted: 24,
          });
          // Skip Sunday — already accounted for.
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
