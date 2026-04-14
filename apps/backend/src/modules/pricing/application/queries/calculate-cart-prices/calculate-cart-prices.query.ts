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
    public readonly pickupDate: string,
    public readonly returnDate: string,
    public readonly pickupTime: number | undefined,
    public readonly returnTime: number | undefined,
    public readonly items: CartQueryItem[],
    public readonly insuranceSelected: boolean,
    public readonly customerId?: string,
    public readonly couponCode?: string,
  ) {}
}
