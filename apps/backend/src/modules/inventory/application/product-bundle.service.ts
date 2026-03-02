import { Injectable } from '@nestjs/common';
import { BundleRepositoryPort } from '../domain/ports/product-bundle.repository.port';
import { ProductBundle } from '../domain/entities/product-bundle.entity';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { CreateProductBundleDto } from './dto/product-bundles/create-product-bundle.dto';
import { BundleComponent } from '../domain/value-objects/bundle-component.vo';

@Injectable()
export class ProductBundleService {
  constructor(
    private readonly repository: BundleRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateProductBundleDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const components = dto.components.map((c) =>
      BundleComponent.create({ productId: c.productId, quantity: c.quantity }),
    );

    const productBundle = ProductBundle.create({
      ...dto,
      tenantId,
      description: dto.description ?? null,
      components,
      baseTier: dto.baseTier,
    });

    return await this.repository.save(productBundle);
  }

  async findAll(): Promise<any> {
    return await this.repository.findAll();
  }
}
