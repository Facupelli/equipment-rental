import { Module } from '@nestjs/common';
import { TenantContextService } from './application/tenant-context.service';
import { UsersModule } from '../users/users.module';
import { TenancyService } from './application/tenancy.service';
import { TenantConfigPort } from './domain/ports/tenant-config.port';
import { PrismaTenantConfigAdapter } from './infrastructure/persistence/prisma-tenant-config.adapter';
import { CreateTenantUserUseCase } from './application/create-tenant-user.use-case';
import { TenantRepositoryPort } from './domain/ports/tenant.repository.port';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';

const repositories = [
  { provide: TenantRepositoryPort, useClass: TenantRepository },
  { provide: TenantConfigPort, useClass: PrismaTenantConfigAdapter },
];
const services = [TenantContextService, CreateTenantUserUseCase, TenancyService];

@Module({
  imports: [UsersModule],
  controllers: [TenantController],
  providers: [...repositories, ...services],
  exports: [TenantContextService, TenantConfigPort],
})
export class TenantModule {}
