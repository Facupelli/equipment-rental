export type SeasonalCondition = {
  dateFrom: string;
  dateTo: string;
};

export type VolumeCondition = {
  categoryId: string;
  threshold: number;
};

export type CouponCondition = {
  code: string;
};

export type CustomerSpecificCondition = {
  customerId: string;
};

export type PricingRuleCondition = SeasonalCondition | VolumeCondition | CouponCondition | CustomerSpecificCondition;

export type PricingRuleEffect = {
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
};
