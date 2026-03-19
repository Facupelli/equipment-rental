import Decimal from 'decimal.js';
import { InvalidShareSplitException } from '../expcetions/owner-contract.exceptions';

export interface ShareSplitProps {
  ownerShare: Decimal;
  rentalShare: Decimal;
}

export class ShareSplit {
  public readonly ownerShare: Decimal;
  public readonly rentalShare: Decimal;

  private static readonly ONE = new Decimal('1.00');

  constructor(ownerShare: Decimal, rentalShare: Decimal) {
    if (ownerShare.lte(0) || rentalShare.lte(0)) {
      throw new InvalidShareSplitException();
    }

    if (!ownerShare.plus(rentalShare).equals(ShareSplit.ONE)) {
      throw new InvalidShareSplitException();
    }

    this.ownerShare = ownerShare;
    this.rentalShare = rentalShare;
  }

  equals(other: ShareSplit): boolean {
    return this.ownerShare.equals(other.ownerShare) && this.rentalShare.equals(other.rentalShare);
  }
}
