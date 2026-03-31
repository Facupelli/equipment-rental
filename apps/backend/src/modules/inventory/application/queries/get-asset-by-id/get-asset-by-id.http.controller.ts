import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';

import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { GetAssetByIdQuery } from './get-asset-by-id.query';
import { GetAssetByIdRequestDto } from './get-asset-by-id.request.dto';
import { AssetResponseDto } from '@repo/schemas';

@StaffRoute(Permission.VIEW_ASSETS)
@Controller('assets')
export class GetAssetByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: GetAssetByIdRequestDto,
  ): Promise<AssetResponseDto> {
    const result = await this.queryBus.execute(new GetAssetByIdQuery(user.tenantId, params.id));

    if (!result) {
      throw new NotFoundException('Asset not found');
    }

    return result;
  }
}
