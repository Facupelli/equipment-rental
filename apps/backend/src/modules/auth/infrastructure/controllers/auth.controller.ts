import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../../application/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }
}
