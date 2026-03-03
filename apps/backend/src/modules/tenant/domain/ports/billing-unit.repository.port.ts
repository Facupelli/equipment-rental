import { BillingUnit } from '../entities/billing-unit.entity';

export abstract class BillingUnitRepositoryPort {
  abstract load(id: string): Promise<BillingUnit | null>;
  abstract save(billingUnit: BillingUnit): Promise<string>;
}
