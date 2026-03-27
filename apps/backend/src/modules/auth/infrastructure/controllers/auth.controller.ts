import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import { Public } from '../is-public.decorator';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { LocalCustomerAuthGuard } from '../guards/local-customer-auth.guard';
import { RefreshTokenGuard } from '../guards/jwt-refresh.guard';
import { RefreshTokenUser } from '../strategies/jwt-refresh.strategy';
import { CustomerLocalUser } from '../strategies/local-customer.strategy';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { ActorType } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterCustomerCommand } from '../../application/commands/register-customer/regsiter-customer.command';
import { RegisterCustomerDto } from '../../application/dto/register-customer.dto';
import { AuthenticatedUser } from '../../public/authenticated-user';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authService: AuthService,
  ) {}

  // ── User (back-office) ────────────────────────────────────────────────────

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Request() req: { user: User }) {
    const { accessToken, refreshToken } = await this.authService.login({
      id: req.user.id,
      email: req.user.email,
      tenantId: req.user.tenantId,
      actorType: ActorType.USER,
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  // ── Customer (booking portal) ─────────────────────────────────────────────

  @Public()
  @UseGuards(LocalCustomerAuthGuard)
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  async loginCustomer(@Request() req: { user: CustomerLocalUser }) {
    const { accessToken, refreshToken } = await this.authService.login(req.user);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Public()
  @Post('customer/register')
  @HttpCode(HttpStatus.OK)
  async registerCustomer(@Body() dto: RegisterCustomerDto) {
    const customerId = await this.commandBus.execute(
      new RegisterCustomerCommand(
        dto.tenantId,
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
        dto.isCompany,
        dto.companyName,
      ),
    );

    return customerId;
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: { user: RefreshTokenUser }) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user.actorId,
      req.user.actorType,
      req.user.tokenId,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: { user: AuthenticatedUser }) {
    await this.authService.logout(req.user.id, req.user.actorType);
  }
}
