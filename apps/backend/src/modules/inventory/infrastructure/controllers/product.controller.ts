import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductService } from '../../application/product.service';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { ProductMapper } from '../persistance/mappers/product.mapper';
import { ProductResponseDto } from '@repo/schemas';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<string> {
    return await this.productService.save(dto);
  }

  @Get()
  async getAll(): Promise<ProductResponseDto[]> {
    const products = await this.productService.findAll();

    return products.map((product) => ProductMapper.toResponse(product));
  }
}
