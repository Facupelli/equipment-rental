export type LongRentalDiscountTier = {
  fromUnits: number;
  toUnits: number | null;
  discountPct: number;
};

export type LongRentalDiscountTarget = {
  excludedProductTypeIds: string[];
  excludedBundleIds: string[];
};
