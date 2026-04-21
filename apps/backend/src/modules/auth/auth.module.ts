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
import { GoogleIdentityVerificationService } from './infrastructure/services/google-identity-verification.service';
import { ExternalIdentityRepository } from './infrastructure/repositories/external-identity.repository';
import { AuthenticateCustomerWithGoogleCommandHandler } from './application/commands/authenticate-customer-with-google/authenticate-customer-with-google.command-handler';
import { AuthHandoffTokenRepository } from './infrastructure/repositories/auth-handoff-token.repository';
import { GoogleAuthStateService } from './infrastructure/services/google-auth-state.service';
import { ExchangeCustomerGoogleHandoffCommandHandler } from './application/commands/exchange-customer-google-handoff/exchange-customer-google-handoff.command-handler';
import { AuthenticateCustomerWithGoogleHttpController } from './application/commands/authenticate-customer-with-google/authenticate-customer-with-google.http.controller';
import { ExchangeCustomerGoogleHandoffHttpController } from './application/commands/exchange-customer-google-handoff/exchange-customer-google-handoff.http.controller';

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
  controllers: [
    AuthController,
    AuthenticateCustomerWithGoogleHttpController,
    ExchangeCustomerGoogleHandoffHttpController,
  ],
  providers: [
    // Application
    AuthService,
    RegisterCustomerCommandHandler,
    AuthenticateCustomerWithGoogleCommandHandler,
    ExchangeCustomerGoogleHandoffCommandHandler,
    BcryptService,

    // Infrastructure
    TokenRepository,
    AuthHandoffTokenRepository,
    ExternalIdentityRepository,
    GoogleAuthStateService,
    GoogleIdentityVerificationService,

    // Strategies
    LocalStrategy,
    LocalCustomerStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, BcryptService],
})
export class AuthModule {}
