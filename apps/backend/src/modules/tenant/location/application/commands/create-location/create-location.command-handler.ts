import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLocationCommand } from './create-location.command';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';
import { ok, Result } from 'src/core/result';
import { Location } from '../../../domain/entities/location.entity';

@CommandHandler(CreateLocationCommand)
export class CreateLocationCommandHandler implements ICommandHandler<CreateLocationCommand, Result<string>> {
  constructor(private readonly locationRepo: LocationRepositoryPort) {}

  async execute(command: CreateLocationCommand): Promise<Result<string>> {
    const location = Location.create({
      tenantId: command.tenantId,
      name: command.name,
      address: command.address,
    });

    await this.locationRepo.save(location);

    return ok(location.id);
  }
}
