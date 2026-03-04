import { Body, Controller, Post } from '@nestjs/common';
import { CreateProductCategoryDto } from '../../application/dto/create-product-category.dto';
import { ProductCategoryService } from '../../application/product-category.service';

@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly productCategoryService: ProductCategoryService) {}

  @Post()
  async createProductCategory(@Body() dto: CreateProductCategoryDto): Promise<string> {
    return this.productCategoryService.create(dto);
  }
}
