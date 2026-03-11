import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import { Public } from '../is-public.decorator';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { LocalCustomerAuthGuard } from '../guards/local-customer-auth.guard';
import { RefreshTokenGuard } from '../guards/jwt-refresh.guard';
import { RefreshTokenUser } from '../strategies/jwt-refresh.strategy';
import { CustomerLocalUser } from '../strategies/local-customer.strategy';
import { ReqUser } from '../strategies/jwt.strategy';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { ActorType } from '@repo/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async logout(@Request() req: { user: ReqUser }) {
    await this.authService.logout(req.user.id, req.user.actorType);
  }
}
