import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InternalTokenGuard } from './infrastructure/guards/internal-token.guard';
import { TenantContextController } from './infrastructure/controllers/tenant-context.controller';

/**
 * InternalModule owns all endpoints that are called by internal services
 * (e.g. the Cloudflare Worker SSR layer) and must never be exposed publicly.
 *
 * Every endpoint in this module is protected by InternalTokenGuard.
 *
 * Cross-module data access goes through QueryBus — no direct TenantModule
 * import is needed or desired.
 */
@Module({
  imports: [CqrsModule],
  controllers: [TenantContextController],
  providers: [InternalTokenGuard],
})
export class InternalModule {}
