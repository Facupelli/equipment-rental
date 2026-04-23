import { randomUUID } from 'crypto';
import Decimal from 'decimal.js';
import { ContractBasis } from '@repo/types';
import { OwnerSplitAlreadyVoidedException } from '../exceptions/order.exceptions';

export enum SplitStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  VOID = 'VOID',
  SETTLED = 'SETTLED',
}

export interface CreateOrderItemOwnerSplitProps {
  orderItemId: string;
  assetId: string;
  ownerId: string;
  contractId: string;
  ownerShare: Decimal;
  rentalShare: Decimal;
  basis: ContractBasis;
  grossAmount: Decimal;
  netAmount: Decimal;
  ownerAmount: Decimal;
  rentalAmount: Decimal;
}

export interface ReconstituteOrderItemOwnerSplitProps {
  id: string;
  orderItemId: string;
  assetId: string;
  ownerId: string;
  contractId: string;
  status: SplitStatus;
  ownerShare: Decimal;
  rentalShare: Decimal;
  basis: ContractBasis;
  grossAmount: Decimal;
  netAmount: Decimal;
  ownerAmount: Decimal;
  rentalAmount: Decimal;
}

export class OrderItemOwnerSplit {
  private constructor(
    public readonly id: string,
    public readonly orderItemId: string,
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly contractId: string,
    private _status: SplitStatus,
    public readonly ownerShare: Decimal,
    public readonly rentalShare: Decimal,
    public readonly basis: ContractBasis,
    public readonly grossAmount: Decimal,
    public readonly netAmount: Decimal,
    public readonly ownerAmount: Decimal,
    public readonly rentalAmount: Decimal,
  ) {}

  static create(props: CreateOrderItemOwnerSplitProps): OrderItemOwnerSplit {
    return new OrderItemOwnerSplit(
      randomUUID(),
      props.orderItemId,
      props.assetId,
      props.ownerId,
      props.contractId,
      SplitStatus.PENDING,
      props.ownerShare,
      props.rentalShare,
      props.basis,
      props.grossAmount,
      props.netAmount,
      props.ownerAmount,
      props.rentalAmount,
    );
  }

  static reconstitute(props: ReconstituteOrderItemOwnerSplitProps): OrderItemOwnerSplit {
    return new OrderItemOwnerSplit(
      props.id,
      props.orderItemId,
      props.assetId,
      props.ownerId,
      props.contractId,
      props.status,
      props.ownerShare,
      props.rentalShare,
      props.basis,
      props.grossAmount,
      props.netAmount,
      props.ownerAmount,
      props.rentalAmount,
    );
  }

  get status(): SplitStatus {
    return this._status;
  }

  isSettled(): boolean {
    return this._status === SplitStatus.SETTLED;
  }

  void(): void {
    if (this._status === SplitStatus.VOID) {
      throw new OwnerSplitAlreadyVoidedException();
    }
    this._status = SplitStatus.VOID;
  }
}
