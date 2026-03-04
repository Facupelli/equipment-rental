import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TenantContextService } from './application/tenant-context.service';
import { UsersModule } from '../users/users.module';
import { TenancyService } from './application/tenancy.service';
import { CreateTenantUserCommandHandler } from './application/commands/create-tenant-user.command-handler';
import { TenantReadService, TenantRepositoryPort } from './domain/ports/tenant.repository.port';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';
import { AuthModule } from '../auth/auth.module';

const CommandHandlers = [CreateTenantUserCommandHandler];

const repositories = [
  { provide: TenantRepositoryPort, useClass: TenantRepository },
  { provide: TenantReadService, useClass: TenantRepository },
];
const services = [TenantContextService, TenancyService];

@Module({
  imports: [UsersModule, AuthModule, CqrsModule],
  controllers: [TenantController],
  providers: [...repositories, ...services, ...CommandHandlers],
  exports: [TenantContextService],
})
export class TenantModule {}
