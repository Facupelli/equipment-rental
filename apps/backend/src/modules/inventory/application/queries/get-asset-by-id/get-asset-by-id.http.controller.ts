import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { GetAssetByIdQuery } from './get-asset-by-id.query';
import { GetAssetByIdRequestDto } from './get-asset-by-id.request.dto';
import { AssetResponseDto } from '@repo/schemas';

@Controller('assets')
export class GetAssetByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(@CurrentUser() user: ReqUser, @Param() params: GetAssetByIdRequestDto): Promise<AssetResponseDto> {
    const result = await this.queryBus.execute(new GetAssetByIdQuery(user.tenantId, params.id));

    if (!result) {
      throw new NotFoundException('Asset not found');
    }

    return result;
  }
}
