import { Injectable } from '@nestjs/common';
import { ProductCategoryRepositoryPort } from '../domain/ports/product-catalog.repository.port';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ProductCategory } from '../domain/entities/product-category.entity';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly productCategoryRepository: ProductCategoryRepositoryPort) {}

  async create(dto: CreateProductCategoryDto): Promise<string> {
    const productCategory = ProductCategory.create(dto);
    return await this.productCategoryRepository.save(productCategory);
  }
}
