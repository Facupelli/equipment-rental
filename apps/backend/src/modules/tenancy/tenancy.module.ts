import { Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenancyRepository } from './tenancy.repository';
import { PrismaTenancyRepository } from './infrastructure/persistance/prisma-tenancy.repository';
import { RegisterTenantAndAdminUseCase } from './services/register-tenant-and-admin.use-case';
import { TenancyController } from './tenancy.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [TenancyController],
  providers: [
    TenantContextService,
    TenantMiddleware,
    { provide: TenancyRepository, useClass: PrismaTenancyRepository },
    RegisterTenantAndAdminUseCase,
  ],
  exports: [TenantContextService],
})
export class TenancyModule {}
