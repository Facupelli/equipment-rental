import { Injectable, NotFoundException } from '@nestjs/common';
import { RentalTenancyPricingView, TenantConfigPort } from '../../domain/ports/tenant-config.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantConfig } from '../../domain/value-objects/pricing-config.type';

export class BillingUnitReadModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly durationHours: number,
    public readonly sortOrder: number,
  ) {}
}

@Injectable()
export class PrismaTenantConfigAdapter extends TenantConfigPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getConfig(tenantId: string): Promise<TenantConfig> {
    const rawTenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true },
    });

    if (!rawTenant) {
      throw new NotFoundException(`Tenant not found.`);
    }

    const config = rawTenant.config as unknown as TenantConfig;

    return config;
  }

  async findPricingInputs(tenantId: string): Promise<RentalTenancyPricingView> {
    const rawTenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true, billingUnits: true },
    });

    if (!rawTenant) {
      throw new NotFoundException(`Tenant not found.`);
    }

    const config = rawTenant.config as unknown as TenantConfig;

    return {
      pricingConfig: config.pricing,
      billingUnits: rawTenant.billingUnits.map((bu) => ({
        id: bu.id,
        name: bu.name,
        durationHours: bu.durationHours.toNumber(),
        sortOrder: bu.sortOrder,
      })),
    };
  }
}
