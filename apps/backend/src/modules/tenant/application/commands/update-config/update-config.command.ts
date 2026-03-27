import { TenantConfigPatch } from 'src/modules/tenant/domain/value-objects/tenant-config.value-object';

export class UpdateTenantConfigCommand {
  constructor(
    public readonly tenantId: string,
    public readonly patch: TenantConfigPatch,
  ) {}
}
