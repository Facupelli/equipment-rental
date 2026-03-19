import { randomUUID } from 'crypto';
import Decimal from 'decimal.js';
import { ContractBasis } from 'src/generated/prisma/client';
import { ShareSplit } from '../value-objects/share-split.vo';
import {
  ContractAlreadyInactiveException,
  InvalidContractPeriodException,
} from '../expcetions/owner-contract.exceptions';

export interface CreateOwnerContractProps {
  tenantId: string;
  ownerId: string;
  assetId: string | null;
  shares: ShareSplit;
  basis: ContractBasis;
  validFrom: Date;
  validUntil: Date | null;
  notes: string | null;
}

export interface ReconstituteOwnerContractProps {
  id: string;
  tenantId: string;
  ownerId: string;
  assetId: string | null;
  shares: ShareSplit;
  basis: ContractBasis;
  validFrom: Date;
  validUntil: Date | null;
  notes: string | null;
  isActive: boolean;
}

export class OwnerContract {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly assetId: string | null,
    public readonly shares: ShareSplit,
    public readonly basis: ContractBasis,
    public readonly validFrom: Date,
    public readonly validUntil: Date | null,
    public readonly notes: string | null,
    private _isActive: boolean,
  ) {}

  static create(props: CreateOwnerContractProps): OwnerContract {
    if (props.validUntil !== null && props.validUntil <= props.validFrom) {
      throw new InvalidContractPeriodException();
    }

    return new OwnerContract(
      randomUUID(),
      props.tenantId,
      props.ownerId,
      props.assetId,
      props.shares,
      props.basis,
      props.validFrom,
      props.validUntil,
      props.notes?.trim() ?? null,
      true,
    );
  }

  static reconstitute(props: ReconstituteOwnerContractProps): OwnerContract {
    return new OwnerContract(
      props.id,
      props.tenantId,
      props.ownerId,
      props.assetId,
      props.shares,
      props.basis,
      props.validFrom,
      props.validUntil,
      props.notes,
      props.isActive,
    );
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get ownerShare(): Decimal {
    return this.shares.ownerShare;
  }

  get rentalShare(): Decimal {
    return this.shares.rentalShare;
  }

  /**
   * Whether this contract applies on a given date.
   * A contract is applicable if it is active and the target date falls within its validity window.
   */
  isApplicableOn(date: Date): boolean {
    if (!this._isActive) return false;
    if (date < this.validFrom) return false;
    if (this.validUntil !== null && date > this.validUntil) return false;
    return true;
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new ContractAlreadyInactiveException();
    }
    this._isActive = false;
  }
}
