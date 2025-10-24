export enum EquipmentStatus {
	AVAILABLE = "AVAILABLE",
	MAINTENANCE = "MAINTENANCE",
	LOST = "LOST",
	RETIRED = "RETIRED",
}

export class StatusChange {
	constructor(
		public readonly newStatus: EquipmentStatus,
		public readonly reason: string,
		public readonly changedAt: Date,
		public readonly previousStatus?: EquipmentStatus,
	) {}
}

export class LocationChange {
	constructor(
		public readonly newLocationId: string,
		public readonly reason: string,
		public readonly changedAt: Date,
		public readonly previousLocationId?: string,
	) {}
}

export class EquipmentItem {
	private _status: EquipmentStatus;
	private _statusHistory: StatusChange[];
	private _currentLocationId: string;
	private _locationHistory: LocationChange[];

	constructor(
		public readonly id: string,
		public readonly equipmentTypeId: string,
		currentLocationId: string,
		public readonly serialNumber: string,
		status: EquipmentStatus,
		public readonly createdAt: Date,
		statusHistory: StatusChange[] = [],
		locationHistory: LocationChange[] = [],
		public updatedAt?: Date,
		public readonly version: number = 1,
	) {
		this._status = status;
		this._statusHistory = statusHistory;
		this._locationHistory = locationHistory;
		this._currentLocationId = currentLocationId;
	}

	static register(
		id: string,
		equipmentTypeId: string,
		serialNumber: string,
		currentLocationId: string,
	): EquipmentItem {
		const now = new Date();
		const initialStatus = EquipmentStatus.AVAILABLE;

		const statusHistory = [
			new StatusChange(initialStatus, "Equipment registered in system", now),
		];

		const locationHistory = [
			new LocationChange(currentLocationId, "Equipment registered", now),
		];

		return new EquipmentItem(
			id,
			equipmentTypeId,
			currentLocationId,
			serialNumber,
			initialStatus,
			now,
			statusHistory,
			locationHistory,
			now,
			1,
		);
	}

	static reconstitute(
		id: string,
		equipmentTypeId: string,
		serialNumber: string,
		status: EquipmentStatus,
		createdAt: Date,
		statusHistory: StatusChange[],
		locationHistory: LocationChange[],
		updatedAt: Date,
		version: number,
		currentLocationId: string,
	): EquipmentItem {
		return new EquipmentItem(
			id,
			equipmentTypeId,
			currentLocationId,
			serialNumber,
			status,
			createdAt,
			statusHistory,
			locationHistory,
			updatedAt,
			version,
		);
	}

	get currentLocationId(): string {
		return this._currentLocationId;
	}

	get locationHistory(): ReadonlyArray<LocationChange> {
		return this._locationHistory;
	}

	get status(): EquipmentStatus {
		return this._status;
	}

	get statusHistory(): ReadonlyArray<StatusChange> {
		return this._statusHistory;
	}

	isAvailable(): boolean {
		return this._status === EquipmentStatus.AVAILABLE;
	}

	canBeRented(): boolean {
		return this._status === EquipmentStatus.AVAILABLE;
	}

	isRetired(): boolean {
		return this._status === EquipmentStatus.RETIRED;
	}

	markAsAvailable(): void {
		if (this._status === EquipmentStatus.RETIRED) {
			throw new Error(
				"Cannot reactivate retired equipment. Register a new item instead.",
			);
		}

		// Business rule: If coming from maintenance, might want to require inspection
		if (this._status === EquipmentStatus.MAINTENANCE) {
			// Future: Check if maintenance record is closed
			this._recordStatusChange(
				EquipmentStatus.AVAILABLE,
				"Returned to service after maintenance",
			);
		} else if (this._status === EquipmentStatus.LOST) {
			this._recordStatusChange(
				EquipmentStatus.AVAILABLE,
				"Equipment recovered",
			);
		} else {
			this._recordStatusChange(
				EquipmentStatus.AVAILABLE,
				"Marked as available",
			);
		}
	}

	markAsInMaintenance(reason: string): void {
		if (!reason || reason.trim().length === 0) {
			throw new Error("Maintenance reason is required for audit trail");
		}

		if (this._status === EquipmentStatus.RETIRED) {
			throw new Error("Cannot maintain retired equipment");
		}

		this._recordStatusChange(EquipmentStatus.MAINTENANCE, reason);
	}

	markAsLost(reason: string): void {
		if (!reason || reason.trim().length === 0) {
			throw new Error(
				"Loss reason is required for insurance and audit purposes",
			);
		}

		// Business rule: Cannot mark retired equipment as lost
		if (this._status === EquipmentStatus.RETIRED) {
			throw new Error("Equipment is already retired");
		}

		this._recordStatusChange(EquipmentStatus.LOST, reason);
	}

	retire(reason: string): void {
		if (!reason || reason.trim().length === 0) {
			throw new Error(
				"Retirement reason is required for asset management records",
			);
		}

		this._recordStatusChange(EquipmentStatus.RETIRED, reason);
	}

	private _recordStatusChange(
		newStatus: EquipmentStatus,
		reason: string,
	): void {
		const previousStatus = this._status;
		this._status = newStatus;
		this.updatedAt = new Date();

		this._statusHistory.push(
			new StatusChange(newStatus, reason, new Date(), previousStatus),
		);
	}
}
