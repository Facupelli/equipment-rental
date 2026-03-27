import { ScheduleSlotType } from '@repo/types';

export interface BulkAddScheduleToLocationItem {
  locationId: string;
  type: ScheduleSlotType;
  dayOfWeek: number | null;
  specificDate: Date | null;
  window: {
    openTime: number;
    closeTime: number;
    slotIntervalMinutes: number | null;
  };
}

export class BulkAddSchedulesToLocationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly items: BulkAddScheduleToLocationItem[],
  ) {}
}
