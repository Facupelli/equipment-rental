import { TenantConfig } from './domain/value-objects/tenant-config.vo';

export abstract class TenantPublicApi {
  abstract getConfig(tenantId: string): Promise<TenantConfig>;
}
