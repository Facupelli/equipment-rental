import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBundleDto } from '../../application/dto/create-bundle.dto';
import { CreateBundleCommand } from '../../application/commands/create-bundle/create-bundle.command';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { GetBundlesQueryDto } from '../../application/dto/get-bundles-query.dto';
import { BundleDetailResponseDto, BundleListItemResponseDto, PaginatedDto } from '@repo/schemas';
import { GetBundlesQuery } from '../../application/queries/get-bundles/get-bundles.query';
import { GetBundleByIdQuery } from '../../application/queries/get-bundle-by-id/get-bundle-by-id.query';

@Controller('bundles')
export class BundleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createBundle(@Body() dto: CreateBundleDto): Promise<string> {
    const command = new CreateBundleCommand(dto.billingUnitId, dto.name, dto.isActive, dto.components);

    return await this.commandBus.execute(command);
  }

  @Get()
  @Paginated()
  async getProductTypes(@Query() dto: GetBundlesQueryDto): Promise<PaginatedDto<BundleListItemResponseDto>> {
    const query = new GetBundlesQuery(dto.page, dto.limit, dto.name);

    return await this.queryBus.execute(query);
  }

  @Get(':id')
  async getProductTypeById(@Param('id') id: string): Promise<BundleDetailResponseDto> {
    const result = await this.queryBus.execute(new GetBundleByIdQuery(id));

    if (!result) {
      throw new NotFoundException('Bundle not found');
    }

    return result;
  }
}
