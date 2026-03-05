import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CreateProductTypeDto } from '../../application/dto/create-product-type.dto';
import { ProductTypeListResponseDto } from '../../application/dto/product-type-list-response.dto';
import { GetProductTypesQueryDto } from '../../application/dto/get-product-types-query.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductTypeCommand } from '../../application/commands/create-product-type/create-product-type.command';
import { GetProductTypeByIdQuery } from '../../application/queries/get-product-type-by-id/get-product-type-by-id.query';
import { GetProductTypesQuery } from '../../application/queries/get-product-types/get-product-types.query';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

@Controller('product-types')
export class ProductTypeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createProductType(@Body() dto: CreateProductTypeDto): Promise<string> {
    const command = new CreateProductTypeCommand(dto);

    return await this.commandBus.execute(command);
  }

  @Get()
  @Paginated()
  async getProductTypes(@Query() dto: GetProductTypesQueryDto): Promise<ProductTypeListResponseDto> {
    const query = new GetProductTypesQuery(dto.categoryId, dto.isActive, dto.search);

    return await this.queryBus.execute(query);
  }

  @Get(':id')
  async getProductTypeById(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetProductTypeByIdQuery(id));

    if (!result) {
      throw new NotFoundException('Product type not found');
    }

    return result;
  }
}
