export class CalculateQuoteQuery {
	constructor(
		public readonly equipmentTypeId: string,
		public readonly startDate: Date,
		public readonly endDate: Date,
		public readonly quantity?: number,
		public readonly customerId?: string,
		public readonly promoCode?: string,
	) {}
}
