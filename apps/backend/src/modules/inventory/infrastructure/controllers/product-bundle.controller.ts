import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductBundleService } from '../../application/product-bundle.service';
import { CreateProductBundleDto } from '../../application/dto/product-bundles/create-product-bundle.dto';

@Controller('product-bundles')
export class ProductBundleController {
  constructor(private readonly productBundleService: ProductBundleService) {}

  @Post()
  async createProductBundle(@Body() dto: CreateProductBundleDto) {
    return await this.productBundleService.create(dto);
  }

  @Get()
  async getProductBundles() {
    return await this.productBundleService.findAll();
  }
}
