import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

export type NewPricingContext = {
  period: DateRange;
  productTypeId?: string;
  bundleId?: string;
  customerId?: string;
  applicablePromotionIds?: string[];
};
