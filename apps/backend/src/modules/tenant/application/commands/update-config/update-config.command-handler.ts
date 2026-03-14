import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTenantConfigCommand } from './update-config.command';
import { TenantRepositoryPort } from 'src/modules/tenant/domain/ports/tenant.repository.port';

@Injectable()
@CommandHandler(UpdateTenantConfigCommand)
export class UpdateTenantConfigCommandHandler implements ICommandHandler<UpdateTenantConfigCommand, void> {
  constructor(private readonly tenantRepo: TenantRepositoryPort) {}

  async execute(command: UpdateTenantConfigCommand): Promise<void> {
    const tenant = await this.tenantRepo.load(command.tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant ${command.tenantId} not found`);
    }

    tenant.updateConfig(command.patch);

    await this.tenantRepo.save(tenant);
  }
}
