import { err, ok, Result } from 'neverthrow';
import { AddScheduleToLocationCommand } from './add-schedule-to-location.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LocationRepository } from '../../../infrastructure/persistence/repositories/location.repository';
import { LocationNotFoundError } from '../../../domain/errors/location.errors';

export type AddScheduleToLocationResult = Result<void, LocationNotFoundError>;

@CommandHandler(AddScheduleToLocationCommand)
export class AddScheduleToLocationCommandHandler implements ICommandHandler<AddScheduleToLocationCommand> {
  constructor(private readonly locationRepo: LocationRepository) {}

  async execute(command: AddScheduleToLocationCommand): Promise<AddScheduleToLocationResult> {
    const location = await this.locationRepo.load(command.locationId, command.tenantId);

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
