// Domain Layer: pricing/domain/services/discount-application.service.ts

import { Injectable } from "@nestjs/common";
import type { DiscountRule } from "../models/discount-rule";
import { DiscountLine } from "../value-objects/discount-line";
import { Money } from "../value-objects/money";

@Injectable()
export class DiscountApplicationService {
	/**
	 * Apply discount rules to a subtotal and return the resulting discount lines.
	 *
	 * @param eligibleRules - Rules that have already been filtered for eligibility
	 *                        (e.g., matching promo code, correct loyalty tier)
	 * @param subtotal - The amount to calculate discounts from (before discounts)
	 * @returns Array of discount lines showing which discounts were applied
	 *
	 * @example
	 * // Single stackable discount
	 * const rules = [{ name: 'Gold Loyalty', percentage: 0.15, stackable: true, priority: 10 }]
	 * applyDiscounts(rules, Money.fromAmount(100))
	 * // => [{ name: 'Gold Loyalty', percentage: 0.15, amount: $15.00 }]
	 *
	 * @example
	 * // Multiple stackable discounts (applied in priority order)
	 * const rules = [
	 *   { name: 'Loyalty', percentage: 0.10, stackable: true, priority: 10 },
	 *   { name: 'Seasonal', percentage: 0.05, stackable: true, priority: 20 }
	 * ]
	 * applyDiscounts(rules, Money.fromAmount(100))
	 * // => [
	 * //   { name: 'Loyalty', amount: $10.00 },      // 10% of $100
	 * //   { name: 'Seasonal', amount: $5.00 }       // 5% of $100 (NOT 5% of $90)
	 * // ]
	 * // Total discount: $15.00 (15% total)
	 *
	 * @example
	 * // Non-stackable rule present (apply only the best)
	 * const rules = [
	 *   { name: 'Promo A', percentage: 0.20, stackable: false, priority: 10 },
	 *   { name: 'Promo B', percentage: 0.15, stackable: false, priority: 20 }
	 * ]
	 * applyDiscounts(rules, Money.fromAmount(100))
	 * // => [{ name: 'Promo A', amount: $20.00 }]  // Only the best (20% > 15%)
	 *
	 * @example
	 * // No rules (not an error)
	 * applyDiscounts([], Money.fromAmount(100))
	 * // => []
	 */
	applyDiscounts(
		eligibleRules: DiscountRule[],
		subtotal: Money,
	): DiscountLine[] {
		if (eligibleRules.length === 0) {
			return [];
		}

		const sortedRules = [...eligibleRules].sort(
			(a, b) => a.priority - b.priority,
		);

		const hasNonStackableRule = sortedRules.some((rule) => !rule.stackable);

		if (hasNonStackableRule) {
			return this.applyBestSingleDiscount(sortedRules, subtotal);
		}

		return this.applyStackedDiscounts(sortedRules, subtotal);
	}

	/**
	 * Apply only the single best discount (highest percentage).
	 *
	 * Used when non-stackable rules are present.
	 *
	 * Business Logic:
	 * - Sort by percentage (descending)
	 * - Take the first (highest)
	 * - If multiple have same percentage, use priority as tiebreaker
	 *
	 * @param rules - Rules sorted by priority (but we re-sort by percentage here)
	 * @param subtotal - Amount to calculate discount from
	 * @returns Array with single discount line (or empty if all percentages are 0)
	 */
	private applyBestSingleDiscount(
		rules: DiscountRule[],
		subtotal: Money,
	): DiscountLine[] {
		const bestRule = rules.sort((a, b) => {
			const percentageDiff = b.discountPercentage - a.discountPercentage;
			if (percentageDiff !== 0) {
				return percentageDiff;
			}
			return a.priority - b.priority;
		})[0];

		if (bestRule.discountPercentage === 0) {
			return [];
		}

		const discountLine = DiscountLine.create(bestRule, subtotal);

		return [discountLine];
	}

	/**
	 * Apply all discounts in priority order.
	 *
	 * Used when all rules are stackable.
	 *
	 * Key Business Rule: Each discount is calculated from the ORIGINAL
	 * subtotal, not cumulatively.
	 *
	 * Example:
	 * - Subtotal: $100
	 * - Discount A: 10% → $10 (10% of $100)
	 * - Discount B: 5% → $5 (5% of $100, NOT 5% of $90)
	 * - Total discount: $15
	 * - Final: $100 - $15 = $85
	 *
	 * Alternative (Cumulative):
	 * - Discount A: 10% → $10
	 * - New subtotal: $90
	 * - Discount B: 5% → $4.50 (5% of $90)
	 * - Total discount: $14.50
	 * - Final: $85.50
	 *
	 * We chose non-cumulative because:
	 * 1. Simpler to explain ("You get 10% + 5% = 15% total")
	 * 2. More generous to customer (higher discount)
	 * 3. Matches most industry practices
	 *
	 * @param rules - Rules sorted by priority
	 * @param subtotal - Original amount (before any discounts)
	 * @returns Array of discount lines in priority order
	 */
	private applyStackedDiscounts(
		rules: DiscountRule[],
		subtotal: Money,
	): DiscountLine[] {
		return rules
			.filter((rule) => rule.discountPercentage > 0)
			.map((rule) => DiscountLine.create(rule, subtotal));
	}

	/**
	 * Calculate the total discount amount from multiple discount lines.
	 *
	 * This is a utility method for the handler to sum up all discounts.
	 * It's here (not in the handler) because it's domain logic: "how to
	 * combine discounts into a total."
	 *
	 * @param discountLines - Individual discounts to sum
	 * @returns Total discount amount
	 *
	 * @example
	 * const lines = [
	 *   { amount: Money.fromAmount(10) },
	 *   { amount: Money.fromAmount(5) }
	 * ]
	 * calculateTotalDiscount(lines) // => Money.fromAmount(15)
	 */
	calculateTotalDiscount(discountLines: DiscountLine[]): Money {
		if (discountLines.length === 0) {
			return Money.fromAmount(0);
		}

		return discountLines.reduce(
			(total, line) => total.add(line.amount),
			Money.fromAmount(0),
		);
	}
}
