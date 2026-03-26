import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetAssetByIdQuery } from './get-asset-by-id.query';
import { GetAssetByIdRequestDto } from './get-asset-by-id.request.dto';
import { AssetResponseDto } from '@repo/schemas';

@Controller('assets')
export class GetAssetByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(@Param() params: GetAssetByIdRequestDto): Promise<AssetResponseDto> {
    const result = await this.queryBus.execute(new GetAssetByIdQuery(params.id));

    if (!result) {
      throw new NotFoundException('Asset not found');
    }

    return result;
  }
}
