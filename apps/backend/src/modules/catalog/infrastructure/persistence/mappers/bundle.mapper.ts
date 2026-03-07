import {
  Bundle as PrismaBundle,
  BundleComponent as PrismaBundleComponent,
  PricingTier as PrismaPricingTier,
  Prisma,
} from 'src/generated/prisma/client';
import { PricingTierMapper } from './pricing-tier.mapper';
import { BundleComponent } from 'src/modules/catalog/domain/entities/bundle-component.entity';
import { Bundle } from 'src/modules/catalog/domain/entities/bundle.entity';

type PrismaBundleWithRelations = PrismaBundle & {
  components: PrismaBundleComponent[];
  pricingTiers: PrismaPricingTier[];
};

export class BundleComponentMapper {
  static toDomain(raw: PrismaBundleComponent): BundleComponent {
    return BundleComponent.reconstitute({
      id: raw.id,
      bundleId: raw.bundleId,
      productTypeId: raw.productTypeId,
      quantity: raw.quantity,
    });
  }

  static toPersistence(entity: BundleComponent, bundleId: string): Prisma.BundleComponentUncheckedCreateInput {
    return {
      id: entity.id,
      bundleId,
      productTypeId: entity.productTypeId,
      quantity: entity.quantity,
    };
  }
}

export class BundleMapper {
  static toDomain(raw: PrismaBundleWithRelations): Bundle {
    const components = raw.components.map(BundleComponentMapper.toDomain);
    const pricingTiers = raw.pricingTiers.map(PricingTierMapper.toDomain);
    return Bundle.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      billingUnitId: raw.billingUnitId,
      name: raw.name,
      isActive: raw.isActive,
      components,
      pricingTiers,
    });
  }

  static toPersistence(entity: Bundle): Prisma.BundleUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      isActive: entity.active,
      billingUnitId: entity.billingUnitId,
    };
  }
}
