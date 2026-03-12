import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { AppConfigModule } from './config/config.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/infrastructure/guards/jwt-auth.guard';
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

@Module({
  imports: [
    SharedModule,
    LoggerModule,
    AppConfigModule,
    DatabaseModule,
    CqrsModule.forRoot(),
    InternalModule,
    TenantModule,
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
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
