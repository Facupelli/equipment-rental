import { randomUUID } from 'node:crypto';
import { InvalidTenantNameException, InvalidTenantSlugException } from '../exceptions/tenant.exceptions';
import { DEFAULT_BILLING_UNITS_PROPS, DEFAULT_CONFIG } from '../../infrastructure/config/tenancy.defaults';
import { BillingUnit, CreateBillingUnitProps } from './billing-unit.entity';

export type TenantConfig = Record<string, any>;

export enum PlanTier {
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

interface CreateTenantProps {
  name: string;
  slug: string;
  planTier: PlanTier | string;
  config?: TenantConfig;
}

interface ReconstituteTenantProps {
  id: string;
  name: string;
  slug: string;
  planTier: PlanTier | string;
  isActive: boolean;
  config: TenantConfig | null;
  billingUnits: BillingUnit[];
  createdAt: Date;
}

export class Tenant {
  get name(): string {
    return this._name;
  }
  get slug(): string {
    return this._slug;
  }
  get planTier(): PlanTier | string {
    return this._planTier;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get config(): TenantConfig | null {
    return this._config;
  }
  get billingUnits(): BillingUnit[] {
    return this._billingUnits;
  }

  private constructor(
    public readonly id: string,
    public readonly createdAt: Date,

    private _name: string,
    private _slug: string,
    private _planTier: PlanTier | string,
    private _isActive: boolean,
    private _config: TenantConfig | null,
    private _billingUnits: BillingUnit[],
  ) {}

  static create(props: CreateTenantProps): Tenant {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidTenantNameException();
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!props.slug || !slugRegex.test(props.slug)) {
      throw new InvalidTenantSlugException(props.slug);
    }

    const tenant = new Tenant(
      randomUUID(), // id
      new Date(), // createdAt
      props.name.trim(), // _name
      props.slug, // _slug
      props.planTier, // _planTier
      true, // _isActive
      DEFAULT_CONFIG, // _config
      [],
    );

    DEFAULT_BILLING_UNITS_PROPS.forEach((unitProps) => {
      tenant.addBillingUnit(unitProps);
    });

    return tenant;
  }

  static reconstitute(props: ReconstituteTenantProps): Tenant {
    return new Tenant(
      props.id,
      props.createdAt,
      props.name,
      props.slug,
      props.planTier,
      props.isActive,
      props.config,
      props.billingUnits,
    );
  }

  public addBillingUnit(props: Omit<CreateBillingUnitProps, 'tenantId'>): BillingUnit {
    const duplicate = this._billingUnits.some((u) => u.name === props.name);
    if (duplicate) {
      throw new Error(`A billing unit named "${props.name}" already exists for this tenant.`);
    }

    const unit = BillingUnit.create({ ...props, tenantId: this.id });
    this._billingUnits.push(unit);

    return unit;
  }

  // State Transitions
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new InvalidTenantNameException();
    }
    this._name = newName.trim();
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }
}
