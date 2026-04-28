export interface UpdateLocationScheduleCommandProps {
  tenantId: string;
  locationId: string;
  scheduleId: string;
  openTime: number;
  closeTime: number;
  slotIntervalMinutes: number | null;
}

export class UpdateLocationScheduleCommand {
  public readonly tenantId: string;
  public readonly locationId: string;
  public readonly scheduleId: string;
  public readonly openTime: number;
  public readonly closeTime: number;
  public readonly slotIntervalMinutes: number | null;

  constructor(props: UpdateLocationScheduleCommandProps) {
    this.tenantId = props.tenantId;
    this.locationId = props.locationId;
    this.scheduleId = props.scheduleId;
    this.openTime = props.openTime;
    this.closeTime = props.closeTime;
    this.slotIntervalMinutes = props.slotIntervalMinutes;
  }
}
