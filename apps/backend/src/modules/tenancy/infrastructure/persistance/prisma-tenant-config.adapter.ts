import { Injectable, NotFoundException } from '@nestjs/common';
import { RentalTenancyPricingView, TenantConfigPort } from '../../domain/ports/tenant-config.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantPricingConfig } from '../../domain/value-objects/pricing-config.type';

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

  async findPricingInputs(tenantId: string): Promise<RentalTenancyPricingView | null> {
    const rawTenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { pricingConfig: true, billingUnits: true },
    });

    if (!rawTenant) {
      throw new NotFoundException(`Tenant not found.`);
    }

    const pricingConfig = rawTenant.pricingConfig as unknown as TenantPricingConfig;

    return {
      pricingConfig: {
        weekendCountsAsOne: pricingConfig.weekendCountsAsOne,
        roundingRule: pricingConfig.roundingRule,
        overRentalEnabled: pricingConfig.overRentalEnabled,
        maxOverRentThreshold: pricingConfig.maxOverRentThreshold,
        defaultCurrency: pricingConfig.defaultCurrency,
      },
      billingUnits: rawTenant.billingUnits.map((bu) => ({
        id: bu.id,
        name: bu.name,
        durationHours: bu.durationHours.toNumber(),
        sortOrder: bu.sortOrder,
      })),
    };
  }
}
