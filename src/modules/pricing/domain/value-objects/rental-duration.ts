export class RentalDuration {
	private constructor(
		public readonly startDate: Date,
		public readonly endDate: Date,
		public readonly totalHours: number,
		public readonly totalDays: number,
	) {}

	static between(startDate: Date, endDate: Date): RentalDuration {
		if (startDate >= endDate) {
			throw new Error("Start date must be before end date");
		}

		const milliseconds = endDate.getTime() - startDate.getTime();
		const hours = milliseconds / (1000 * 60 * 60);

		const totalHours = Math.ceil(hours);
		const totalDays = totalHours / 24;

		return new RentalDuration(startDate, endDate, totalHours, totalDays);
	}

	isMultiDay(): boolean {
		return this.totalHours > 24;
	}

	toString(): string {
		return `${this.totalHours}h (${this.totalDays.toFixed(2)} days)`;
	}
}
