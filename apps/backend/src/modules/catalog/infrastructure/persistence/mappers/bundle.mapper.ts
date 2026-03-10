import {
  Bundle as PrismaBundle,
  BundleComponent as PrismaBundleComponent,
  PricingTier as PrismaPricingTier,
  Prisma,
} from 'src/generated/prisma/client';
import { BundleComponent } from 'src/modules/catalog/domain/entities/bundle-component.entity';
import { Bundle } from 'src/modules/catalog/domain/entities/bundle.entity';

type PrismaBundleWithRelations = PrismaBundle & {
  components: PrismaBundleComponent[];
  pricingTiers: PrismaPricingTier[];
};

export class BundleMapper {
  static toDomain(raw: PrismaBundleWithRelations): Bundle {
    const components = raw.components.map(BundleComponentMapper.toDomain);
    return Bundle.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      billingUnitId: raw.billingUnitId,
      name: raw.name,
      imageUrl: raw.imageUrl ?? '',
      description: raw.description,
      components,
      publishedAt: raw.publishedAt,
      retiredAt: raw.retiredAt,
    });
  }

  static toPersistence(entity: Bundle): Prisma.BundleUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      imageUrl: entity.imageUrl,
      description: entity.currentDescription,
      billingUnitId: entity.billingUnitId,
      publishedAt: entity.getPublishedAt(),
      retiredAt: entity.getRetiredAt(),
    };
  }
}

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
