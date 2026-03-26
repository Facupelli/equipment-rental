import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Paginated } from 'src/core/decorators/paginated-response.decorator';

import { GetAssetsQuery } from './get-assets.query';
import { GetAssetsRequestDto } from './get-assets.request.dto';
import { GetAssetsResponseDto } from './get-assets.response.dto';

@Controller('assets')
export class GetAssetsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  async getAll(@Query() dto: GetAssetsRequestDto): Promise<GetAssetsResponseDto> {
    return this.queryBus.execute(
      new GetAssetsQuery(dto.locationId, dto.productTypeId, dto.isActive, dto.search, dto.page, dto.limit),
    );
  }
}
