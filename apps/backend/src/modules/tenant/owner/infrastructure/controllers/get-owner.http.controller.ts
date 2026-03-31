import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { GetOwnerResponseDto } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetOwnerQuery } from '../../application/queries/get-owner/get-owner.query';

@StaffRoute(Permission.VIEW_OWNERS)
@Controller('owners')
export class GetOwnerHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':ownerId')
  async getOwner(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ownerId') ownerId: string,
  ): Promise<GetOwnerResponseDto> {
    const owner = await this.queryBus.execute<GetOwnerQuery, GetOwnerResponseDto | null>(
      new GetOwnerQuery(user.tenantId, ownerId),
    );

    if (!owner) {
      throw new NotFoundException(`Owner with id ${ownerId} not found`);
    }

    return owner;
  }
}
