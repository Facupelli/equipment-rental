import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProductService } from '../../application/product.service';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { ProductResponseDto } from '@repo/schemas';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<string> {
    return await this.productService.save(dto);
  }

  @Get()
  async getAllWithCategory(@Query('categoryId') categoryId?: string): Promise<ProductResponseDto[]> {
    return await this.productService.findAllWithCategory({ categoryId });
  }
}
