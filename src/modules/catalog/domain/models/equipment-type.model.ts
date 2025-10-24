export class EquipmentType {
	private _bufferDays: number;
	private _description: string | null;

	constructor(
		public readonly id: string,
		public readonly name: string,
		description: string | null,
		public readonly categoryId: string,
		public readonly brand: string,
		public readonly model: string,
		bufferDays: number,
		public readonly createdAt: Date,
	) {
		this._bufferDays = bufferDays;
		this._description = description;
	}

	get description(): string | null {
		return this._description;
	}

	get bufferDays(): number {
		return this._bufferDays;
	}

	static create(
		id: string,
		name: string,
		description: string | null,
		categoryId: string,
		brand: string,
		model: string,
		bufferDays: number,
	): EquipmentType {
		return new EquipmentType(
			id,
			name,
			description,
			categoryId,
			brand,
			model,
			bufferDays,
			new Date(),
		);
	}

	static reconstitute(
		id: string,
		name: string,
		description: string | null,
		categoryId: string,
		brand: string,
		model: string,
		bufferDays: number,
		createdAt: Date,
	): EquipmentType {
		return new EquipmentType(
			id,
			name,
			description,
			categoryId,
			brand,
			model,
			bufferDays,
			createdAt,
		);
	}

	updateDescription(newDescription: string | null): void {
		if (newDescription !== null && newDescription.trim().length === 0) {
			throw new Error("Description cannot be empty string; use null instead");
		}
		this._description = newDescription;
	}

	updateBufferDays(days: number): void {
		if (days < 0) {
			throw new Error("Buffer days cannot be negative");
		}
		if (!Number.isInteger(days)) {
			throw new Error("Buffer days must be a whole number");
		}
		this._bufferDays = days;
	}

	hasBuffer(): boolean {
		return this._bufferDays > 0;
	}

	getBufferHours(): number {
		return this._bufferDays * 24;
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
