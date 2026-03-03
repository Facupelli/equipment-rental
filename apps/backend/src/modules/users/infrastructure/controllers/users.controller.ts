import { Controller, Get } from '@nestjs/common';
import { UsersService } from '../../application/users.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: ReqUser) {
    return await this.usersService.getMe(user.id);
  }
}
