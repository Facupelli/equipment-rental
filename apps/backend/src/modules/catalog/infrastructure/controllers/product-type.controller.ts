import { Body, Controller, Post } from '@nestjs/common';
import { ProductTypeService } from '../../application/product-type.service';
import { CreateProductTypeDto } from '../../application/dto/create-product-type.dto';

@Controller('product-types')
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  @Post()
  async createProductType(@Body() dto: CreateProductTypeDto): Promise<string> {
    return this.productTypeService.create(dto);
  }
}
