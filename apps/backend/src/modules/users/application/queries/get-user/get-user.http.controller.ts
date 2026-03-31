import { StaffOnly } from 'src/core/decorators/staff-only.decorator';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetUserQuery } from './get-user.query';
import { GetUserReadModel } from './get-user.types';
import { GetUserResponseDto } from './get-user.response.dto';

@StaffOnly()
@Controller('users')
export class GetUserHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  async me(@CurrentUser() reqUser: AuthenticatedUser) {
    const user = await this.queryBus.execute<GetUserQuery, GetUserReadModel | null>(
      new GetUserQuery(reqUser.id, reqUser.tenantId),
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      tenantId: user.tenantId,
      roles: user.roles,
    } satisfies GetUserResponseDto;
  }
}
