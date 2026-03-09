import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTenantConfigCommand } from './update-config.command';
import { TenantRepositoryPort } from 'src/modules/tenant/domain/ports/tenant.repository.port';
import { TenantContextService } from '../../tenant-context.service';

@Injectable()
@CommandHandler(UpdateTenantConfigCommand)
export class UpdateTenantConfigCommandHandler implements ICommandHandler<UpdateTenantConfigCommand, void> {
  constructor(
    private readonly tenantRepo: TenantRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(command: UpdateTenantConfigCommand): Promise<void> {
    const tenantId = this.tenantContext.requireTenantId();
    const tenant = await this.tenantRepo.load(tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    tenant.updateConfig(command.patch);

    await this.tenantRepo.save(tenant);
  }
}
