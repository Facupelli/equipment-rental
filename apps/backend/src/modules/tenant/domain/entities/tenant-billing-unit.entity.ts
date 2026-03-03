import { randomUUID } from 'crypto';

export interface CreateTenantBillingUnitProps {
  tenantId: string;
  billingUnitId: string;
}

export interface ReconstituteTenantBillingUnitProps {
  id: string;
  tenantId: string;
  billingUnitId: string;
}

export class TenantBillingUnit {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly billingUnitId: string,
  ) {}

  static create(props: CreateTenantBillingUnitProps): TenantBillingUnit {
    return new TenantBillingUnit(randomUUID(), props.tenantId, props.billingUnitId);
  }

  static reconstitute(props: ReconstituteTenantBillingUnitProps): TenantBillingUnit {
    return new TenantBillingUnit(props.id, props.tenantId, props.billingUnitId);
  }
}
