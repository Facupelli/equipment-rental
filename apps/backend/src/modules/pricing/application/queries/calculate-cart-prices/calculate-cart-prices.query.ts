export type CartQueryProductItem = {
  type: 'PRODUCT';
  productTypeId: string;
  quantity: number;
};

export type CartQueryBundleItem = {
  type: 'BUNDLE';
  bundleId: string;
  quantity: number;
};

export type CartQueryItem = CartQueryProductItem | CartQueryBundleItem;

export class CalculateCartPricesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly currency: string,
    public readonly period: { start: Date; end: Date },
    public readonly items: CartQueryItem[],
    public readonly customerId?: string,
    public readonly couponCode?: string,
  ) {}
}
