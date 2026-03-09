import { randomUUID } from 'crypto';
import Decimal from 'decimal.js';

// ---------------------------------------------------------------------------
// BundleSnapshot
// ---------------------------------------------------------------------------

export interface CreateBundleSnapshotProps {
  orderItemId: string;
  bundleId: string;
  bundleName: string;
  bundlePrice: Decimal;
  components: BundleSnapshotComponent[];
}

export interface ReconstituteBundleSnapshotProps {
  id: string;
  orderItemId: string;
  bundleId: string;
  bundleName: string;
  bundlePrice: Decimal;
  components: BundleSnapshotComponent[];
}

export class BundleSnapshot {
  private constructor(
    public readonly id: string,
    public readonly orderItemId: string,
    public readonly bundleId: string,
    public readonly bundleName: string,
    public readonly bundlePrice: Decimal,
    public readonly components: BundleSnapshotComponent[],
  ) {}

  static create(props: CreateBundleSnapshotProps): BundleSnapshot {
    return new BundleSnapshot(
      randomUUID(),
      props.orderItemId,
      props.bundleId,
      props.bundleName,
      props.bundlePrice,
      props.components,
    );
  }

  static reconstitute(props: ReconstituteBundleSnapshotProps): BundleSnapshot {
    return new BundleSnapshot(
      props.id,
      props.orderItemId,
      props.bundleId,
      props.bundleName,
      props.bundlePrice,
      props.components,
    );
  }
}

// ---------------------------------------------------------------------------
// BundleSnapshotComponent
// ---------------------------------------------------------------------------
// bundleSnapshotId is intentionally absent from this entity.
// It is a persistence concern — the mapper derives it from the parent
// BundleSnapshot at write time. The domain only needs the component data.
// ---------------------------------------------------------------------------

export interface CreateBundleSnapshotComponentProps {
  productTypeId: string;
  productTypeName: string;
  quantity: number;
}

export interface ReconstituteBundleSnapshotComponentProps {
  id: string;
  productTypeId: string;
  productTypeName: string;
  quantity: number;
}

export class BundleSnapshotComponent {
  private constructor(
    public readonly id: string,
    public readonly productTypeId: string,
    public readonly productTypeName: string,
    public readonly quantity: number,
  ) {}

  static create(props: CreateBundleSnapshotComponentProps): BundleSnapshotComponent {
    return new BundleSnapshotComponent(randomUUID(), props.productTypeId, props.productTypeName, props.quantity);
  }

  static reconstitute(props: ReconstituteBundleSnapshotComponentProps): BundleSnapshotComponent {
    return new BundleSnapshotComponent(props.id, props.productTypeId, props.productTypeName, props.quantity);
  }
}
