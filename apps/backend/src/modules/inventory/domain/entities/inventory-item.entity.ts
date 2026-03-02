import { InventoryItemStatus, TrackingType } from '@repo/types';
import { randomUUID } from 'node:crypto';
import { BlackoutPeriod } from './blackout-period.entity';
import { DateRange } from '../value-objects/date-range.vo';
import { InvalidInventoryItemException } from '../exceptions/inventory-item.exceptions';

export interface InventoryItemProps {
  id: string;
  tenantId: string;
  productId: string;
  locationId: string;
  ownerId: string | null;
  status: InventoryItemStatus;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchaseCost: number | null;
  blackouts: BlackoutPeriod[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateInventoryItemProps = Omit<InventoryItemProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: InventoryItemStatus;
};

export interface AddBlackoutProps {
  id: string;
  reason: string;
  blockedPeriod: DateRange;
}

export class InventoryItem {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _productId: string;
  private _locationId: string;
  private _ownerId: string | null;
  private _status: InventoryItemStatus;
  private _serialNumber: string | null;
  private _blackouts: BlackoutPeriod[];
  private _newBlackouts: BlackoutPeriod[] = [];
  private readonly _purchaseDate: Date | null;
  private _purchaseCost: number | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: InventoryItemProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._productId = props.productId;
    this._locationId = props.locationId;
    this._ownerId = props.ownerId;
    this._status = props.status;
    this._serialNumber = props.serialNumber;
    this._blackouts = props.blackouts;
    this._purchaseDate = props.purchaseDate;
    this._purchaseCost = props.purchaseCost;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateInventoryItemProps, productTrackingType: TrackingType): InventoryItem {
    if (productTrackingType === TrackingType.SERIALIZED && !props.serialNumber) {
      throw new InvalidInventoryItemException('Serialized items require a serial number.');
    }

    if (productTrackingType === TrackingType.BULK && props.serialNumber) {
      throw new InvalidInventoryItemException('Bulk items cannot be assigned a serial number.');
    }

    return new InventoryItem({
      id: randomUUID(),
      ...props,
      status: props.status ?? InventoryItemStatus.OPERATIONAL,
      blackouts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }

  // --- Behaviors ---

  /**
   * Adds a blackout period to this item, enforcing two invariants:
   *
   * 1. A RETIRED item cannot receive new blackouts — it will never be rented again.
   * 2. No two blackout periods on the same item can overlap — this would create
   *    ambiguity in availability calculations and signals a data entry error.
   */
  public addBlackout(props: AddBlackoutProps): void {
    if (this._status === InventoryItemStatus.RETIRED) {
      throw new InvalidInventoryItemException('Cannot add a blackout period to a retired item.');
    }

    const hasOverlap = this._blackouts.some((existing) => existing.conflictsWith(props.blockedPeriod));
    if (hasOverlap) {
      throw new InvalidInventoryItemException(
        'The requested blackout period overlaps with an existing one on this item.',
      );
    }

    const blackout = BlackoutPeriod.create({
      id: props.id,
      tenantId: this._tenantId,
      inventoryItemId: this._id,
      reason: props.reason,
      blockedPeriod: props.blockedPeriod,
    });

    this._blackouts.push(blackout);
    this._newBlackouts.push(blackout);
    this._updatedAt = new Date();
  }

  public moveTo(newLocationId: string): void {
    if (this._status === InventoryItemStatus.RETIRED) {
      throw new InvalidInventoryItemException('Cannot move a retired item.');
    }
    this._locationId = newLocationId;
    this._updatedAt = new Date();
  }

  public changeOwner(newOwnerId: string): void {
    this._ownerId = newOwnerId;
    this._updatedAt = new Date();
  }

  public releaseOwnership(): void {
    this._ownerId = null;
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

  // --- Getters ---

  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get productId(): string {
    return this._productId;
  }
  get locationId(): string {
    return this._locationId;
  }
  get ownerId(): string | null {
    return this._ownerId;
  }
  get isOwnedByTenant(): boolean {
    return this._ownerId === null;
  }
  get status(): InventoryItemStatus {
    return this._status;
  }
  get serialNumber(): string | null {
    return this._serialNumber;
  }
  get blackouts(): ReadonlyArray<BlackoutPeriod> {
    return this._blackouts;
  }
  get newBlackouts(): ReadonlyArray<BlackoutPeriod> {
    return this._newBlackouts;
  }
  get purchaseDate(): Date | null {
    return this._purchaseDate;
  }
  get purchaseCost(): number | null {
    return this._purchaseCost;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
