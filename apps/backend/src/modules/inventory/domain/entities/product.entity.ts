import { TrackingType } from '@repo/types';
import { randomUUID } from 'node:crypto';
import { PricingTier, CreatePricingTierProps } from './pricing-tier.entity';

export interface ProductProps {
  id: string;
  tenantId: string;
  name: string;
  trackingType: TrackingType;
  attributes: Record<string, unknown>;
  pricingTiers: PricingTier[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductProps = Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt' | 'pricingTiers'> & {
  /** The base tier is mandatory on creation — a product cannot exist without pricing. */
  baseTier: Omit<CreatePricingTierProps, 'productId' | 'tenantId' | 'inventoryItemId'>;
};

export class Product {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private _attributes: Record<string, unknown>;
  private readonly _trackingType: TrackingType;
  private _pricingTiers: PricingTier[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._name = props.name;
    this._trackingType = props.trackingType;
    this._attributes = props.attributes;
    this._pricingTiers = props.pricingTiers;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateProductProps): Product {
    const id = randomUUID();
    const now = new Date();

    const baseTier = PricingTier.create({
      ...props.baseTier,
      productId: id,
      tenantId: props.tenantId,
      inventoryItemId: null,
    });

    return new Product({
      id,
      tenantId: props.tenantId,
      name: props.name,
      trackingType: props.trackingType,
      attributes: props.attributes,
      pricingTiers: [baseTier],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  // --- Behavior ---
  public updateDetails(name: string, attributes: Record<string, unknown>): void {
    this._name = name;
    this._attributes = attributes;
    this._updatedAt = new Date();
  }

  /**
   * Adds a volume discount tier or a sub-day billing tier.
   * Enforces currency consistency: all tiers on a product must share the same currency.
   * Enforces uniqueness: no two tiers can share the same billingUnitId + fromUnit + inventoryItemId.
   */
  public addPricingTier(props: Omit<CreatePricingTierProps, 'productId' | 'tenantId'>): PricingTier {
    this.assertCurrencyConsistency(props.currency);
    this.assertTierUniqueness(props.billingUnitId, props.fromUnit, props.inventoryItemId ?? null);

    const tier = PricingTier.create({
      ...props,
      productId: this._id,
      tenantId: this._tenantId,
    });

    this._pricingTiers.push(tier);
    this._updatedAt = new Date();

    return tier;
  }

  /**
   * Updates the rate of an existing tier identified by id.
   * The base tier (fromUnit: 1, product-level) rate can be updated but not removed.
   */
  public updateTierRate(tierId: string, pricePerUnit: number): void {
    const tier = this.findTierOrThrow(tierId);
    tier.updateRate(pricePerUnit);
    this._updatedAt = new Date();
  }

  /**
   * Removes a pricing tier by id.
   * The base tier (fromUnit: 1, no inventoryItemId) cannot be removed —
   * it guarantees the engine always has a fallback rate.
   */
  public removePricingTier(tierId: string): void {
    const tier = this.findTierOrThrow(tierId);

    if (!tier.isItemOverride && tier.fromUnit === 1) {
      throw new Error('The base pricing tier (fromUnit: 1) cannot be removed.');
    }

    this._pricingTiers = this._pricingTiers.filter((t) => t.id !== tierId);
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get name(): string {
    return this._name;
  }
  get trackingType(): TrackingType {
    return this._trackingType;
  }
  get attributes(): Record<string, unknown> {
    return this._attributes;
  }
  get pricingTiers(): ReadonlyArray<PricingTier> {
    return this._pricingTiers;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private findTierOrThrow(tierId: string): PricingTier {
    const tier = this._pricingTiers.find((t) => t.id === tierId);
    if (!tier) {
      throw new Error(`PricingTier "${tierId}" not found on Product "${this._id}".`);
    }
    return tier;
  }

  private assertCurrencyConsistency(currency: string): void {
    const existing = this._pricingTiers[0]?.currency;
    if (existing && existing !== currency) {
      throw new Error(`Currency mismatch: product uses "${existing}" but new tier specifies "${currency}".`);
    }
  }

  private assertTierUniqueness(billingUnitId: string, fromUnit: number, inventoryItemId: string | null): void {
    const duplicate = this._pricingTiers.some(
      (t) => t.billingUnitId === billingUnitId && t.fromUnit === fromUnit && t.inventoryItemId === inventoryItemId,
    );
    if (duplicate) {
      throw new Error(
        `A tier with billingUnitId "${billingUnitId}" and fromUnit "${fromUnit}" already exists on this product.`,
      );
    }
  }
}
