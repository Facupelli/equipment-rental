export enum PricingRuleType {
  SEASONAL = "SEASONAL",
  VOLUME = "VOLUME",
  COUPON = "COUPON",
  CUSTOMER_SPECIFIC = "CUSTOMER_SPECIFIC",
  DURATION = "DURATION",
}

export enum PricingRuleScope {
  ORDER = "ORDER",
  PRODUCT_TYPE = "PRODUCT_TYPE",
  CATEGORY = "CATEGORY",
  BUNDLE = "BUNDLE",
}

export enum PromotionAdjustmentType {
  PERCENTAGE = "PERCENTAGE",
  FLAT = "FLAT",
}

export enum PricingAdjustmentSourceKind {
  PROMOTION = "PROMOTION",
  MANUAL = "MANUAL",
}
