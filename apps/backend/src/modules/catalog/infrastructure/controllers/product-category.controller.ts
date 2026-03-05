import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateProductCategoryDto } from '../../application/dto/create-product-category.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductCategoryCommand } from '../../application/commands/create-product-category/create-product-category.command';
import { GetProductCategoriesQuery } from '../../application/queries/get-product-categories/get-product-categories.query';
import { ProductCategoryResponse } from '@repo/schemas';

@Controller('product-categories')
export class ProductCategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createProductCategory(@Body() dto: CreateProductCategoryDto): Promise<string> {
    const command = new CreateProductCategoryCommand(dto.name, dto.description);

    return await this.commandBus.execute(command);
  }

  @Get()
  async getProductCategories(): Promise<ProductCategoryResponse[]> {
    return await this.queryBus.execute(new GetProductCategoriesQuery());
  }
}
