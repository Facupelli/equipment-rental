import { PricingTier as PrismaPricingTier } from 'src/generated/prisma/client';
import { PricingTier } from '../../domain/entities/pricing-tier.entity';
import { Prisma } from 'src/generated/prisma/browser';

export class PricingTierMapper {
  static toDomain(prismaTier: PrismaPricingTier): PricingTier {
    return PricingTier.reconstitute({
      id: prismaTier.id,
      tenantId: prismaTier.tenantId,
      productId: prismaTier.productId,
      inventoryItemId: prismaTier.inventoryItemId,

      // Prisma returns Decimal objects. We convert them to numbers for the domain.
      // Note: For financial precision, you might want to convert to string or a Money Value Object
      // depending on how strict your pricing engine is. Here we use number for simplicity.
      minDays: prismaTier.minDays.toNumber(),
      maxDays: prismaTier.maxDays ? prismaTier.maxDays.toNumber() : null,
      pricePerDay: prismaTier.pricePerDay.toNumber(),

      createdAt: prismaTier.createdAt,
      updatedAt: prismaTier.updatedAt,
    });
  }

  static toPersistence(entity: PricingTier): Prisma.PricingTierUncheckedCreateInput {
    return {
      id: entity.Id,
      tenantId: entity.TenantId,
      productId: entity.ProductId ? entity.ProductId : undefined,
      inventoryItemId: entity.InventoryItemId ? entity.InventoryItemId : undefined,

      minDays: entity.MinDays,
      maxDays: entity.MaxDays,
      pricePerDay: entity.PricePerDay,

      updatedAt: entity.UpdatedAt,
    };
  }
}
