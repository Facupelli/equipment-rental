import { randomUUID } from 'node:crypto';

export interface BillingUnitProps {
  id: string;
  tenantId: string;
  name: string;
  durationHours: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateBillingUnitProps = Omit<BillingUnitProps, 'id' | 'createdAt' | 'updatedAt'>;

export class BillingUnit {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private _durationHours: number;
  private _sortOrder: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: BillingUnitProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._name = props.name;
    this._durationHours = props.durationHours;
    this._sortOrder = props.sortOrder;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateBillingUnitProps): BillingUnit {
    BillingUnit.assertValidDuration(props.durationHours);
    BillingUnit.assertValidSortOrder(props.sortOrder);

    const now = new Date();
    return new BillingUnit({ id: randomUUID(), ...props, createdAt: now, updatedAt: now });
  }

  public static reconstitute(props: BillingUnitProps): BillingUnit {
    return new BillingUnit(props);
  }

  // --- Behavior ---
  public update(name: string, durationHours: number, sortOrder: number): void {
    BillingUnit.assertValidDuration(durationHours);
    BillingUnit.assertValidSortOrder(sortOrder);

    this._name = name;
    this._durationHours = durationHours;
    this._sortOrder = sortOrder;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get name(): string {
    return this._name;
  }
  get durationHours(): number {
    return this._durationHours;
  }
  get sortOrder(): number {
    return this._sortOrder;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private static assertValidDuration(durationHours: number): void {
    if (durationHours <= 0) {
      throw new Error(`durationHours must be positive, received: ${durationHours}`);
    }
  }

  private static assertValidSortOrder(sortOrder: number): void {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new Error(`sortOrder must be a non-negative integer, received: ${sortOrder}`);
    }
  }
}
