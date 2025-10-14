export enum EquipmentStatus {
  Available = "AVAILABLE",
  Allocated = "ALLOCATED",
  InUse = "IN_USE",
  Maintenance = "MAINTENANCE",
  Retired = "RETIRED",
}

export class EquipmentItem {
  private constructor(
    public readonly id: string,
    public readonly equipmentTypeId: string,
    public readonly serialNumber: string,
    private _status: EquipmentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    equipmentTypeId: string,
    serialNumber: string
  ): EquipmentItem {
    return new EquipmentItem(
      id,
      equipmentTypeId,
      serialNumber,
      EquipmentStatus.Available,
      new Date(),
      new Date()
    );
  }

  static reconstitute(
    id: string,
    equipmentTypeId: string,
    serialNumber: string,
    status: EquipmentStatus,
    createdAt: Date,
    updatedAt: Date
  ): EquipmentItem {
    return new EquipmentItem(
      id,
      equipmentTypeId,
      serialNumber,
      status,
      createdAt,
      updatedAt
    );
  }

  get status(): EquipmentStatus {
    return this._status;
  }

  // Business rule: Can only allocate if currently available
  allocate(): void {
    if (this._status !== EquipmentStatus.Available) {
      throw new Error(
        `Cannot allocate equipment ${this.serialNumber}. Current status: ${this._status}`
      );
    }
    this._status = EquipmentStatus.Allocated;
  }

  // Business rule: Can release from allocation or in-use status
  makeAvailable(): void {
    if (
      this._status !== EquipmentStatus.Allocated &&
      this._status !== EquipmentStatus.InUse
    ) {
      throw new Error(
        `Cannot make equipment ${this.serialNumber} available. Current status: ${this._status}`
      );
    }
    this._status = EquipmentStatus.Available;
  }

  // Business rule: Can mark for maintenance from any status except retired
  markForMaintenance(): void {
    if (this._status === EquipmentStatus.Retired) {
      throw new Error(
        `Cannot mark retired equipment ${this.serialNumber} for maintenance`
      );
    }
    this._status = EquipmentStatus.Maintenance;
  }

  // Business rule: Cannot unretire equipment
  retire(): void {
    if (this._status === EquipmentStatus.Retired) {
      throw new Error(`Equipment ${this.serialNumber} is already retired`);
    }
    this._status = EquipmentStatus.Retired;
  }

  // Business rule: Only allocated equipment can be marked as in use
  markAsInUse(): void {
    if (this._status !== EquipmentStatus.Allocated) {
      throw new Error(
        `Cannot mark equipment ${this.serialNumber} as in use. Must be allocated first. Current status: ${this._status}`
      );
    }
    this._status = EquipmentStatus.InUse;
  }

  // Helper: Check if equipment is rentable (counts toward capacity)
  isRentable(): boolean {
    return (
      this._status === EquipmentStatus.Available ||
      this._status === EquipmentStatus.Allocated
    );
  }
}
