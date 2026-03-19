import { err, ok, Result } from 'src/core/result';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';
import { AddScheduleToLocationCommand } from './add-schedule-to-location.command';
import { LocationNotFoundError } from 'src/modules/tenant/location/domain/exceptions/location.exceptions';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export type AddScheduleToLocationResult = Result<void, LocationNotFoundError>;

@CommandHandler(AddScheduleToLocationCommand)
export class AddScheduleToLocationCommandHandler implements ICommandHandler<AddScheduleToLocationCommand> {
  constructor(private readonly locationRepo: LocationRepositoryPort) {}

  async execute(command: AddScheduleToLocationCommand): Promise<AddScheduleToLocationResult> {
    const location = await this.locationRepo.load(command.locationId);

    if (!location) {
      return err(new LocationNotFoundError(command.locationId));
    }

    location.addSchedule({
      locationId: command.locationId,
      type: command.type,
      dayOfWeek: command.dayOfWeek,
      specificDate: command.specificDate,
      window: {
        openTime: command.openTime,
        closeTime: command.closeTime,
        slotIntervalMinutes: command.slotIntervalMinutes,
      },
    });

    await this.locationRepo.save(location);

    return ok(undefined);
  }
}
