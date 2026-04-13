import {
  PromotionCondition,
  PromotionEffect,
  PromotionTarget,
  PromotionType,
} from '../../../domain/types/promotion.types';

export class CreatePromotionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly type: PromotionType,
    public readonly priority: number,
    public readonly stackable: boolean,
    public readonly condition: PromotionCondition,
    public readonly effect: PromotionEffect,
    public readonly target: Partial<PromotionTarget> | undefined,
  ) {}
}
