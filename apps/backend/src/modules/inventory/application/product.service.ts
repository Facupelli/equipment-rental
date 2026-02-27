import { Injectable } from '@nestjs/common';
import { findAllWithCategoryFilters, ProductRepositoryPort } from '../domain/ports/product.repository.port';
import { Product } from '../domain/entities/product.entity';
import { CreateProductDto, ProductResponseWithCategoryDto } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { TrackingType } from '@repo/types';
import { ProductMapper } from '../infrastructure/persistance/mappers/product.mapper';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findTrackingType(id: string): Promise<TrackingType | null> {
    return await this.productRepository.findTrackingType(id);
  }

  async findAllWithCategory(filters: findAllWithCategoryFilters): Promise<ProductResponseWithCategoryDto[]> {
    const results = await this.productRepository.findAllWithCategory(filters);

    return results.map(({ product, category }) => ProductMapper.toResponseWithCategory(product, category));
  }

  async save(dto: CreateProductDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const product = Product.create({
      ...dto,
      tenantId,
      categoryId: dto.categoryId ?? null,
      baseTier: dto.pricingTiers[0],
    });

    return await this.productRepository.save(product);
  }
}
