import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLocationCommand } from './create-location.command';
import { Location } from '../../../domain/entities/location.entity';
import { LocationRepository } from '../../../infrastructure/persistence/repositories/location.repository';

@CommandHandler(CreateLocationCommand)
export class CreateLocationCommandHandler implements ICommandHandler<CreateLocationCommand, string> {
  constructor(private readonly locationRepo: LocationRepository) {}

  async execute(command: CreateLocationCommand): Promise<string> {
    const location = Location.create({
      tenantId: command.tenantId,
      name: command.name,
      address: command.address,
    });

    await this.locationRepo.save(location);

    return location.id;
  }
}
