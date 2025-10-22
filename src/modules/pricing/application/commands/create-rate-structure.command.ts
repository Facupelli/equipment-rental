export class CreateRateStructureCommand {
	constructor(
		public readonly equipmentTypeId: string,
		public readonly hourlyRate: number,
		public readonly dailyRate: number,
		public readonly minimumCharge: number,
		public readonly taxPercentage: number,
		public readonly effectiveFrom: Date,
		public readonly effectiveTo?: Date,
	) {}
}
