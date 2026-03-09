import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TenantContextService } from './application/tenant-context.service';
import { UsersModule } from '../users/users.module';
import { CreateTenantUserCommandHandler } from './application/commands/create-tenant-user.command-handler';
import { TenantRepositoryPort } from './domain/ports/tenant.repository.port';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';
import { AuthModule } from '../auth/auth.module';
import { IsSlugTakenQueryHandler } from './application/queries/is-slug-taken/is-slug-taken.query-handler';
import { GetTenantQueryHandler } from './application/queries/get-tenant/get-tenant.query-handler';
import { GetLocationsQueryHandler } from './application/queries/get-locations/get-locations.query-handler';
import { GetOwnersQueryHandler } from './application/queries/get-owners/get-owners.query-handler';
import { OwnerController } from './infrastructure/controllers/owner.controller';
import { LocationController } from './infrastructure/controllers/location.controller';
import { CreateOwnerCommandHandler } from './application/commands/create-owner/create-owner.command-handler';
import { CreateLocationCommandHandler } from './application/commands/create-location/create-location.command-handler';
import { LocationRepository } from './infrastructure/persistence/repositories/location.repository';
import { OwnerRepository } from './infrastructure/persistence/repositories/owner.repository';
import { OwnerRepositoryPort } from './domain/ports/owner.repository.port';
import { LocationRepositoryPort } from './domain/ports/location.repository.port';
import { TenantBillingUnitRepositoryPort } from './domain/ports/billing-unit.repository.port';
import { TenantBillingUnitRepository } from './infrastructure/persistence/repositories/billing-unit.repository';
import { GetTenantBillingUnitsQueryHandler } from './application/queries/get-billing-units/get-tenant-billing-units.query-handler';
import { SyncTenantBillingUnitsCommandHandler } from './application/commands/create-billing-unit/sync-billing-units.command';
import { TenantPublicApi } from './tenant.public-api';
import { TenantApplicationService } from './application/tenant.application-service';
import { UpdateTenantConfigCommandHandler } from './application/commands/update-config/update-config.command-handler';

const commandHandlers = [
  CreateTenantUserCommandHandler,
  UpdateTenantConfigCommandHandler,
  CreateOwnerCommandHandler,
  CreateLocationCommandHandler,
  SyncTenantBillingUnitsCommandHandler,
];
const queryHandlers = [
  IsSlugTakenQueryHandler,
  GetTenantQueryHandler,
  GetLocationsQueryHandler,
  GetOwnersQueryHandler,
  GetTenantBillingUnitsQueryHandler,
];

const repositories = [
  { provide: TenantRepositoryPort, useClass: TenantRepository },
  { provide: TenantBillingUnitRepositoryPort, useClass: TenantBillingUnitRepository },
  { provide: LocationRepositoryPort, useClass: LocationRepository },
  { provide: OwnerRepositoryPort, useClass: OwnerRepository },
];
const services = [
  TenantContextService,
  {
    provide: TenantPublicApi,
    useClass: TenantApplicationService,
  },
];

@Module({
  imports: [UsersModule, AuthModule, CqrsModule],
  controllers: [TenantController, OwnerController, LocationController],
  providers: [...repositories, ...services, ...commandHandlers, ...queryHandlers],
  exports: [TenantContextService, TenantPublicApi],
})
export class TenantModule {}
