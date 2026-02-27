import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductService } from '../../application/product.service';
import { CreateProductDto } from '../../application/dto/products/create-product.dto';
import { PaginatedDto, ProductDetailDto, ProductListItemResponseDto } from '@repo/schemas';
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

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<ProductDetailDto> {
    return await this.productService.getDetail(id);
  }
}
