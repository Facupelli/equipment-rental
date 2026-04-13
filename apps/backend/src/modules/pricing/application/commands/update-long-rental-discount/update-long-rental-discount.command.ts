import { LongRentalDiscountTarget, LongRentalDiscountTier } from '../../../domain/types/long-rental-discount.types';

export class UpdateLongRentalDiscountCommand {
  constructor(
    public readonly tenantId: string,
    public readonly longRentalDiscountId: string,
    public readonly name: string,
    public readonly priority: number,
    public readonly tiers: LongRentalDiscountTier[],
    public readonly target: Partial<LongRentalDiscountTarget> | undefined,
  ) {}
}
