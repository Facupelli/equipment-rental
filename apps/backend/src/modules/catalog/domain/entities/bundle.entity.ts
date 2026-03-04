import { randomUUID } from 'crypto';
import { BundleComponent } from './bundle-component.entity';
import { PricingTier } from './pricing-tier.entity';
import {
  InvalidBundleNameException,
  DuplicateBundleComponentException,
  BundleComponentNotFoundException,
} from '../exceptions/bundle.exceptions';
import { DuplicatePricingTierException, PricingTierNotFoundException } from '../exceptions/pricing-tier.exceptions';

export interface CreateBundleProps {
  tenantId: string;
  name: string;
}

export interface ReconstituteBundleProps {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  components: BundleComponent[];
  pricingTiers: PricingTier[];
}

export class Bundle {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    private isActive: boolean,
    private readonly components: BundleComponent[],
    private readonly pricingTiers: PricingTier[],
  ) {}

  static create(props: CreateBundleProps): Bundle {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidBundleNameException();
    }
    return new Bundle(randomUUID(), props.tenantId, props.name.trim(), true, [], []);
  }

  static reconstitute(props: ReconstituteBundleProps): Bundle {
    return new Bundle(props.id, props.tenantId, props.name, props.isActive, props.components, props.pricingTiers);
  }

  get active(): boolean {
    return this.isActive;
  }

  getComponents(): BundleComponent[] {
    return [...this.components];
  }

  getPricingTiers(): PricingTier[] {
    return [...this.pricingTiers];
  }

  deactivate(): void {
    this.isActive = false;
  }

  addComponent(productTypeId: string, quantity: number): void {
    const duplicate = this.components.some((c) => c.productTypeId === productTypeId);
    if (duplicate) {
      throw new DuplicateBundleComponentException(productTypeId);
    }
    const component = BundleComponent.create({ productTypeId, quantity });
    this.components.push(component);
  }

  removeComponent(productTypeId: string): void {
    const idx = this.components.findIndex((c) => c.productTypeId === productTypeId);
    if (idx === -1) {
      throw new BundleComponentNotFoundException(productTypeId);
    }
    this.components.splice(idx, 1);
  }

  addPricingTier(tier: PricingTier): void {
    const duplicate = this.pricingTiers.some((t) => t.fromUnit === tier.fromUnit && t.locationId === tier.locationId);
    if (duplicate) {
      throw new DuplicatePricingTierException(tier.fromUnit, tier.locationId);
    }
    this.pricingTiers.push(tier);
  }

  removePricingTier(tierId: string): void {
    const idx = this.pricingTiers.findIndex((t) => t.id === tierId);
    if (idx === -1) {
      throw new PricingTierNotFoundException(tierId);
    }
    this.pricingTiers.splice(idx, 1);
  }
}
