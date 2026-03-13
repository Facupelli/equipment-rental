import { LocationSchedule as PrismaRentalSchedule, Prisma } from 'src/generated/prisma/client';
import { ScheduleSlotType } from '@repo/types';
import { LocationSchedule } from 'src/modules/tenant/domain/entities/location-schedule.entity';
import { Location } from 'src/modules/tenant/domain/entities/location.entity';

type PrismaLocationWithSchedules = Prisma.LocationGetPayload<{
  include: {
    schedules: true;
  };
}>;

export class LocationMapper {
  static toDomain(raw: PrismaLocationWithSchedules): Location {
    return Location.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      address: raw.address,
      isActive: raw.isActive,
      schedules: raw.schedules.map(LocationScheduleMapper.toDomain),
    });
  }

  static toPersistence(entity: Location): Prisma.LocationUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      address: entity.address,
      isActive: entity.active,
      schedules: {
        create: entity.getSchedules().map(LocationScheduleMapper.toPersistence),
      },
    };
  }

  static toUpdatePersistence(entity: Location): Prisma.LocationUncheckedUpdateInput {
    return {
      name: entity.name,
      address: entity.address,
      isActive: entity.active,
    };
  }
}

export class LocationScheduleMapper {
  static toDomain(raw: PrismaRentalSchedule): LocationSchedule {
    return LocationSchedule.reconstitute({
      id: raw.id,
      locationId: raw.locationId,
      type: raw.type as ScheduleSlotType,
      dayOfWeek: raw.dayOfWeek,
      specificDate: raw.specificDate,
      window: {
        openTime: raw.openTime,
        closeTime: raw.closeTime,
        slotIntervalMinutes: raw.slotIntervalMinutes,
      },
    });
  }

  static toPersistence(entity: LocationSchedule): Prisma.LocationScheduleUncheckedCreateInput {
    return {
      id: entity.id,
      locationId: entity.locationId,
      type: entity.type,
      dayOfWeek: entity.dayOfWeek,
      specificDate: entity.specificDate,
      openTime: entity.getWindow().openTime,
      closeTime: entity.getWindow().closeTime,
      slotIntervalMinutes: entity.getWindow().slotIntervalMinutes,
    };
  }
}
