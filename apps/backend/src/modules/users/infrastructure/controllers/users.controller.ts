import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserQuery } from '../../application/queries/get-user/get-user.query';
import { MeResponseDto } from '../../application/dto/me-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  async me(@CurrentUser() reqUser: AuthenticatedUser) {
    const user = await this.queryBus.execute<GetUserQuery, MeResponseDto | null>(new GetUserQuery(reqUser.id));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
