export enum EquipmentStatus {
  Available = "AVAILABLE",
  Lost = "LOST",
  Maintenance = "MAINTENANCE",
  Retired = "RETIRED",
}

export class EquipmentItem {
  id: string;
  equipmentTypeId: string;
  serialNumber: string;
  status: EquipmentStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EquipmentItem>) {
    Object.assign(this, partial);
  }

  isAvailable(): boolean {
    return this.status === EquipmentStatus.Available;
  }

  canBeRented(): boolean {
    return this.status === EquipmentStatus.Available;
  }

  markAsAvailable(): void {
    if (this.status === EquipmentStatus.Retired) {
      throw new Error("Cannot make retired equipment available");
    }
    this.status = EquipmentStatus.Available;
  }

  markAsInMaintenance(): void {
    if (this.status === EquipmentStatus.Retired) {
      throw new Error("Cannot maintain retired equipment");
    }
    this.status = EquipmentStatus.Maintenance;
  }

  retire(): void {
    this.status = EquipmentStatus.Retired;
  }
}
