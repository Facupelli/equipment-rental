import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'src/core/result';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';
import { AddScheduleToLocationCommand } from './add-schedule-to-location.command';
import { LocationNotFoundError } from 'src/modules/tenant/domain/exceptions/location.exceptions';

export type AddScheduleToLocationResult = Result<void, LocationNotFoundError>;

@Injectable()
export class AddScheduleToLocationCommandHandler {
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
