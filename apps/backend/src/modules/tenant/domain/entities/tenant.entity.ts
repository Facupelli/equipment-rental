import { randomUUID } from 'crypto';
import { AggregateRootBase } from 'src/core/domain/aggregate-root.base';

import { TenantRegisteredEvent } from '../../public/events/tenant-registered.event';

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
  logoUrl: string | null;
  config: TenantConfig;
  billingUnits: TenantBillingUnit[];
}

export class Tenant extends AggregateRootBase {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    private logoUrl: string | null,
    private config: TenantConfig,
    private readonly billingUnits: TenantBillingUnit[],
  ) {
    super();
  }

  // --- Factories ---

  static create(props: CreateTenantProps): Tenant {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidTenantNameException();
    }
    if (!props.slug || props.slug.trim().length === 0) {
      throw new InvalidTenantSlugException();
    }
    const tenant = new Tenant(randomUUID(), props.name.trim(), props.slug.trim(), null, TenantConfig.default(), []);

    tenant.recordDomainEvent(
      new TenantRegisteredEvent({
        tenantId: tenant.id,
        slug: tenant.slug,
      }),
    );

    return tenant;
  }

  static reconstitute(props: ReconstituteTenantProps): Tenant {
    return new Tenant(props.id, props.name, props.slug, props.logoUrl, props.config, props.billingUnits);
  }

  // --- Queries ---

  getConfig(): TenantConfig {
    return this.config;
  }

  getLogoUrl(): string | null {
    return this.logoUrl;
  }

  getActiveBillingUnits(): TenantBillingUnit[] {
    return [...this.billingUnits];
  }

  // --- Commands ---

  updateConfig(patch: TenantConfigPatch): void {
    this.config = this.config.merge(patch);
  }

  updateBranding(logoUrl: string | null): void {
    this.logoUrl = logoUrl;
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
