import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import { BulkAddSchedulesToLocationCommand } from './bulk-add-schedule-to-location.command';
import { LocationRepository } from '../../../infrastructure/persistence/repositories/location.repository';
import { LocationNotFoundError } from '../../../domain/errors/location.errors';

@CommandHandler(BulkAddSchedulesToLocationCommand)
export class BulkAddSchedulesToLocationCommandHandler implements ICommandHandler<BulkAddSchedulesToLocationCommand> {
  constructor(private readonly locationRepo: LocationRepository) {}

  async execute(command: BulkAddSchedulesToLocationCommand): Promise<Result<void, LocationNotFoundError>> {
    const location = await this.locationRepo.load(command.locationId, command.tenantId);

    if (!location) {
      return err(new LocationNotFoundError(command.locationId));
    }

    location.addSchedules(command.items);

    await this.locationRepo.save(location);

    return ok(undefined);
  }
}
