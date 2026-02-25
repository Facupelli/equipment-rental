import { Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../domain/ports/product.repository.port';
import { Product } from '../domain/entities/product.entity';
import { CreateProductDto } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { TrackingType } from '@repo/types';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findTrackingType(id: string): Promise<TrackingType | null> {
    return await this.productRepository.findTrackingType(id);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.findAll();
  }

  async save(dto: CreateProductDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const product = Product.create({
      tenantId,
      name: dto.name,
      trackingType: dto.trackingType,
      attributes: dto.attributes,
      baseTier: dto.pricingTiers[0],
    });

    return await this.productRepository.save(product);
  }
}
