import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CreateAssetDto } from '../../application/dto/create-asset.dto';
import { GetAssetsQueryDto } from '../../application/dto/get-assets-query.dto';
import { AssetListResponseDto } from '../../application/dto/asset-list-response.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAssetCommand } from '../../application/commands/create-asset/create-asset.command';
import { GetAssetByIdQuery } from '../../application/queries/get-asset-by-id/get-asset-by-id.query';
import { GetAssetsQuery } from '../../application/queries/get-assets/get-assets.query';

@Controller('assets')
export class AssetController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createAsset(@Body() dto: CreateAssetDto): Promise<string> {
    const command = new CreateAssetCommand(dto);
    return await this.commandBus.execute(command);
  }

  @Get()
  async getAssets(@Query() dto: GetAssetsQueryDto): Promise<AssetListResponseDto> {
    const query = new GetAssetsQuery(dto.locationId, dto.productTypeId, dto.isActive, dto.search);
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  async getAssetById(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetAssetByIdQuery(id));

    if (!result) {
      throw new NotFoundException('Asset not found');
    }

    return result;
  }
}
