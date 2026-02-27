import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepositoryPort } from '../domain/ports/product-repository.port';
import { Product } from '../domain/entities/product.entity';
import { CreateProductDto, PaginatedDto, ProductDetailDto, ProductListItemResponseDto } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { TrackingType } from '@repo/types';
import { GetProductsQueryDto } from './dto/products/get-product-list-query.dto';
import { ProductQueryPort } from '../domain/ports/product-query.port';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly readRepository: ProductQueryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findTrackingType(id: string): Promise<TrackingType | null> {
    return await this.productRepository.findTrackingType(id);
  }

  async findAllWithCategory(filters: GetProductsQueryDto): Promise<PaginatedDto<ProductListItemResponseDto>> {
    const result = await this.readRepository.findAll(filters);
    return result;
  }

  async getDetail(productId: string): Promise<ProductDetailDto> {
    const result = await this.readRepository.findById(productId);

    if (!result) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    return result;
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
