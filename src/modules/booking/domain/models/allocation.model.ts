export class Allocation {
	constructor(
		public readonly id: string,
		public readonly equipmentUnitId: string,
		public readonly startDate: Date,
		public readonly endDate: Date,
	) {
		if (endDate <= startDate) {
			throw new Error("End date must be after start date.");
		}
	}

	static create(
		id: string,
		equipmentUnitId: string,
		startDate: Date,
		endDate: Date,
	): Allocation {
		return new Allocation(id, equipmentUnitId, startDate, endDate);
	}

	static reconstitute(
		id: string,
		equipmentUnitId: string,
		startDate: Date,
		endDate: Date,
	): Allocation {
		return new Allocation(id, equipmentUnitId, startDate, endDate);
	}

	overlaps(other: Allocation): boolean {
		return this.startDate < other.endDate && this.endDate > other.startDate;
	}

	get durationInDays(): number {
		const diff = this.endDate.getTime() - this.startDate.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}
}
