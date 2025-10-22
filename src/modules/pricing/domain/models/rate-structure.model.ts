import type { Money } from "../value-objects/money";

export class RateStructure {
	constructor(
		readonly id: string,
		readonly equipmentTypeId: string,
		readonly hourlyRate: Money,
		readonly dailyRate: Money,
		readonly minimumCharge: Money,
		readonly taxPercentage: number,
		readonly effectiveFrom: Date,
		readonly effectiveTo?: Date,
	) {
		if (hourlyRate.isNegative() || dailyRate.isNegative()) {
			throw new Error("Rates must be positive");
		}
		if (taxPercentage < 0 || taxPercentage > 1) {
			throw new Error("Tax percentage must be between 0 and 1");
		}
	}

	isEffectiveAt(date: Date): boolean {
		const from = this.effectiveFrom.getTime();
		const to = this.effectiveTo?.getTime() ?? Infinity;
		const target = date.getTime();
		return target >= from && target <= to;
	}
}
