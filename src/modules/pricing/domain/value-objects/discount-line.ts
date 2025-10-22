import type { DiscountRule } from "../models/discount-rule";
import type { Money } from "./money";

export class DiscountLine {
	constructor(
		public readonly ruleId: string,
		public readonly name: string,
		public readonly percentage: number,
		public readonly amount: Money,
		public readonly appliedAt: Date,
	) {}

	static create(rule: DiscountRule, subtotal: Money): DiscountLine {
		const amount = subtotal.percentage(rule.discountPercentage);
		return new DiscountLine(
			rule.id,
			rule.name,
			rule.discountPercentage,
			amount,
			new Date(),
		);
	}
}
