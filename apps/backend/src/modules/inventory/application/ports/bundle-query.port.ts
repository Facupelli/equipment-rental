import { RentalProductView } from 'src/modules/rental/application/ports/rental-product.port';
import { BundlePricingTierView } from 'src/modules/rental/application/pricing-engine/pricing-engine';

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

export abstract class BundleQueryPort {
  abstract findBundleWithComponents(bundleId: string, tenantId: string): Promise<BundleView | null>;
}
