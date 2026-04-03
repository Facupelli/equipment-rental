import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { LocationNotFoundError } from '../../../domain/errors/location.errors';
import { LocationRepository } from '../../../infrastructure/persistence/repositories/location.repository';

import { UpdateLocationCommand } from './update-location.command';

export type UpdateLocationResult = Result<void, LocationNotFoundError>;

@CommandHandler(UpdateLocationCommand)
export class UpdateLocationCommandHandler implements ICommandHandler<UpdateLocationCommand, UpdateLocationResult> {
  constructor(private readonly locationRepo: LocationRepository) {}

  async execute(command: UpdateLocationCommand): Promise<UpdateLocationResult> {
    const location = await this.locationRepo.load(command.locationId, command.tenantId);

    if (!location) {
      return err(new LocationNotFoundError(command.locationId));
    }

    location.update(command.patch);
    await this.locationRepo.save(location);

    return ok(undefined);
  }
}
