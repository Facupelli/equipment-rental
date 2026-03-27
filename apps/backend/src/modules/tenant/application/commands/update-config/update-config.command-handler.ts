import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'src/core/result';
import { UpdateTenantConfigCommand } from './update-config.command';
import { TenantRepository } from 'src/modules/tenant/infrastructure/persistence/repositories/tenant.repository';
import { TenantNotFoundError } from '../../../domain/errors/tenant.errors';

@Injectable()
@CommandHandler(UpdateTenantConfigCommand)
export class UpdateTenantConfigCommandHandler implements ICommandHandler<
  UpdateTenantConfigCommand,
  Result<void, TenantNotFoundError>
> {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async execute(command: UpdateTenantConfigCommand): Promise<Result<void, TenantNotFoundError>> {
    const tenant = await this.tenantRepo.load(command.tenantId);

    if (!tenant) {
      return err(new TenantNotFoundError(command.tenantId));
    }

    tenant.updateConfig(command.patch);

    await this.tenantRepo.save(tenant);

    return ok(undefined);
  }
}
