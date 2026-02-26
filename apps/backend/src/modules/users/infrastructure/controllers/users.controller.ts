import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../application/users.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { MeResponseDto } from '../../application/dto/me-response.dto';
import { UserMapper } from '../persistence/user.mapper';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/test')
  async test() {
    return this.usersService.testMe();
  }

  @Get('me')
  async me(@CurrentUser() user: ReqUser): Promise<MeResponseDto> {
    const userEntity = await this.usersService.findById(user.id);

    if (!userEntity) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toResponse(userEntity);
  }
}
