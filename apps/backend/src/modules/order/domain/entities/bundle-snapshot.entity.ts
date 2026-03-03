import { randomUUID } from 'crypto';
import Decimal from 'decimal.js';

// ---------------------------------------------------------------------------
// BundleSnapshotComponent
// ---------------------------------------------------------------------------

export interface CreateBundleSnapshotComponentProps {
  bundleSnapshotId: string;
  productTypeId: string;
  productTypeName: string;
  quantity: number;
}

export interface ReconstituteBundleSnapshotComponentProps {
  id: string;
  bundleSnapshotId: string;
  productTypeId: string;
  productTypeName: string;
  quantity: number;
}

export class BundleSnapshotComponent {
  private constructor(
    public readonly id: string,
    public readonly bundleSnapshotId: string,
    public readonly productTypeId: string,
    public readonly productTypeName: string,
    public readonly quantity: number,
  ) {}

  static create(props: CreateBundleSnapshotComponentProps): BundleSnapshotComponent {
    return new BundleSnapshotComponent(
      randomUUID(),
      props.bundleSnapshotId,
      props.productTypeId,
      props.productTypeName,
      props.quantity,
    );
  }

  static reconstitute(props: ReconstituteBundleSnapshotComponentProps): BundleSnapshotComponent {
    return new BundleSnapshotComponent(
      props.id,
      props.bundleSnapshotId,
      props.productTypeId,
      props.productTypeName,
      props.quantity,
    );
  }
}

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
