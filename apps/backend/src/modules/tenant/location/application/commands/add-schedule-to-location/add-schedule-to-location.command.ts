import { ScheduleSlotType } from '@repo/types';

export interface AddScheduleToLocationCommandProps {
  tenantId: string;
  locationId: string;
  type: ScheduleSlotType;
  dayOfWeek: number | null;
  specificDate: Date | null;
  openTime: number;
  closeTime: number;
  slotIntervalMinutes: number | null;
}

export class AddScheduleToLocationCommand {
  public readonly tenantId: string;
  public readonly locationId: string;
  public readonly type: ScheduleSlotType;
  public readonly dayOfWeek: number | null;
  public readonly specificDate: Date | null;
  public readonly openTime: number;
  public readonly closeTime: number;
  public readonly slotIntervalMinutes: number | null;

  constructor(props: AddScheduleToLocationCommandProps) {
    this.tenantId = props.tenantId;
    this.locationId = props.locationId;
    this.type = props.type;
    this.dayOfWeek = props.dayOfWeek;
    this.specificDate = props.specificDate;
    this.openTime = props.openTime;
    this.closeTime = props.closeTime;
    this.slotIntervalMinutes = props.slotIntervalMinutes;
  }
}
