import type { DiscountLine } from "./discount-line";
import { Money } from "./money";
import type { RentalDuration } from "./rental-duration";

export class Quote {
	constructor(
		readonly equipmentTypeId: string,
		readonly startDate: Date,
		readonly endDate: Date,
		readonly duration: RentalDuration,
		readonly baseRate: Money,
		readonly subtotal: Money,
		readonly discountsApplied: readonly DiscountLine[],
		readonly totalDiscount: Money,
		readonly subtotalAfterDiscounts: Money,
		readonly taxAmount: Money,
		readonly total: Money,
		readonly calculatedAt: Date = new Date(),
		readonly quantity: number,
	) {
		Object.freeze(this);
	}

	static create(params: {
		equipmentTypeId: string;
		startDate: Date;
		endDate: Date;
		duration: RentalDuration;
		baseRate: Money;
		subtotal: Money;
		discountsApplied: DiscountLine[];
		taxPercentage: number; // We'll calculate tax inside here
		quantity: number;
	}): Quote {
		const totalDiscount = params.discountsApplied.reduce(
			(sum, line) => sum.add(line.amount),
			Money.fromAmount(0),
		);

		const subtotalAfterDiscounts = params.subtotal.subtract(totalDiscount);
		const taxAmount = subtotalAfterDiscounts.percentage(params.taxPercentage);
		const total = subtotalAfterDiscounts.add(taxAmount);

		return new Quote(
			params.equipmentTypeId,
			params.startDate,
			params.endDate,
			params.duration,
			params.baseRate,
			params.subtotal,
			Object.freeze([...params.discountsApplied]),
			totalDiscount,
			subtotalAfterDiscounts,
			taxAmount,
			total,
			new Date(),
			params.quantity,
		);
	}
}
