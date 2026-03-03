import { RentalProductView } from 'src/modules/order/application/ports/rental-product.port';

export interface BundleComponentView {
  productId: string;
  quantity: number;
  product: RentalProductView; // includes trackingType, totalStock, pricingTiers
}

export interface BundleView {
  id: string;
  tenantId: string;
  pricingTiers: BundlePricingTierView[];
  components: BundleComponentView[];
}

export interface BundlePricingTierView {
  id: string;
  billingUnitId: string;
  fromUnit: number;
  pricePerUnit: number;
  currency: string;
  inventoryItemId: null;
}

export abstract class BundleQueryPort {
  abstract findBundleWithComponents(bundleId: string, tenantId: string): Promise<BundleView | null>;
}
