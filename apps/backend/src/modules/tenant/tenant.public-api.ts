import { ScheduleSlotType } from '@repo/types';
import { TenantConfig } from './domain/value-objects/tenant-config.vo';

export interface GetLocationScheduleSlotsDto {
  locationId: string;
  date: Date;
  type: ScheduleSlotType;
}

export abstract class TenantPublicApi {
  abstract getConfig(tenantId: string): Promise<TenantConfig>;
  abstract getLocationScheduleSlots(dto: GetLocationScheduleSlotsDto): Promise<number[]>;
}
