import { BadRequestException, Injectable } from '@nestjs/common';
import { PricingTierRepositoryPort } from '../domain/ports/pricing-tier.repository.port';
import { PricingTier } from '../domain/entities/pricing-tier.entity';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { CreatePricingTierDto } from './dto/create-pricing-tier.dto';

@Injectable()
export class PricingTierService {
  constructor(
    private readonly pricingTierRepository: PricingTierRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async save(dto: CreatePricingTierDto): Promise<string> {
    const tenantId = this.tenantContext.getTenantId();

    if (tenantId === undefined) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

    const item = PricingTier.create({ ...dto, tenantId });

    return await this.pricingTierRepository.save(item);
  }
}
