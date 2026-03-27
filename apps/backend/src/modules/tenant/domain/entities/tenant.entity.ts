import { randomUUID } from 'crypto';
import {
  InvalidTenantNameException,
  InvalidTenantSlugException,
  BillingUnitAlreadyActiveException,
  BillingUnitNotActiveException,
} from '../exceptions/tenant.exceptions';
import { TenantBillingUnit } from './tenant-billing-unit.entity';
import { TenantConfig, type TenantConfigPatch } from '../value-objects/tenant-config.value-object';

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
    private config: TenantConfig,
    private readonly billingUnits: TenantBillingUnit[],
  ) {}

  // --- Factories ---

  static create(props: CreateTenantProps): Tenant {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidTenantNameException();
    }
    if (!props.slug || props.slug.trim().length === 0) {
      throw new InvalidTenantSlugException();
    }
    return new Tenant(randomUUID(), props.name.trim(), props.slug.trim(), TenantConfig.default(), []);
  }

  static reconstitute(props: ReconstituteTenantProps): Tenant {
    return new Tenant(props.id, props.name, props.slug, props.config, props.billingUnits);
  }

  // --- Queries ---

  getConfig(): TenantConfig {
    return this.config;
  }

  getActiveBillingUnits(): TenantBillingUnit[] {
    return [...this.billingUnits];
  }

  // --- Commands ---

  updateConfig(patch: TenantConfigPatch): void {
    this.config = this.config.merge(patch);
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
