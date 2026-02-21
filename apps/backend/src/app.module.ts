import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, AuthModule, UsersModule, TenancyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
