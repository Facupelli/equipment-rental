import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffOnly } from 'src/core/decorators/staff-only.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetUserProfileQuery } from './get-user-profile.query';
import { GetUserProfileReadModel } from './get-user-profile.read-model';
import { GetUserProfileResponseDto } from './get-user-profile.response.dto';

@StaffOnly()
@Controller('users')
export class GetUserProfileHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':userId/profile')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<GetUserProfileResponseDto> {
    const profile = await this.queryBus.execute<GetUserProfileQuery, GetUserProfileReadModel | null>(
      new GetUserProfileQuery(userId, user.tenantId),
    );

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      documentNumber: profile.documentNumber,
      phone: profile.phone,
      address: profile.address,
      signUrl: profile.signUrl,
    } satisfies GetUserProfileResponseDto;
  }
}
