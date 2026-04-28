import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { LocationNotFoundError, LocationScheduleNotFoundError } from '../../../domain/errors/location.errors';
import { LocationRepository } from '../../../infrastructure/persistence/repositories/location.repository';

import { UpdateLocationScheduleCommand } from './update-location-schedule.command';

export type UpdateLocationScheduleResult = Result<void, LocationNotFoundError | LocationScheduleNotFoundError>;

@CommandHandler(UpdateLocationScheduleCommand)
export class UpdateLocationScheduleCommandHandler implements ICommandHandler<
  UpdateLocationScheduleCommand,
  UpdateLocationScheduleResult
> {
  constructor(private readonly locationRepo: LocationRepository) {}

  async execute(command: UpdateLocationScheduleCommand): Promise<UpdateLocationScheduleResult> {
    const location = await this.locationRepo.load(command.locationId, command.tenantId);

    if (!location) {
      return err(new LocationNotFoundError(command.locationId));
    }

    const scheduleExists = location.getSchedules().some((schedule) => schedule.id === command.scheduleId);

    if (!scheduleExists) {
      return err(new LocationScheduleNotFoundError(command.scheduleId));
    }

    location.updateScheduleWindow(command.scheduleId, {
      openTime: command.openTime,
      closeTime: command.closeTime,
      slotIntervalMinutes: command.slotIntervalMinutes,
    });

    await this.locationRepo.save(location);

    return ok(undefined);
  }
}
