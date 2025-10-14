import { ReservationId } from "src/modules/booking/domain/value-objects/reservation-id.vo";

export enum EquipmentStatus {
  Available = "AVAILABLE",
  Allocated = "ALLOCATED",
  InUse = "IN_USE",
  Maintenance = "MAINTENANCE",
  Retired = "RETIRED",
}

/**
 * Domain Entity: EquipmentItem
 *
 * Represents a single, trackable physical asset with a unique serial number.
 * This entity is focused on asset lifecycle management (registration, allocation, maintenance, retirement).
 *
 * Separation of Concerns:
 * - Booking module cares about "capacity" (how many units are available)
 * - Inventory module cares about "specific assets" (which serial numbers are allocated)
 */
export class EquipmentItem {
  id: string;

  /**
   * Reference to the equipment type (e.g., "excavator-cat-320")
   * Links to a shared Equipment Type catalog (future module boundary)
   */
  equipmentTypeId: string;

  /**
   * Physical asset identifier (e.g., manufacturer serial number, asset tag)
   * Must be unique across all equipment items
   */
  serialNumber: string;

  /**
   * Current lifecycle status of this specific asset
   */
  status: EquipmentStatus;

  /**
   * Reference to the reservation this item is allocated to (if ALLOCATED status)
   * Used for idempotency checks and audit trail
   */
  allocatedToReservationId: ReservationId | null;

  /**
   * When this allocation ends (item returns to AVAILABLE)
   * Used for future availability forecasting
   */
  allocatedUntil: Date | null;

  /**
   * Optimistic locking version
   * Automatically incremented by TypeORM on each update
   * Prevents race conditions when multiple processes try to allocate the same item
   */
  version: number;

  /**
   * Audit timestamps
   */
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;
    equipmentTypeId: string;
    serialNumber: string;
    status?: EquipmentStatus;
  }) {
    this.id = params.id;
    this.equipmentTypeId = params.equipmentTypeId;
    this.serialNumber = params.serialNumber;
    this.status = params.status ?? EquipmentStatus.Available;
    this.allocatedToReservationId = null;
    this.allocatedUntil = null;
    this.version = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(
    id: string,
    equipmentTypeId: string,
    serialNumber: string
  ): EquipmentItem {
    return new EquipmentItem({
      id,
      equipmentTypeId,
      serialNumber,
      status: EquipmentStatus.Available,
    });
  }

  allocate(reservationId: ReservationId, until: Date): void {
    if (this.status !== EquipmentStatus.Available) {
      throw new Error(
        `Cannot allocate equipment ${this.serialNumber}. Current status: ${this.status}`
      );
    }

    this.status = EquipmentStatus.Allocated;
    this.allocatedToReservationId = reservationId;
    this.allocatedUntil = until;
    this.updatedAt = new Date();
  }

  /**
   * Returns item to AVAILABLE status after rental period ends.
   * Can be called by a scheduled job or manual release command.
   */
  release(): void {
    if (this.status !== EquipmentStatus.Allocated) {
      throw new Error(
        `Cannot release equipment ${this.serialNumber}. Current status: ${this.status}`
      );
    }

    this.status = EquipmentStatus.Available;
    this.allocatedToReservationId = null;
    this.allocatedUntil = null;
    this.updatedAt = new Date();
  }

  /**
   * Check if this item is already allocated to a specific reservation
   * Used for idempotency in event handlers
   */
  isAllocatedTo(reservationId: ReservationId): boolean {
    return (
      this.status === EquipmentStatus.Allocated &&
      this.allocatedToReservationId === reservationId
    );
  }
}
