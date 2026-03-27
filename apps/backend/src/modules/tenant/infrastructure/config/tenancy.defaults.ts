import { TenantConfig } from '../../domain/value-objects/tenant-config.value-object';
import { CreateBillingUnitProps } from '../../domain/entities/billing-unit.entity';

export const DEFAULT_CONFIG = TenantConfig.default();

export const DEFAULT_BILLING_UNITS_PROPS: Omit<CreateBillingUnitProps, 'tenantId'>[] = [
  { label: 'Hour', durationMinutes: 60, sortOrder: 30 },
  { label: 'Day', durationMinutes: 1440, sortOrder: 20 },
  { label: 'Week', durationMinutes: 10080, sortOrder: 10 },
];
