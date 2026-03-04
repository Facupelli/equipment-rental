import { TenantBillingUnit } from '../entities/tenant-billing-unit.entity';

export abstract class TenantBillingUnitRepositoryPort {
  abstract load(id: string): Promise<TenantBillingUnit | null>;
  abstract save(billingUnit: TenantBillingUnit): Promise<string>;
}
