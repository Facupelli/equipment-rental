import { Body, ConflictException, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CreateAssetDto } from '../../application/dto/create-asset.dto';
import { GetAssetsQueryDto } from '../../application/dto/get-assets-query.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAssetCommand } from '../../application/commands/create-asset/create-asset.command';
import { GetAssetByIdQuery } from '../../presentation/queries/get-asset-by-id/get-asset-by-id.query';
import { GetAssetsQuery } from '../../presentation/queries/get-assets/get-assets.query';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { AssetResponse } from '@repo/schemas';
import { DuplicateSerialNumberError, ProductTypeNotFoundError } from '../../domain/exceptions/asset.exceptions';

@Controller('assets')
export class AssetController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createAsset(@Body() dto: CreateAssetDto): Promise<string> {
    const command = new CreateAssetCommand(dto);

    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof ProductTypeNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DuplicateSerialNumberError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    return result;
  }

  @Get()
  @Paginated()
  async getAssets(@Query() dto: GetAssetsQueryDto): Promise<AssetResponse[]> {
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
