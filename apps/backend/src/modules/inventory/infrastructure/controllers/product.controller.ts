import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductService } from '../../application/product.service';
import { CreateProductDto } from '../../application/dto/create-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return await this.productService.save(dto);
  }

  @Get()
  async getAll() {
    return await this.productService.findAll();
  }
}
