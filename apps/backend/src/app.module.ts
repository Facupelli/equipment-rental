import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { AppConfigModule } from './config/config.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ActorTypeGuard } from './modules/auth/infrastructure/guards/actor-type.guard';
import { JwtAuthGuard } from './modules/auth/infrastructure/guards/jwt-auth.guard';
import { PermissionsGuard } from './modules/auth/infrastructure/guards/permissions.guard';
import { TenantInterceptor } from './modules/shared/tenant/tenant.interceptor';
import { LoggerModule } from './core/logger/logger.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrderModule } from './modules/order/order.module';
import { CqrsModule } from '@nestjs/cqrs';
import { BillingUnitModule } from './modules/billing-unit/billing-unit.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { InternalModule } from './modules/internal/internal.module';
import { SharedModule } from './modules/shared/shared.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthController } from './health/health.controller';
import { DomainEventsModule } from './core/domain/events/domain-events.module';

@Module({
  imports: [
    SharedModule,
    LoggerModule,
    AppConfigModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    DomainEventsModule,
    CqrsModule.forRoot(),
    InternalModule,
    TenantModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    InventoryModule,
    CustomerModule,
    OrderModule,
    BillingUnitModule,
    PricingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActorTypeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
