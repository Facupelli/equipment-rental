import type { Money } from "../value-objects/money";

export class RateStructure {
	constructor(
		public readonly id: string,
		public readonly equipmentTypeId: string,
		public readonly hourlyRate: Money,
		public readonly dailyRate: Money,
		public readonly minimumCharge: Money,
		public readonly taxPercentage: number,
		public readonly effectiveFrom: Date,
		public readonly effectiveTo?: Date,
	) {
		if (hourlyRate.isNegative() || dailyRate.isNegative()) {
			throw new Error("Rates must be positive");
		}
		if (taxPercentage < 0 || taxPercentage > 1) {
			throw new Error("Tax percentage must be between 0 and 1");
		}
	}

	static create(
		id: string,
		equipmentTypeId: string,
		hourlyRate: Money,
		dailyRate: Money,
		minimumCharge: Money,
		taxPercentage: number,
		effectiveFrom: Date,
		effectiveTo?: Date,
	): RateStructure {
		return new RateStructure(
			id,
			equipmentTypeId,
			hourlyRate,
			dailyRate,
			minimumCharge,
			taxPercentage,
			effectiveFrom,
			effectiveTo,
		);
	}

	static reconstitute(
		id: string,
		equipmentTypeId: string,
		hourlyRate: Money,
		dailyRate: Money,
		minimumCharge: Money,
		taxPercentage: number,
		effectiveFrom: Date,
		effectiveTo?: Date,
	): RateStructure {
		return new RateStructure(
			id,
			equipmentTypeId,
			hourlyRate,
			dailyRate,
			minimumCharge,
			taxPercentage,
			effectiveFrom,
			effectiveTo,
		);
	}

	isEffectiveAt(date: Date): boolean {
		const from = this.effectiveFrom.getTime();
		const to = this.effectiveTo?.getTime() ?? Infinity;
		const target = date.getTime();
		return target >= from && target <= to;
	}
}
