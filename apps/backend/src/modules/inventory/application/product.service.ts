import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../domain/ports/product.repository.port';
import { Product } from '../domain/entities/product.entity';
import { CreateProductDto } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.findAll();
  }

  async save(dto: CreateProductDto): Promise<string> {
    const tenantId = this.tenantContext.getTenantId();

    if (tenantId === undefined) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

    const product = Product.create({
      name: dto.name,
      trackingType: dto.trackingType,
      baseRentalPrice: dto.baseRentalPrice,
      attributes: dto.attributes,
      tenantId,
    });

    return await this.productRepository.save(product);
  }
}
