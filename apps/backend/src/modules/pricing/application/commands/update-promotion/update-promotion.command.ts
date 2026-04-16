import {
  PromotionActivationType,
  PromotionApplicability,
  PromotionCondition,
  PromotionEffect,
  PromotionStackingType,
} from '../../../domain/types/promotion.types';

export class UpdatePromotionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly promotionId: string,
    public readonly name: string,
    public readonly activationType: PromotionActivationType,
    public readonly priority: number,
    public readonly stackingType: PromotionStackingType,
    public readonly validFrom: Date | undefined,
    public readonly validUntil: Date | undefined,
    public readonly conditions: PromotionCondition[],
    public readonly applicability: PromotionApplicability,
    public readonly effect: PromotionEffect,
  ) {}
}
