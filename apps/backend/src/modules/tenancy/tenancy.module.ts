import { Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { PrismaTenancyRepository } from './infrastructure/persistance/prisma-tenancy.repository';
import { TenancyController } from './infrastructure/controllers/tenancy.controller';
import { UsersModule } from '../users/users.module';
import { TenancyRepository } from './domain/repositories/tenancy.repository';
import { RegisterTenantAndAdminUseCase } from './application/use-cases/register-tenant-and-admin.use-case';
import { TenancyService } from './application/tenancy.service';

const repositories = [{ provide: TenancyRepository, useClass: PrismaTenancyRepository }];
const services = [TenantContextService, RegisterTenantAndAdminUseCase, TenancyService];

@Module({
  imports: [UsersModule],
  controllers: [TenancyController],
  providers: [...repositories, ...services],
  exports: [TenantContextService],
})
export class TenancyModule {}
