import { Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantMiddleware } from './tenant.middleware';
import { PrismaTenancyRepository } from './infrastructure/persistance/prisma-tenancy.repository';
import { RegisterTenantAndAdminUseCase } from './services/register-tenant-and-admin.use-case';
import { TenancyController } from './tenancy.controller';
import { UsersModule } from '../users/users.module';
import { TenancyRepository } from './domain/repositories/tenancy.repository';
import { TenancyService } from './services/tenancy.service';

const repositories = [{ provide: TenancyRepository, useClass: PrismaTenancyRepository }];
const services = [TenantContextService, TenantMiddleware, RegisterTenantAndAdminUseCase, TenancyService];

@Module({
  imports: [UsersModule],
  controllers: [TenancyController],
  providers: [...repositories, ...services],
  exports: [TenantContextService],
})
export class TenancyModule {}
