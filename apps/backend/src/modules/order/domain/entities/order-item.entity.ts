import { randomUUID } from 'crypto';
import { BundleSnapshot } from './bundle-snapshot.entity';
import { OrderItemType } from '@repo/types';
import Decimal from 'decimal.js';

export interface CreateOrderItemProps {
  orderId: string;
  type: OrderItemType;
  priceSnapshot: Decimal;
  productTypeId?: string;
  bundleId?: string;
  bundleSnapshot?: BundleSnapshot;
}

export interface ReconstituteOrderItemProps {
  id: string;
  orderId: string;
  type: OrderItemType;
  priceSnapshot: Decimal;
  productTypeId: string | null;
  bundleId: string | null;
  bundleSnapshot: BundleSnapshot | null;
}

export class OrderItem {
  private constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly type: OrderItemType,
    public readonly priceSnapshot: Decimal,
    public readonly productTypeId: string | null,
    public readonly bundleId: string | null,
    public readonly bundleSnapshot: BundleSnapshot | null,
  ) {}

  static create(props: CreateOrderItemProps): OrderItem {
    return new OrderItem(
      randomUUID(),
      props.orderId,
      props.type,
      props.priceSnapshot,
      props.productTypeId ?? null,
      props.bundleId ?? null,
      props.bundleSnapshot ?? null,
    );
  }

  static reconstitute(props: ReconstituteOrderItemProps): OrderItem {
    return new OrderItem(
      props.id,
      props.orderId,
      props.type,
      props.priceSnapshot,
      props.productTypeId,
      props.bundleId,
      props.bundleSnapshot,
    );
  }

  isBundle(): boolean {
    return this.type === OrderItemType.BUNDLE;
  }

  isProduct(): boolean {
    return this.type === OrderItemType.PRODUCT;
  }
}
