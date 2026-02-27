import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProductService } from '../../application/product.service';
import { CreateProductDto } from '../../application/dto/products/create-product.dto';
import { PaginatedDto, ProductListItemResponseDto } from '@repo/schemas';
import { GetProductsQueryDto } from '../../application/dto/products/get-product-list-query.dto';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<string> {
    return await this.productService.save(dto);
  }

  @Get()
  @Paginated()
  async getAllWithCategory(@Query() query: GetProductsQueryDto): Promise<PaginatedDto<ProductListItemResponseDto>> {
    return await this.productService.findAllWithCategory(query);
  }
}
