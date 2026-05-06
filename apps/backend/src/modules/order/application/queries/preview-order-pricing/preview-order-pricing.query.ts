import { OrderPricingPreviewItemDto } from '@repo/schemas';

export class PreviewOrderPricingQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly currency: string,
    public readonly pickupDate: string,
    public readonly returnDate: string,
    public readonly pickupTime: number,
    public readonly returnTime: number,
    public readonly items: OrderPricingPreviewItemDto[],
    public readonly insuranceSelected: boolean,
    public readonly customerId?: string | null,
    public readonly couponCode?: string,
    public readonly pricingAdjustment?: { mode: 'TARGET_TOTAL'; targetTotal: string } | null,
  ) {}
}
