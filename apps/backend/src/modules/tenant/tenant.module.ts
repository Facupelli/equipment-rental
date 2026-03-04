import { Module } from '@nestjs/common';
import { TenantContextService } from './application/tenant-context.service';
import { UsersModule } from '../users/users.module';
import { TenancyService } from './application/tenancy.service';
import { CreateTenantUserUseCase } from './application/create-tenant-user.use-case';
import { TenantReadService, TenantRepositoryPort } from './domain/ports/tenant.repository.port';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';
import { AuthModule } from '../auth/auth.module';

const repositories = [
  { provide: TenantRepositoryPort, useClass: TenantRepository },
  { provide: TenantReadService, useClass: TenantRepository },
];
const services = [TenantContextService, CreateTenantUserUseCase, TenancyService];

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [TenantController],
  providers: [...repositories, ...services],
  exports: [TenantContextService],
})
export class TenantModule {}
