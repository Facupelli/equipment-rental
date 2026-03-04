import { Body, Controller, Post } from '@nestjs/common';
import { CreateProductCategoryDto } from '../../application/dto/create-product-category.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateProductCategoryCommand } from '../../application/commands/create-product-category/create-product-category.command';

@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createProductCategory(@Body() dto: CreateProductCategoryDto): Promise<string> {
    const command = new CreateProductCategoryCommand(dto.name, dto.description);

    return await this.commandBus.execute(command);
  }
}
