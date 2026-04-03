import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { LocationNotFoundError } from '../../../domain/errors/location.errors';
import { LocationRepository } from '../../../infrastructure/persistence/repositories/location.repository';

import { DeactivateLocationCommand } from './deactivate-location.command';

export type DeactivateLocationResult = Result<void, LocationNotFoundError>;

@CommandHandler(DeactivateLocationCommand)
export class DeactivateLocationCommandHandler implements ICommandHandler<
  DeactivateLocationCommand,
  DeactivateLocationResult
> {
  constructor(private readonly locationRepo: LocationRepository) {}

  async execute(command: DeactivateLocationCommand): Promise<DeactivateLocationResult> {
    const location = await this.locationRepo.load(command.locationId, command.tenantId);

    if (!location) {
      return err(new LocationNotFoundError(command.locationId));
    }

    location.deactivate();
    await this.locationRepo.save(location);

    return ok(undefined);
  }
}
