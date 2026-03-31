import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantConfig, TenantPricingConfig } from '@repo/schemas';

import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';
import { Public } from 'src/core/decorators/public.decorator';

@Public()
@Controller('tenant')
export class GetTenantPricingConfigHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/pricing-config')
  async me(@Param('id') id: string): Promise<TenantPricingConfig> {
    const tenant = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(new GetTenantConfigQuery(id));

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant.pricing;
  }
}
