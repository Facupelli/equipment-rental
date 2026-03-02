import { randomUUID } from 'node:crypto';
import { BundlePricingTier, CreateBundlePricingTierProps } from './bundle-pricing-tier.entity';
import { BundleComponent } from '../value-objects/bundle-component.vo';
import { InvalidProductBundleException } from '../exceptions/product-bundle.exception';

export interface ProductBundleProps {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  pricingTiers: BundlePricingTier[];
  components: BundleComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductBundleProps = Omit<
  ProductBundleProps,
  'id' | 'createdAt' | 'updatedAt' | 'pricingTiers' | 'isActive'
> & {
  /** The base tier is mandatory on creation — a bundle cannot exist without pricing. */
  baseTier: Omit<CreateBundlePricingTierProps, 'bundleId' | 'tenantId'>;
};

export class ProductBundle {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private _description: string | null;
  private _isActive: boolean;
  private _pricingTiers: BundlePricingTier[];
  private _components: BundleComponent[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductBundleProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._name = props.name;
    this._description = props.description;
    this._isActive = props.isActive;
    this._pricingTiers = props.pricingTiers;
    this._components = props.components;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateProductBundleProps): ProductBundle {
    ProductBundle.assertHasComponents(props.components);

    const id = randomUUID();
    const now = new Date();

    const baseTier = BundlePricingTier.create({
      ...props.baseTier,
      bundleId: id,
      tenantId: props.tenantId,
    });

    return new ProductBundle({
      id,
      tenantId: props.tenantId,
      name: props.name,
      description: props.description ?? null,
      isActive: true,
      pricingTiers: [baseTier],
      components: props.components,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: ProductBundleProps): ProductBundle {
    return new ProductBundle(props);
  }

  // --- Behavior ---

  public updateDetails(name: string, description: string | null): void {
    this._name = name;
    this._description = description;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Adds a volume discount tier.
   * Enforces currency consistency: all tiers on a bundle must share the same currency.
   * Enforces uniqueness: no two tiers can share the same billingUnitId + fromUnit.
   */
  public addPricingTier(props: Omit<CreateBundlePricingTierProps, 'bundleId' | 'tenantId'>): BundlePricingTier {
    this.assertCurrencyConsistency(props.currency);
    this.assertTierUniqueness(props.billingUnitId, props.fromUnit);

    const tier = BundlePricingTier.create({
      ...props,
      bundleId: this._id,
      tenantId: this._tenantId,
    });

    this._pricingTiers.push(tier);
    this._updatedAt = new Date();

    return tier;
  }

  /**
   * Updates the rate of an existing tier identified by id.
   * The base tier rate can be updated but not removed.
   */
  public updateTierRate(tierId: string, pricePerUnit: number): void {
    const tier = this.findTierOrThrow(tierId);
    tier.updateRate(pricePerUnit);
    this._updatedAt = new Date();
  }

  /**
   * Removes a pricing tier by id.
   * The base tier (fromUnit: 1) cannot be removed.
   */
  public removePricingTier(tierId: string): void {
    const tier = this.findTierOrThrow(tierId);

    if (tier.fromUnit === 1) {
      throw new Error('The base pricing tier (fromUnit: 1) cannot be removed.');
    }

    this._pricingTiers = this._pricingTiers.filter((t) => t.id !== tierId);
    this._updatedAt = new Date();
  }

  /**
   * Replaces the full component list.
   * Components are value objects — there is no add/remove API.
   * The caller supplies the desired final state and the aggregate validates it.
   */
  public setComponents(components: BundleComponent[]): void {
    ProductBundle.assertHasComponents(components);
    this.assertNoDuplicateComponents(components);
    this._components = components;
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
  get description(): string | null {
    return this._description;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get pricingTiers(): ReadonlyArray<BundlePricingTier> {
    return this._pricingTiers;
  }
  get components(): ReadonlyArray<BundleComponent> {
    return this._components;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- Private helpers ---
  private findTierOrThrow(tierId: string): BundlePricingTier {
    const tier = this._pricingTiers.find((t) => t.id === tierId);
    if (!tier) {
      throw new InvalidProductBundleException(
        `BundlePricingTier "${tierId}" not found on ProductBundle "${this._id}".`,
      );
    }
    return tier;
  }

  private assertCurrencyConsistency(currency: string): void {
    const existing = this._pricingTiers[0]?.currency;
    if (existing && existing !== currency) {
      throw new InvalidProductBundleException(
        `Currency mismatch: bundle uses "${existing}" but new tier specifies "${currency}".`,
      );
    }
  }

  private assertTierUniqueness(billingUnitId: string, fromUnit: number): void {
    const duplicate = this._pricingTiers.some((t) => t.billingUnitId === billingUnitId && t.fromUnit === fromUnit);
    if (duplicate) {
      throw new InvalidProductBundleException(
        `A tier with billingUnitId "${billingUnitId}" and fromUnit "${fromUnit}" already exists on this bundle.`,
      );
    }
  }

  private static assertHasComponents(components: BundleComponent[]): void {
    if (components.length === 0) {
      throw new InvalidProductBundleException('A bundle must have at least one component.');
    }
  }

  private assertNoDuplicateComponents(components: BundleComponent[]): void {
    const productIds = components.map((c) => c.productId);
    const unique = new Set(productIds);
    if (unique.size !== productIds.length) {
      throw new InvalidProductBundleException('A bundle cannot contain duplicate products.');
    }
  }
}
