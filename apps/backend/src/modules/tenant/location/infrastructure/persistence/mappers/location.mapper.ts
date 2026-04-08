import { LocationSchedule as PrismaRentalSchedule, Prisma } from 'src/generated/prisma/client';
import { ScheduleSlotType } from '@repo/types';
import { Location } from '../../../domain/entities/location.entity';
import { LocationSchedule } from '../../../domain/entities/location-schedule.entity';

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
      supportsDelivery: raw.supportsDelivery,
      deliveryDefaults: {
        country: raw.deliveryDefaultCountry,
        stateRegion: raw.deliveryDefaultStateRegion,
        city: raw.deliveryDefaultCity,
        postalCode: raw.deliveryDefaultPostalCode,
      },
      schedules: raw.schedules.map(LocationScheduleMapper.toDomain),
    });
  }

  static toPersistence(entity: Location): Prisma.LocationUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.getName(),
      address: entity.getAddress(),
      isActive: entity.active,
      supportsDelivery: entity.supportsDeliveryEnabled,
      deliveryDefaultCountry: entity.getDeliveryDefaults().country,
      deliveryDefaultStateRegion: entity.getDeliveryDefaults().stateRegion,
      deliveryDefaultCity: entity.getDeliveryDefaults().city,
      deliveryDefaultPostalCode: entity.getDeliveryDefaults().postalCode,
      schedules: {
        create: entity.getSchedules().map(LocationScheduleMapper.toNestedPersistence),
      },
    };
  }

  static toUpdatePersistence(entity: Location): Prisma.LocationUncheckedUpdateInput {
    return {
      name: entity.getName(),
      address: entity.getAddress(),
      isActive: entity.active,
      supportsDelivery: entity.supportsDeliveryEnabled,
      deliveryDefaultCountry: entity.getDeliveryDefaults().country,
      deliveryDefaultStateRegion: entity.getDeliveryDefaults().stateRegion,
      deliveryDefaultCity: entity.getDeliveryDefaults().city,
      deliveryDefaultPostalCode: entity.getDeliveryDefaults().postalCode,
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

  static toNestedPersistence(entity: LocationSchedule): Prisma.LocationScheduleUncheckedCreateWithoutLocationInput {
    return {
      id: entity.id,
      type: entity.type,
      dayOfWeek: entity.dayOfWeek,
      specificDate: entity.specificDate,
      openTime: entity.getWindow().openTime,
      closeTime: entity.getWindow().closeTime,
      slotIntervalMinutes: entity.getWindow().slotIntervalMinutes,
    };
  }
}
