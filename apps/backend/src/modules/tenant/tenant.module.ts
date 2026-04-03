import { Module } from '@nestjs/common';
import { PrismaUnitOfWork } from 'src/core/database/prisma-unit-of-work';
import { PrismaService } from 'src/core/database/prisma.service';
import { UsersModule } from '../users/users.module';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { IsSlugTakenQueryHandler } from './application/queries/is-slug-taken/is-slug-taken.query-handler';
import { GetTenantQueryHandler } from './application/queries/get-tenant/get-tenant.query-handler';
import { GetLocationsQueryHandler } from './location/application/queries/get-locations/get-locations.query-handler';
import { GetOwnersQueryHandler } from './owner/application/queries/get-owners/get-owners.query-handler';
import { CreateOwnerCommandHandler } from './owner/application/commands/create-owner/create-owner.command-handler';
import { CreateLocationCommandHandler } from './location/application/commands/create-location/create-location.command-handler';
import { UpdateLocationCommandHandler } from './location/application/commands/update-location/update-location.command-handler';
import { DeactivateLocationCommandHandler } from './location/application/commands/deactivate-location/deactivate-location.command-handler';
import { LocationRepository } from './location/infrastructure/persistence/repositories/location.repository';
import { OwnerRepository } from './owner/infrastructure/persistence/repositories/owner.repository';
import { TenantBillingUnitRepository } from './infrastructure/persistence/repositories/billing-unit.repository';
import { GetTenantBillingUnitsQueryHandler } from './application/queries/get-billing-units/get-tenant-billing-units.query-handler';
import { SyncTenantBillingUnitsService } from './application/commands/sync-billing-units/sync-tenant-billing-units.service';
import { UpdateTenantConfigCommandHandler } from './application/commands/update-config/update-config.command-handler';
import { FindTenantByCustomDomainQueryHandler } from './application/queries/find-tenant-by-custom-domain/find-tenant-by-custom-domain.query-handler';
import { FindTenantBySlugQueryHandler } from './application/queries/find-tenant-by-slug/find-tenant-by-slug.query-handler';
import { GetLocationSchedulesQueryHandler } from './location/application/queries/get-location-schedules/get-location-schedules.query-handler';
import { AddScheduleToLocationCommandHandler } from './location/application/commands/add-schedule-to-location/add-schedule-to-location.command-handler';
import { BulkAddSchedulesToLocationCommandHandler } from './location/application/commands/bulk-add-schedule-to-location/bulk-add-schedule-to-location.command-handler';
import { GetLocationScheduleSlotsQueryHandler } from './location/application/queries/get-location-schedule-slots/get-location-schedule-slots.query-handler';
import { GetLocationContextQueryHandler } from './location/application/queries/get-location-context/get-location-context.query-handler';
import { GetOwnerQueryHandler } from './owner/application/queries/get-owner/get-owner.query-handler';
import { CreateOwnerContractCommandHandler } from './owner/application/commands/create-owner-contract/create-owner-contract.command-handler';
import { OwnerContractRepository } from './owner/infrastructure/persistence/repositories/owner-contract.repository';
import { FindActiveContractForScopeQueryHandler } from './owner/application/queries/find-active-owner-contract/find-active-owner-contract.query-handler';
import { RegisterTenantService } from './application/commands/register-tenant/register-tenant.service';
import { InventoryModule } from '../inventory/inventory.module';
import { GetTenantConfigQueryHandler } from './application/queries/get-tenant-config/get-tenant-config.query-handler';
import { RegisterTenantHttpController } from './application/commands/register-tenant/register-tenant.http.controller';
import { GetCurrentTenantHttpController } from './application/queries/get-tenant/get-current-tenant.http.controller';
import { GetTenantBillingUnitsHttpController } from './application/queries/get-billing-units/get-tenant-billing-units.http.controller';
import { CreateLocationHttpController } from './location/infrastructure/controllers/create-location.http.controller';
import { UpdateLocationHttpController } from './location/infrastructure/controllers/update-location.http.controller';
import { DeactivateLocationHttpController } from './location/infrastructure/controllers/deactivate-location.http.controller';
import { GetLocationsHttpController } from './location/infrastructure/controllers/get-locations.http.controller';
import { GetLocationScheduleSlotsHttpController } from './location/infrastructure/controllers/get-location-schedule-slots.http.controller';
import { GetLocationSchedulesHttpController } from './location/infrastructure/controllers/get-location-schedules.http.controller';
import { AddLocationScheduleHttpController } from './location/infrastructure/controllers/add-location-schedule.http.controller';
import { BulkAddLocationSchedulesHttpController } from './location/infrastructure/controllers/bulk-add-location-schedules.http.controller';
import { CreateOwnerHttpController } from './owner/infrastructure/controllers/create-owner.http.controller';
import { CreateOwnerContractHttpController } from './owner/infrastructure/controllers/create-owner-contract.http.controller';
import { GetOwnersHttpController } from './owner/infrastructure/controllers/get-owners.http.controller';
import { GetOwnerHttpController } from './owner/infrastructure/controllers/get-owner.http.controller';
import { TenantPublicApi } from './tenant.public-api';
import { TenantFacade } from './tenant.facade';
import { UpdateTenantConfigHttpController } from './application/commands/update-config/update-tenant-config.http.controller';
import { SyncTenantBillingUnitsHttpController } from './application/commands/sync-billing-units/sync-tenant-billing-units.http.controller';
import { GetTenantPricingConfigHttpController } from './application/queries/get-tenant-config/get-tenant-pricing-config.http.controller';

