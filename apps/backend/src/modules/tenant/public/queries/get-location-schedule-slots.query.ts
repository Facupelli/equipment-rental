import { ScheduleSlotType } from '@repo/types';

export class GetLocationScheduleSlotsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly date: string,
    public readonly type: Exclude<ScheduleSlotType, 'BOTH'>,
  ) {}
}
