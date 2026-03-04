import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLocationCommand } from './create-location.command';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';
import { TenantContextService } from '../../tenant-context.service';
import { ok, Result } from 'src/core/result';
import { Location } from 'src/modules/tenant/domain/entities/location.entity';

@CommandHandler(CreateLocationCommand)
export class CreateLocationCommandHandler implements ICommandHandler<CreateLocationCommand, Result<string>> {
  constructor(
    private readonly locationRepo: LocationRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(command: CreateLocationCommand): Promise<Result<string>> {
    const tenantId = this.tenantContext.requireTenantId();

    const location = Location.create({
      tenantId,
      name: command.name,
      address: command.address,
    });

    await this.locationRepo.save(location);

    return ok(location.id);
  }
}
