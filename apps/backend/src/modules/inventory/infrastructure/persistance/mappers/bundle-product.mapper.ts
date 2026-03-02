import {
  Prisma,
  BundlePricingTier as PrismaBundlePricingTier,
  BundleComponent as PrismaBundleComponent,
} from 'src/generated/prisma/client';
import { ProductBundle, ProductBundleProps } from '../../../domain/entities/product-bundle.entity';
import { BundlePricingTier, BundlePricingTierProps } from '../../../domain/entities/bundle-pricing-tier.entity';
import { randomUUID } from 'node:crypto';
import { BundleComponent } from 'src/modules/inventory/domain/value-objects/bundle-component.vo';

export type PrismaBundleBase = Prisma.ProductBundleGetPayload<{
  include: {
    pricingTiers: true;
    components: true;
  };
}>;

export class BundleMapper {
  public static toDomain(prismaBundle: PrismaBundleBase): ProductBundle {
    const props: ProductBundleProps = {
      id: prismaBundle.id,
      tenantId: prismaBundle.tenantId,
      name: prismaBundle.name,
      description: prismaBundle.description,
      isActive: prismaBundle.isActive,
      pricingTiers: prismaBundle.pricingTiers.map(BundleMapper.tierToDomain),
      components: prismaBundle.components.map(BundleMapper.componentToDomain),
      createdAt: prismaBundle.createdAt,
      updatedAt: prismaBundle.updatedAt,
    };

    return ProductBundle.reconstitute(props);
  }

  public static toPersistence(entity: ProductBundle): Prisma.ProductBundleUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      description: entity.description,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      pricingTiers: {
        create: entity.pricingTiers.map(BundleMapper.tierToPersistenceCreate),
      },
      components: {
        create: entity.components.map(BundleMapper.componentToPersistenceCreate),
      },
    };
  }

  // --- Tier helpers ---

  private static tierToDomain(prismaTier: PrismaBundlePricingTier): BundlePricingTier {
    const props: BundlePricingTierProps = {
      id: prismaTier.id,
      tenantId: prismaTier.tenantId,
      bundleId: prismaTier.bundleId,
      billingUnitId: prismaTier.billingUnitId,
      fromUnit: prismaTier.fromUnit.toNumber(),
      pricePerUnit: prismaTier.pricePerUnit.toNumber(),
      currency: prismaTier.currency,
      createdAt: prismaTier.createdAt,
      updatedAt: prismaTier.updatedAt,
    };

    return BundlePricingTier.reconstitute(props);
  }

  private static tierToPersistenceCreate(
    tier: BundlePricingTier,
  ): Prisma.BundlePricingTierUncheckedCreateWithoutBundleInput {
    return {
      id: tier.id,
      tenantId: tier.tenantId,
      billingUnitId: tier.billingUnitId,
      fromUnit: tier.fromUnit,
      pricePerUnit: tier.pricePerUnit,
      currency: tier.currency,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    };
  }

  // --- Component helpers ---

  /**
   * Components are value objects in the domain — they carry no id.
   * The surrogate key lives only at the persistence layer and is discarded on reconstitution.
   */
  private static componentToDomain(prismaComponent: PrismaBundleComponent): BundleComponent {
    return BundleComponent.create({
      productId: prismaComponent.productId,
      quantity: prismaComponent.quantity,
    });
  }

  private static componentToPersistenceCreate(
    component: BundleComponent,
  ): Prisma.BundleComponentUncheckedCreateWithoutBundleInput {
    return {
      id: randomUUID(), // surrogate key generated here — never in the domain
      productId: component.productId,
      quantity: component.quantity,
    };
  }
}
