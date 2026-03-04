import { randomUUID } from 'crypto';
import {
  InvalidTenantNameException,
  InvalidTenantSlugException,
  BillingUnitAlreadyActiveException,
  BillingUnitNotActiveException,
} from '../exceptions/tenant.exceptions';
import { TenantBillingUnit } from './tenant-billing-unit.entity';
import { TenantConfig } from '../value-objects/tenant-config.vo';
import { DEFAULT_CONFIG } from '../../infrastructure/config/tenancy.defaults';

export interface CreateTenantProps {
  name: string;
  slug: string;
}

export interface ReconstituteTenantProps {
  id: string;
  name: string;
  slug: string;
  config: TenantConfig;
  billingUnits: TenantBillingUnit[];
}

export class Tenant {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly config: TenantConfig,
    private readonly billingUnits: TenantBillingUnit[],
  ) {}

  static create(props: CreateTenantProps): Tenant {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidTenantNameException();
    }
    if (!props.slug || props.slug.trim().length === 0) {
      throw new InvalidTenantSlugException();
    }
    return new Tenant(randomUUID(), props.name.trim(), props.slug.trim(), DEFAULT_CONFIG, []);
  }

  static reconstitute(props: ReconstituteTenantProps): Tenant {
    return new Tenant(props.id, props.name, props.slug, props.config, props.billingUnits);
  }

  getActiveBillingUnits(): TenantBillingUnit[] {
    return [...this.billingUnits];
  }

  activateBillingUnit(billingUnitId: string): void {
    const alreadyActive = this.billingUnits.some((u) => u.billingUnitId === billingUnitId);
    if (alreadyActive) {
      throw new BillingUnitAlreadyActiveException(billingUnitId);
    }
    const unit = TenantBillingUnit.create({ tenantId: this.id, billingUnitId });
    this.billingUnits.push(unit);
  }

  deactivateBillingUnit(billingUnitId: string): void {
    const idx = this.billingUnits.findIndex((u) => u.billingUnitId === billingUnitId);
    if (idx === -1) {
      throw new BillingUnitNotActiveException(billingUnitId);
    }
    this.billingUnits.splice(idx, 1);
  }
}
