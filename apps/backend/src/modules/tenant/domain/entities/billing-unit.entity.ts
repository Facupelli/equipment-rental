import { randomUUID } from 'crypto';
import {
  InvalidBillingUnitDurationException,
  InvalidBillingUnitLabelException,
} from '../exceptions/billing-unit.exceptions';

export interface CreateBillingUnitProps {
  label: string;
  durationMinutes: number;
  sortOrder: number;
}

export interface ReconstituteBillingUnitProps {
  id: string;
  label: string;
  durationMinutes: number;
  sortOrder: number;
}

export class BillingUnit {
  private constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly durationMinutes: number,
    public readonly sortOrder: number,
  ) {}

  static create(props: CreateBillingUnitProps): BillingUnit {
    if (!props.label || props.label.trim().length === 0) {
      throw new InvalidBillingUnitLabelException();
    }
    if (props.durationMinutes <= 0) {
      throw new InvalidBillingUnitDurationException();
    }
    return new BillingUnit(randomUUID(), props.label.trim(), props.durationMinutes, props.sortOrder);
  }

  static reconstitute(props: ReconstituteBillingUnitProps): BillingUnit {
    return new BillingUnit(props.id, props.label, props.durationMinutes, props.sortOrder);
  }
}
