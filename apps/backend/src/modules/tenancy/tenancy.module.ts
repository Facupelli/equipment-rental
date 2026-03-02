import { Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { PrismaTenancyRepository } from './infrastructure/persistance/prisma-tenancy.repository';
import { TenancyController } from './infrastructure/controllers/tenancy.controller';
import { UsersModule } from '../users/users.module';
import { TenancyService } from './application/tenancy.service';
import { TenantConfigPort } from './domain/ports/tenant-config.port';
import { PrismaTenantConfigAdapter } from './infrastructure/persistance/prisma-tenant-config.adapter';
import { TenancyRepositoryPort } from './domain/ports/tenancy.repository.port';
import { CreateTenantUserUseCase } from './application/create-tenant-user.use-case';

const repositories = [
  { provide: TenancyRepositoryPort, useClass: PrismaTenancyRepository },
  { provide: TenantConfigPort, useClass: PrismaTenantConfigAdapter },
];
const services = [TenantContextService, CreateTenantUserUseCase, TenancyService];

@Module({
  imports: [UsersModule],
  controllers: [TenancyController],
  providers: [...repositories, ...services],
  exports: [TenantContextService, TenantConfigPort],
})
export class TenancyModule {}
