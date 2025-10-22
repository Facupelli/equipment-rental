export class DiscountRule {
	constructor(
		readonly id: string,
		readonly name: string,
		readonly type: DiscountType,
		readonly discountPercentage: number,
		readonly eligibilityCriteria: Record<string, any>,
		readonly validFrom: Date,
		readonly validUntil: Date,
		readonly isActive: boolean,
		readonly stackable: boolean,
		readonly priority: number,
	) {
		if (discountPercentage < 0 || discountPercentage > 1) {
			throw new Error("Discount percentage must be between 0 and 1");
		}
	}

	isApplicableAt(date: Date): boolean {
		const t = date.getTime();
		return (
			this.isActive &&
			t >= this.validFrom.getTime() &&
			t <= this.validUntil.getTime()
		);
	}
}

export type DiscountType = "LOYALTY" | "PROMO" | "VOLUME" | "SEASONAL";
