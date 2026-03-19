import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '../users/users.module';
import { CreateTenantUserCommandHandler } from './application/commands/create-tenant-user.command-handler';
import { TenantRepositoryPort } from './domain/ports/tenant.repository.port';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';
import { AuthModule } from '../auth/auth.module';
import { IsSlugTakenQueryHandler } from './application/queries/is-slug-taken/is-slug-taken.query-handler';
import { GetTenantQueryHandler } from './application/queries/get-tenant/get-tenant.query-handler';
import { GetLocationsQueryHandler } from './location/presentation/queries/get-locations/get-locations.query-handler';
import { GetOwnersQueryHandler } from './owner/presentation/queries/get-owners/get-owners.query-handler';
import { LocationController } from './location/infrastrcuture/controllers/location.controller';
import { CreateOwnerCommandHandler } from './owner/application/commands/create-owner/create-owner.command-handler';
import { CreateLocationCommandHandler } from './location/application/commands/create-location/create-location.command-handler';
import { LocationRepository } from './location/infrastrcuture/persistence/repositories/location.repository';
import { OwnerRepository } from './owner/infrastructure/persistence/repositories/owner.repository';
import { OwnerRepositoryPort } from './owner/domain/ports/owner.repository.port';
import { LocationRepositoryPort } from './domain/ports/location.repository.port';
import { TenantBillingUnitRepositoryPort } from './domain/ports/billing-unit.repository.port';
import { TenantBillingUnitRepository } from './infrastructure/persistence/repositories/billing-unit.repository';
import { GetTenantBillingUnitsQueryHandler } from './application/queries/get-billing-units/get-tenant-billing-units.query-handler';
import { SyncTenantBillingUnitsCommandHandler } from './application/commands/create-billing-unit/sync-billing-units.command';
import { TenantPublicApi } from './tenant.public-api';
import { TenantApplicationService } from './application/tenant.application-service';
import { UpdateTenantConfigCommandHandler } from './application/commands/update-config/update-config.command-handler';
import { FindTenantByCustomDomainQueryHandler } from './application/queries/find-tenant-by-custom-domain/find-tenant-by-custom-domain.query-handler';
import { FindTenantBySlugQueryHandler } from './application/queries/find-tenant-by-slug/find-tenant-by-slug.query-handler';
import { GetLocationSchedulesQueryHandler } from './location/presentation/queries/get-location-schedules/get-location-schedules.query-handler';
import { AddScheduleToLocationCommandHandler } from './location/application/commands/add-schedule-to-location/add-schedule-to-location.command-handler';
import { BulkAddSchedulesToLocationCommandHandler } from './location/application/commands/bulk-add-schedule-to-location/bulk-add-schedule-to-location.command-handler';
import { OwnerController } from './owner/infrastructure/controllers/owner.controller';
import { GetLocationScheduleSlotsQueryHandler } from './location/presentation/queries/get-location-schedule-slots/get-location-schedule-slots.query-handler';

const commandHandlers = [
  CreateTenantUserCommandHandler,
  UpdateTenantConfigCommandHandler,
  CreateOwnerCommandHandler,
  CreateLocationCommandHandler,
  SyncTenantBillingUnitsCommandHandler,
  // location schedule
  AddScheduleToLocationCommandHandler,
  BulkAddSchedulesToLocationCommandHandler,
];
const queryHandlers = [
  IsSlugTakenQueryHandler,
  GetTenantQueryHandler,
  GetLocationsQueryHandler,
  GetOwnersQueryHandler,
  GetTenantBillingUnitsQueryHandler,
  // location schedule
  GetLocationScheduleSlotsQueryHandler,
  GetLocationSchedulesQueryHandler,
  // internal
  FindTenantByCustomDomainQueryHandler,
  FindTenantBySlugQueryHandler,
];

const repositories = [
  { provide: TenantRepositoryPort, useClass: TenantRepository },
  { provide: TenantBillingUnitRepositoryPort, useClass: TenantBillingUnitRepository },
  { provide: LocationRepositoryPort, useClass: LocationRepository },
  { provide: OwnerRepositoryPort, useClass: OwnerRepository },
];
const services = [
  TenantApplicationService,
  {
    provide: TenantPublicApi,
    useClass: TenantApplicationService,
  },
];

@Module({
  imports: [UsersModule, AuthModule, CqrsModule],
  controllers: [TenantController, OwnerController, LocationController],
  providers: [...repositories, ...services, ...commandHandlers, ...queryHandlers],
  exports: [TenantPublicApi],
})
export class TenantModule {}
