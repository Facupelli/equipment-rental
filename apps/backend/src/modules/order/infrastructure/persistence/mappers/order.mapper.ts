import { OrderItemType, OrderStatus } from '@repo/types';
import {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  BundleSnapshot as PrismaBundleSnapshot,
  BundleSnapshotComponent as PrismaBundleSnapshotComponent,
  Prisma,
} from 'src/generated/prisma/client';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { Order } from 'src/modules/order/domain/entities/order.entity';

// ---------------------------------------------------------------------------
// BundleSnapshotComponentMapper
// ---------------------------------------------------------------------------

export class BundleSnapshotComponentMapper {
  static toDomain(raw: PrismaBundleSnapshotComponent): BundleSnapshotComponent {
    return BundleSnapshotComponent.reconstitute({
      id: raw.id,
      bundleSnapshotId: raw.bundleSnapshotId,
      productTypeId: raw.productTypeId,
      productTypeName: raw.productTypeName,
      quantity: raw.quantity,
    });
  }

  static toPersistence(entity: BundleSnapshotComponent): Prisma.BundleSnapshotComponentUncheckedCreateInput {
    return {
      id: entity.id,
      bundleSnapshotId: entity.bundleSnapshotId,
      productTypeId: entity.productTypeId,
      productTypeName: entity.productTypeName,
      quantity: entity.quantity,
    };
  }
}

// ---------------------------------------------------------------------------
// BundleSnapshotMapper
// ---------------------------------------------------------------------------

type PrismaBundleSnapshotWithRelations = PrismaBundleSnapshot & {
  components: PrismaBundleSnapshotComponent[];
};

export class BundleSnapshotMapper {
  static toDomain(raw: PrismaBundleSnapshotWithRelations): BundleSnapshot {
    const components = raw.components.map(BundleSnapshotComponentMapper.toDomain);
    return BundleSnapshot.reconstitute({
      id: raw.id,
      orderItemId: raw.orderItemId,
      bundleId: raw.bundleId,
      bundleName: raw.bundleName,
      bundlePrice: raw.bundlePrice,
      components,
    });
  }

  static toPersistence(entity: BundleSnapshot): Prisma.BundleSnapshotUncheckedCreateInput {
    return {
      id: entity.id,
      orderItemId: entity.orderItemId,
      bundleId: entity.bundleId,
      bundleName: entity.bundleName,
      bundlePrice: entity.bundlePrice,
    };
  }
}

// ---------------------------------------------------------------------------
// OrderItemMapper
// ---------------------------------------------------------------------------

type PrismaOrderItemWithRelations = PrismaOrderItem & {
  bundleSnapshot: (PrismaBundleSnapshot & { components: PrismaBundleSnapshotComponent[] }) | null;
};

export class OrderItemMapper {
  static toDomain(raw: PrismaOrderItemWithRelations): OrderItem {
    const bundleSnapshot = raw.bundleSnapshot ? BundleSnapshotMapper.toDomain(raw.bundleSnapshot) : null;

    return OrderItem.reconstitute({
      id: raw.id,
      orderId: raw.orderId,
      type: raw.type as OrderItemType,
      priceSnapshot: raw.priceSnapshot,
      productTypeId: raw.productTypeId,
      bundleId: raw.bundleId,
      bundleSnapshot,
    });
  }

  static toPersistence(entity: OrderItem): Prisma.OrderItemUncheckedCreateInput {
    return {
      id: entity.id,
      orderId: entity.orderId,
      type: entity.type,
      priceSnapshot: entity.priceSnapshot,
      productTypeId: entity.productTypeId,
      bundleId: entity.bundleId,
    };
  }
}

// ---------------------------------------------------------------------------
// OrderMapper
// ---------------------------------------------------------------------------

type PrismaOrderWithRelations = PrismaOrder & {
  items: PrismaOrderItemWithRelations[];
};

export class OrderMapper {
  static toDomain(raw: PrismaOrderWithRelations): Order {
    const items = raw.items.map(OrderItemMapper.toDomain);
    return Order.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      locationId: raw.locationId,
      customerId: raw.customerId,
      status: raw.status as OrderStatus,
      notes: raw.notes,
      items,
    });
  }

  static toPersistence(entity: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      locationId: entity.locationId,
      customerId: entity.customerId,
      status: entity.currentStatus,
      notes: entity.currentNotes,
    };
  }
}
