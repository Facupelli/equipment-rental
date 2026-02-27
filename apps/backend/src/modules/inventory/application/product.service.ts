import { Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../domain/ports/product.repository.port';
import { Product } from '../domain/entities/product.entity';
import { CreateProductDto, PaginatedDto, ProductListItemResponseDto } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { TrackingType } from '@repo/types';
import { ProductMapper } from '../infrastructure/persistance/mappers/product.mapper';
import { GetProductsQueryDto } from './dto/products/get-product-list-query.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findTrackingType(id: string): Promise<TrackingType | null> {
    return await this.productRepository.findTrackingType(id);
  }

  async findAllWithCategory(filters: GetProductsQueryDto): Promise<PaginatedDto<ProductListItemResponseDto>> {
    const result = await this.productRepository.findAllWithCategory(filters);

    return {
      data: result.data.map(ProductMapper.listItemToResponse),
      meta: result.meta,
    };
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
