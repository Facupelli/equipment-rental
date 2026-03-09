import { TenantConfigPatch } from 'src/modules/tenant/domain/value-objects/tenant-config.vo';

export class UpdateTenantConfigCommand {
  constructor(public readonly patch: TenantConfigPatch) {}
}
