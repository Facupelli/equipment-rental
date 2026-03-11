import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { AuthService } from './application/auth.service';
import { RefreshTokenStrategy } from './infrastructure/strategies/jwt-refresh.strategy';
import { BcryptService } from './application/bcript.service';
import { CustomerModule } from '../customer/customer.module';
import { TokenRepository } from './infrastructure/repositories/token.repository';
import { LocalCustomerStrategy } from './infrastructure/strategies/local-customer.strategy';
import { RegisterCustomerCommandHandler } from './application/commands/register-customer/regsiter-customer.command-handler';

@Module({
  imports: [
    UsersModule,
    CustomerModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION_TIME_SECONDS') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Application
    AuthService,
    RegisterCustomerCommandHandler,
    BcryptService,

    // Infrastructure
    TokenRepository,

    // Strategies
    LocalStrategy,
    LocalCustomerStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, BcryptService],
})
export class AuthModule {}