const commandHandlers = [
  RegisterTenantService,
  UpdateTenantConfigCommandHandler,
  SyncTenantBillingUnitsService,
  // owner
  CreateOwnerCommandHandler,
  CreateOwnerContractCommandHandler,
  // location
  CreateLocationCommandHandler,
  UpdateLocationCommandHandler,
  DeactivateLocationCommandHandler,
  AddScheduleToLocationCommandHandler,
  BulkAddSchedulesToLocationCommandHandler,
];
const queryHandlers = [
  IsSlugTakenQueryHandler,
  GetTenantConfigQueryHandler,
  GetTenantQueryHandler,
  GetTenantBillingUnitsQueryHandler,
  // owner
  GetOwnersQueryHandler,
  GetOwnerQueryHandler,
  FindActiveContractForScopeQueryHandler,
  // location
  GetLocationsQueryHandler,
  GetLocationContextQueryHandler,
  GetLocationScheduleSlotsQueryHandler,
  GetLocationSchedulesQueryHandler,
  // internal
  FindTenantByCustomDomainQueryHandler,
  FindTenantBySlugQueryHandler,
];

const repositories = [
  {
    provide: TenantRepository,
    useFactory: (prisma: PrismaService) => new TenantRepository(prisma.client),
    inject: [PrismaService],
  },
  TenantBillingUnitRepository,
  LocationRepository,
  OwnerRepository,
  OwnerContractRepository,
];

const controllers = [
  RegisterTenantHttpController,
  GetCurrentTenantHttpController,
  GetTenantPricingConfigHttpController,
  UpdateTenantConfigHttpController,
  GetTenantBillingUnitsHttpController,
  SyncTenantBillingUnitsHttpController,
  CreateLocationHttpController,
  UpdateLocationHttpController,
  DeactivateLocationHttpController,
  GetLocationsHttpController,
  GetLocationScheduleSlotsHttpController,
  GetLocationSchedulesHttpController,
  AddLocationScheduleHttpController,
  BulkAddLocationSchedulesHttpController,
  CreateOwnerHttpController,
  CreateOwnerContractHttpController,
  GetOwnersHttpController,
  GetOwnerHttpController,
];

@Module({
  imports: [UsersModule, InventoryModule],
  controllers: controllers,
  providers: [
    PrismaUnitOfWork,
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    TenantFacade,
    { provide: TenantPublicApi, useExisting: TenantFacade },
  ],
  exports: [TenantPublicApi],
})
export class TenantModule {}
