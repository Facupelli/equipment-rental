import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BulkAddSchedulesToLocationCommand } from './bulk-add-schedule-to-location.command';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';
import { err, ok, Result } from 'src/core/result';
import { LocationNotFoundError } from 'src/modules/tenant/domain/exceptions/location.exceptions';

@CommandHandler(BulkAddSchedulesToLocationCommand)
export class BulkAddSchedulesToLocationCommandHandler implements ICommandHandler<BulkAddSchedulesToLocationCommand> {
  constructor(private readonly locationRepo: LocationRepositoryPort) {}

  async execute(command: BulkAddSchedulesToLocationCommand): Promise<Result<void, LocationNotFoundError>> {
    const location = await this.locationRepo.load(command.locationId);

    if (!location) {
      return err(new LocationNotFoundError(command.locationId));
    }

    location.addSchedules(command.items);

    await this.locationRepo.save(location);

    return ok(undefined);
  }
}
