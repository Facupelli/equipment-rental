import {
  BundleSnapshot as PrismaBundleSnapshot,
  BundleSnapshotComponent as PrismaBundleSnapshotComponent,
  Prisma,
} from 'src/generated/prisma/client';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import Decimal from 'decimal.js';

type PrismaBundleSnapshotWithComponents = PrismaBundleSnapshot & {
  components: PrismaBundleSnapshotComponent[];
};

export type BundleSnapshotPersistenceResult = {
  snapshotRow: Prisma.BundleSnapshotUncheckedCreateInput;
  componentRows: Prisma.BundleSnapshotComponentUncheckedCreateInput[];
};

export class BundleSnapshotMapper {
  static toDomain(raw: PrismaBundleSnapshotWithComponents): BundleSnapshot {
    const components = raw.components.map((c) =>
      BundleSnapshotComponent.reconstitute({
        id: c.id,
        // bundleSnapshotId is not part of the domain entity —
        // it is only used at the DB row level
        productTypeId: c.productTypeId,
        productTypeName: c.productTypeName,
        quantity: c.quantity,
        pricePerUnit: new Decimal(c.pricePerUnit.toString()),
      }),
    );

    return BundleSnapshot.reconstitute({
      id: raw.id,
      orderItemId: raw.orderItemId,
      bundleId: raw.bundleId,
      bundleName: raw.bundleName,
      bundlePrice: new Decimal(raw.bundlePrice.toString()),
      components,
    });
  }

  static toPersistence(snapshot: BundleSnapshot): BundleSnapshotPersistenceResult {
    const snapshotRow: Prisma.BundleSnapshotUncheckedCreateInput = {
      id: snapshot.id,
      orderItemId: snapshot.orderItemId,
      bundleId: snapshot.bundleId,
      bundleName: snapshot.bundleName,
      bundlePrice: snapshot.bundlePrice.toDecimalPlaces(2).toString(),
    };

    // bundleSnapshotId is injected here — the mapper owns the FK wiring,
    // not the domain entity.
    const componentRows: Prisma.BundleSnapshotComponentUncheckedCreateInput[] = snapshot.components.map((c) => ({
      id: c.id,
      bundleSnapshotId: snapshot.id,
      productTypeId: c.productTypeId,
      productTypeName: c.productTypeName,
      quantity: c.quantity,
    }));

    return { snapshotRow, componentRows };
  }
}
