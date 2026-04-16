import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

export type NewPricingContext = {
  period: DateRange;
  bookingCreatedAt: Date;
  orderCurrency: string;
  productTypeId?: string;
  bundleId?: string;
  customerId?: string;
  applicablePromotionIds?: string[];
  standaloneProductQuantityByCategory: Record<string, number>;
  orderSubtotalBeforePromotions?: number;
};
