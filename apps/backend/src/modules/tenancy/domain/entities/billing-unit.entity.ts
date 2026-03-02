import { randomUUID } from 'node:crypto';
import {
  EmptyBillingUnitNameException,
  InvalidBillingUnitDurationException,
} from '../exceptions/billing-unit.exceptions';

export interface CreateBillingUnitProps {
  tenantId: string;
  name: string;
  durationHours: number;
  sortOrder: number;
}

interface ReconstituteBillingUnitProps {
  id: string;
  tenantId: string;
  name: string;
  durationHours: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BillingUnit {
  get name(): string {
    return this._name;
  }
  get durationHours(): number {
    return this._durationHours;
  }
  get sortOrder(): number {
    return this._sortOrder;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly createdAt: Date,

    private _name: string,
    private _durationHours: number,
    private _sortOrder: number,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateBillingUnitProps): BillingUnit {
    if (!props.name || props.name.trim().length === 0) {
      throw new EmptyBillingUnitNameException();
    }

    if (props.durationHours <= 0) {
      throw new InvalidBillingUnitDurationException();
    }

    const now = new Date();

    return new BillingUnit(
      randomUUID(),
      props.tenantId,
      now,
      props.name.trim(),
      props.durationHours,
      props.sortOrder,
      now, // updatedAt matches createdAt on creation
    );
  }

  static reconstitute(props: ReconstituteBillingUnitProps): BillingUnit {
    return new BillingUnit(
      props.id,
      props.tenantId,
      props.createdAt,
      props.name,
      props.durationHours,
      props.sortOrder,
      props.updatedAt,
    );
  }

  updateDetails(name: string, durationHours: number): void {
    if (!name || name.trim().length === 0) {
      throw new EmptyBillingUnitNameException();
    }
    if (durationHours <= 0) {
      throw new InvalidBillingUnitDurationException();
    }

    this._name = name.trim();
    this._durationHours = durationHours;
    this._updatedAt = new Date();
  }
}
