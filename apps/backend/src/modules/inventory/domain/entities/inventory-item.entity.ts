import { InventoryItemStatus, TrackingType } from '@repo/types';
import { randomUUID } from 'node:crypto';

export interface InventoryItemProps {
  id: string;
  tenantId: string;
  productId: string;
  locationId: string;
  ownerId: string;
  status: InventoryItemStatus;
  totalQuantity: number;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchaseCost: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateInventoryItemProps = Omit<InventoryItemProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: InventoryItemStatus;
};

export class InventoryItem {
  private readonly id: string;
  private readonly tenantId: string;
  private readonly productId: string;

  private _locationId: string;
  private _ownerId: string;
  private _status: InventoryItemStatus;
  private _totalQuantity: number;
  private _serialNumber: string | null;

  private readonly purchaseDate: Date | null;
  private _purchaseCost: number | null;

  private readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: InventoryItemProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.productId = props.productId;
    this._locationId = props.locationId;
    this._ownerId = props.ownerId;
    this._status = props.status;
    this._totalQuantity = props.totalQuantity;
    this._serialNumber = props.serialNumber;
    this.purchaseDate = props.purchaseDate;
    this._purchaseCost = props.purchaseCost;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateInventoryItemProps, productTrackingType: TrackingType): InventoryItem {
    const id = randomUUID();
    const now = new Date();

    console.log(typeof props.totalQuantity);

    // Invariant: Serialized items must have a quantity of 1
    if (productTrackingType === TrackingType.SERIALIZED) {
      if (props.totalQuantity !== 1) {
        throw new Error('Serialized items must have a quantity of exactly 1.');
      }
      if (!props.serialNumber) {
        throw new Error('Serialized items require a serial number.');
      }
    }

    // Invariant: Bulk items cannot have a serial number
    if (productTrackingType === TrackingType.BULK && props.serialNumber) {
      throw new Error('Bulk items cannot be assigned a serial number.');
    }

    // Invariant: Quantity must be positive
    if (props.totalQuantity < 1) {
      throw new Error('Total quantity must be at least 1.');
    }

    return new InventoryItem({
      id,
      ...props,
      status: props.status ?? InventoryItemStatus.OPERATIONAL,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }

  // --- Behaviors ---
  public moveTo(newLocationId: string): void {
    if (this._status === InventoryItemStatus.RETIRED) {
      throw new Error('Cannot move a retired item.');
    }
    this._locationId = newLocationId;
    this._updatedAt = new Date();
  }

  public changeOwner(newOwnerId: string): void {
    this._ownerId = newOwnerId;
    this._updatedAt = new Date();
  }

  public markForMaintenance(): void {
    if (this._status === InventoryItemStatus.MAINTENANCE) return;

    this._status = InventoryItemStatus.MAINTENANCE;
    this._updatedAt = new Date();
  }

  public markOperational(): void {
    this._status = InventoryItemStatus.OPERATIONAL;
    this._updatedAt = new Date();
  }

  public retire(): void {
    this._status = InventoryItemStatus.RETIRED;
    this._updatedAt = new Date();
  }

  // Adjust quantity for BULK items only
  public adjustQuantity(newQuantity: number): void {
    if (this._serialNumber) {
      throw new Error('Cannot adjust quantity of a serialized item.');
    }
    if (newQuantity < 0) {
      throw new Error('Quantity cannot be negative.');
    }
    this._totalQuantity = newQuantity;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get Id(): string {
    return this.id;
  }
  get TenantId(): string {
    return this.tenantId;
  }
  get ProductId(): string {
    return this.productId;
  }
  get LocationId(): string {
    return this._locationId;
  }
  get OwnerId(): string {
    return this._ownerId;
  }
  get Status(): InventoryItemStatus {
    return this._status;
  }
  get TotalQuantity(): number {
    return this._totalQuantity;
  }
  get SerialNumber(): string | null {
    return this._serialNumber;
  }
  get PurchaseDate(): Date | null {
    return this.purchaseDate;
  }
  get PurchaseCost(): number | null {
    return this._purchaseCost;
  }
  get CreatedAt(): Date {
    return this.createdAt;
  }
  get UpdatedAt(): Date {
    return this._updatedAt;
  }
}
