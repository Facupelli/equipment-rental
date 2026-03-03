import { TrackingType } from '@repo/types';

export abstract class RentalProductQueryPort {
  /**
   * Finds a product by id.
   * TenantId scoping is handled transparently by PrismaService.
   */
  abstract findRentalProductById(id: string): Promise<RentalProductView | null>;
}

export interface RentalProductView {
  id: string;
  tenantId: string;
  trackingType: TrackingType;
  totalStock: number | null;

  /**
   * All pricing tiers for this product.
   * Includes both product-level tiers and item-level override tiers
   * (distinguished by inventoryItemId being set or null).
   * The PricingEngine performs tier resolution — this port returns all of them.
   */
  pricingTiers: RentalPricingTierView[];
}

export interface RentalPricingTierView {
  id: string;
  billingUnitId: string;
  inventoryItemId: string | null;
  fromUnit: number;
  pricePerUnit: number;
  currency: string;
}
