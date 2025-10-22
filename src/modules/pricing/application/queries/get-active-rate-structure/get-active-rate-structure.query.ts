export class GetActiveRateStructureQuery {
	constructor(
		public readonly equipmentTypeId: string,
		public readonly date: Date,
	) {}
}
