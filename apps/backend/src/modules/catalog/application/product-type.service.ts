import { Injectable } from '@nestjs/common';
import { ProductTypeRepositoryPort } from '../domain/ports/product-type.repository.port';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { ProductType } from '../domain/entities/product-type.entity';
import { PricingTier } from '../domain/entities/pricing-tier.entity';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';

@Injectable()
export class ProductTypeService {
  constructor(
    private readonly productTypeRepository: ProductTypeRepositoryPort,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(dto: CreateProductTypeDto): Promise<string> {
    const tenantId = this.tenantContextService.requireTenantId();

    const pricingTiers = dto.pricingTiers.map((t) => PricingTier.create(t));
    const productType = ProductType.create({ ...dto, pricingTiers, tenantId });

    return await this.productTypeRepository.save(productType);
  }
}
