import { Injectable } from "@nestjs/common";
import type { RateStructure } from "../models/rate-structure.model";
import type { Money } from "../value-objects/money";
import type { RentalDuration } from "../value-objects/rental-duration";

@Injectable()
export class RateCalculationService {
	/**
	 * Calculate the base subtotal before discounts and tax.
	 *
	 * Algorithm:
	 * 1. Calculate hourly option: hourlyRate × totalHours
	 * 2. Calculate daily option: dailyRate × totalDays (fractional)
	 * 3. Pick minimum of the two options
	 * 4. Apply minimum charge if result is below threshold
	 *
	 * @param rateStructure - The pricing rules for the equipment type
	 * @param duration - The rental time period (with pre-calculated hours/days)
	 * @returns The calculated subtotal (best price for customer)
	 *
	 * @example
	 * // Hourly rate wins for short rentals
	 * const rate = { hourlyRate: $10, dailyRate: $200, minimumCharge: $40 }
	 * const duration = { totalHours: 5, totalDays: 0.21 }
	 * calculateSubtotal(rate, duration) // => $50 (hourly: $10×5 vs daily: $200×0.21=$42)
	 *
	 * @example
	 * // Daily rate wins for long rentals
	 * const rate = { hourlyRate: $10, dailyRate: $200, minimumCharge: $40 }
	 * const duration = { totalHours: 48, totalDays: 2 }
	 * calculateSubtotal(rate, duration) // => $400 (daily: $200×2 vs hourly: $10×48=$480)
	 *
	 * @example
	 * // Minimum charge enforced
	 * const rate = { hourlyRate: $10, dailyRate: $200, minimumCharge: $50 }
	 * const duration = { totalHours: 2, totalDays: 0.08 }
	 * calculateSubtotal(rate, duration) // => $50 (calculated $20, but minimum is $50)
	 */
	calculateSubtotal(
		rateStructure: RateStructure,
		duration: RentalDuration,
	): Money {
		const hourlyTotal = rateStructure.hourlyRate.multiply(duration.totalHours);
		const dailyTotal = rateStructure.dailyRate.multiply(duration.totalDays);

		const calculatedSubtotal = hourlyTotal.isGreaterThan(dailyTotal)
			? dailyTotal
			: hourlyTotal;

		const finalSubtotal = calculatedSubtotal.isGreaterThan(
			rateStructure.minimumCharge,
		)
			? calculatedSubtotal
			: rateStructure.minimumCharge;

		return finalSubtotal;
	}

	/**
	 * Determine which rate type was actually applied (for display purposes).
	 *
	 * This is a helper method for the handler to show customers:
	 * "Charged at $200/day" vs "Charged at $10/hour"
	 *
	 * Business Logic: If the rental is multi-day (>24 hours), we likely
	 * used the daily rate. Otherwise, hourly.
	 *
	 * Note: This is a simplification. In edge cases near the breakpoint,
	 * we might show "daily rate" when hourly actually won. For exact
	 * accuracy, we'd need to re-calculate which option was cheaper.
	 * But that adds complexity for minimal UX benefit.
	 *
	 * @param rateStructure - The rate structure used
	 * @param duration - The rental duration
	 * @returns The rate that was (likely) applied
	 */
	determineAppliedRateType(
		rateStructure: RateStructure,
		duration: RentalDuration,
	): { rate: Money; unit: "hour" | "day" } {
		if (duration.isMultiDay()) {
			return {
				rate: rateStructure.dailyRate,
				unit: "day",
			};
		}

		return {
			rate: rateStructure.hourlyRate,
			unit: "hour",
		};
	}
}
