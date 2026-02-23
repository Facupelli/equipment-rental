import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { AppConfigModule } from './config/config.module';
import { LocationModule } from './modules/location/location.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/infrastructure/guards/jwt-auth.guard';
import { TenantInterceptor } from './modules/tenancy/tenant.interceptor';

@Module({
  imports: [AppConfigModule, DatabaseModule, TenancyModule, AuthModule, UsersModule, LocationModule],
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
