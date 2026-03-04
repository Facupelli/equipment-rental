import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TenantContextService } from './application/tenant-context.service';
import { UsersModule } from '../users/users.module';
import { CreateTenantUserCommandHandler } from './application/commands/create-tenant-user.command-handler';
import { TenantRepositoryPort } from './domain/ports/tenant.repository.port';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';
import { AuthModule } from '../auth/auth.module';
import { IsSlugTakenQueryHandler } from './application/queries/is-slug-taken.query-handler';

const commandHandlers = [CreateTenantUserCommandHandler];
const queryHandlers = [IsSlugTakenQueryHandler];

const repositories = [{ provide: TenantRepositoryPort, useClass: TenantRepository }];
const services = [TenantContextService];

@Module({
  imports: [UsersModule, AuthModule, CqrsModule],
  controllers: [TenantController],
  providers: [...repositories, ...services, ...commandHandlers, ...queryHandlers],
  exports: [TenantContextService],
})
export class TenantModule {}
