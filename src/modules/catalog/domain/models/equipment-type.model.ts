export class EquipmentType {
	private _bufferDays: number;

	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string | null,
		public readonly categoryId: string,
		public bufferDays: number,
		public readonly createdAt: Date,
	) {
		this._bufferDays = bufferDays;
	}

	static create(
		id: string,
		name: string,
		description: string | null,
		categoryId: string,
		bufferDays: number,
	): EquipmentType {
		return new EquipmentType(
			id,
			name,
			description,
			categoryId,
			bufferDays,
			new Date(),
		);
	}

	static reconstitute(
		id: string,
		name: string,
		description: string | null,
		categoryId: string,
		bufferDays: number,
		createdAt: Date,
	): EquipmentType {
		return new EquipmentType(
			id,
			name,
			description,
			categoryId,
			bufferDays,
			createdAt,
		);
	}

	hasBuffer(): boolean {
		return this._bufferDays > 0;
	}

	getBufferHours(): number {
		return this._bufferDays * 24;
	}

	setBufferDays(days: number): void {
		if (days < 0) {
			throw new Error("Buffer days cannot be negative");
		}
		this._bufferDays = days;
	}

	requiresMaintenanceTime(): boolean {
		return this._bufferDays > 0;
	}

	calculateAvailableStartDate(previousEndDate: Date): Date {
		const availableDate = new Date(previousEndDate);
		availableDate.setDate(availableDate.getDate() + this._bufferDays);
		return availableDate;
	}
}
