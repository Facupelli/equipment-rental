import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../../application/auth.service';
import { Public } from '../is-public.decorator';
import { RefreshTokenGuard } from '../guards/jwt-refresh.guard';
import { RefreshTokenUser } from '../strategies/jwt-refresh.strategy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: User }) {
    const { accessToken, refreshToken } = await this.authService.login(req.user);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: { user: RefreshTokenUser }) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(req.user.userId, req.user.tokenId);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: { user: { sub: string } }) {
    await this.authService.logout(req.user.sub);
  }
}
