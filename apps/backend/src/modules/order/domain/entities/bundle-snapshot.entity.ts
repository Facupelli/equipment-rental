import { randomUUID } from 'crypto';
import Decimal from 'decimal.js';
import { BundleComponentNotFoundException } from '../exceptions/order.exceptions';

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

  /**
   * Computes the pro-rata attributed price for a specific component
   * within this bundle, based on standalone prices at snapshot time.
   *
   * Formula:
   *   (component.pricePerUnit / sum of all pricePerUnit) × bundleFinalPrice
   *
   * The bundleFinalPrice passed in is the order item's finalPrice —
   * the net collected amount after discounts. This means the owner
   * shares the bundle discount burden proportionally.
   *
   * Throws if the productTypeId is not found among components.
   */
  attributedPriceFor(productTypeId: string, bundleFinalPrice: Decimal): Decimal {
    const component = this.components.find((c) => c.productTypeId === productTypeId);

    if (!component) {
      throw new BundleComponentNotFoundException(productTypeId);
    }

    const standaloneSum = this.components.reduce((sum, c) => sum.plus(c.pricePerUnit), new Decimal(0));

    return component.pricePerUnit.dividedBy(standaloneSum).times(bundleFinalPrice);
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
  pricePerUnit: Decimal;
}

export interface ReconstituteBundleSnapshotComponentProps {
  id: string;
  productTypeId: string;
  productTypeName: string;
  quantity: number;
  pricePerUnit: Decimal;
}

export class BundleSnapshotComponent {
  private constructor(
    public readonly id: string,
    public readonly productTypeId: string,
    public readonly productTypeName: string,
    public readonly quantity: number,
    public readonly pricePerUnit: Decimal,
  ) {}

  static create(props: CreateBundleSnapshotComponentProps): BundleSnapshotComponent {
    return new BundleSnapshotComponent(
      randomUUID(),
      props.productTypeId,
      props.productTypeName,
      props.quantity,
      props.pricePerUnit,
    );
  }

  static reconstitute(props: ReconstituteBundleSnapshotComponentProps): BundleSnapshotComponent {
    return new BundleSnapshotComponent(
      props.id,
      props.productTypeId,
      props.productTypeName,
      props.quantity,
      props.pricePerUnit,
    );
  }
}
