import { PromotionType } from '../../../domain/types/promotion.types';

export class ListPromotionsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly type?: PromotionType,
  ) {}
}
