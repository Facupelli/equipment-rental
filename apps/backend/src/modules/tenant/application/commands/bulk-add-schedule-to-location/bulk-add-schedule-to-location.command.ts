import { CreateLocationScheduleProps } from 'src/modules/tenant/domain/entities/location-schedule.entity';

export class BulkAddSchedulesToLocationCommand {
  constructor(
    public readonly locationId: string,
    public readonly items: CreateLocationScheduleProps[],
  ) {}
}
