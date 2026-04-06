import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import { TenantRepository } from 'src/modules/tenant/infrastructure/persistence/repositories/tenant.repository';
import { TenantNotFoundError } from '../../../domain/errors/tenant.errors';
import { UpdateTenantBrandingCommand } from './update-branding.command';

@Injectable()
@CommandHandler(UpdateTenantBrandingCommand)
export class UpdateTenantBrandingCommandHandler implements ICommandHandler<
  UpdateTenantBrandingCommand,
  Result<void, TenantNotFoundError>
> {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async execute(command: UpdateTenantBrandingCommand): Promise<Result<void, TenantNotFoundError>> {
    const tenant = await this.tenantRepo.load(command.tenantId);

    if (!tenant) {
      return err(new TenantNotFoundError(command.tenantId));
    }

    tenant.updateBranding(command.logoUrl);

    await this.tenantRepo.save(tenant);

    return ok(undefined);
  }
}
