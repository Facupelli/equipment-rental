import { BadRequestException } from '@nestjs/common';
import { RoundingRule } from './billing-unit.entity';
import { BillingUnit, CreateBillingUnitProps } from './billing-unit.entity';

export interface TenantPricingConfig {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  defaultCurrency: string;
}

const DEFAULT_PRICING_CONFIG: TenantPricingConfig = {
  overRentalEnabled: false,
  maxOverRentThreshold: 0,
  weekendCountsAsOne: false,
  roundingRule: 'ROUND_UP',
  defaultCurrency: 'ARS',
};

export interface TenantProps {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  isActive: boolean;
  pricingConfig: TenantPricingConfig;
  billingUnits: BillingUnit[];
  createdAt: Date;
}

export class Tenant {
  private readonly _id: string;
  private _name: string;
  private _slug: string;
  private _planTier: string;
  private _isActive: boolean;
  private _pricingConfig: TenantPricingConfig;
  private _billingUnits: BillingUnit[];
  private readonly _createdAt: Date;

  private constructor(props: TenantProps) {
    this._id = props.id;
    this._name = props.name;
    this._slug = props.slug;
    this._planTier = props.planTier;
    this._isActive = props.isActive;
    this._pricingConfig = props.pricingConfig;
    this._billingUnits = props.billingUnits;
    this._createdAt = props.createdAt;
  }

  public static create(id: string, name: string, slug: string, planTier: string): Tenant {
    if (!slug.match(/^[a-z0-9-]+$/)) {
      throw new BadRequestException('Slug must be lowercase alphanumeric with hyphens only.');
    }

    return new Tenant({
      id,
      name,
      slug,
      planTier,
      isActive: true,
      pricingConfig: { ...DEFAULT_PRICING_CONFIG },
      billingUnits: [],
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  // --- Behavior ---
  public updatePricingConfig(config: Partial<TenantPricingConfig>): void {
    if (config.maxOverRentThreshold !== undefined && config.maxOverRentThreshold < 0) {
      throw new Error('maxOverRentThreshold must be non-negative.');
    }

    this._pricingConfig = { ...this._pricingConfig, ...config };
  }

  public deactivate(): void {
    this._isActive = false;
  }

  /**
   * Adds a billing unit to this tenant.
   * Enforces uniqueness by name — a tenant cannot have two units called "full_day".
   */
  public addBillingUnit(props: Omit<CreateBillingUnitProps, 'tenantId'>): BillingUnit {
    const duplicate = this._billingUnits.some((u) => u.name === props.name);
    if (duplicate) {
      throw new Error(`A billing unit named "${props.name}" already exists for this tenant.`);
    }

    const unit = BillingUnit.create({ ...props, tenantId: this._id });
    this._billingUnits.push(unit);

    return unit;
  }

  public removeBillingUnit(unitId: string): void {
    const exists = this._billingUnits.some((u) => u.id === unitId);
    if (!exists) {
      throw new Error(`BillingUnit "${unitId}" not found on Tenant "${this._id}".`);
    }
    // Note: the application layer should verify no PricingTiers reference
    // this unit before calling this method.
    this._billingUnits = this._billingUnits.filter((u) => u.id !== unitId);
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get slug(): string {
    return this._slug;
  }
  get planTier(): string {
    return this._planTier;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get pricingConfig(): TenantPricingConfig {
    return { ...this._pricingConfig };
  }
  get billingUnits(): ReadonlyArray<BillingUnit> {
    return this._billingUnits;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
