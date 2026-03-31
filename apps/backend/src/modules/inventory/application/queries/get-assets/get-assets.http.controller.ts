import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';

import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

import { GetAssetsQuery } from './get-assets.query';
import { GetAssetsRequestDto } from './get-assets.request.dto';
import { GetAssetsResponseDto } from './get-assets.response.dto';

@StaffRoute(Permission.VIEW_ASSETS)
@Controller('assets')
export class GetAssetsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  async getAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetAssetsRequestDto,
  ): Promise<GetAssetsResponseDto> {
    return this.queryBus.execute(
      new GetAssetsQuery(
        user.tenantId,
        dto.locationId,
        dto.productTypeId,
        dto.isActive,
        dto.search,
        dto.page,
        dto.limit,
      ),
    );
  }
}
