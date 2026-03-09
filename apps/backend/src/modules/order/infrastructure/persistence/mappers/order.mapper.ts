import { OrderStatus, OrderItemType } from '@repo/types';
import Decimal from 'decimal.js';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { Order } from 'src/modules/order/domain/entities/order.entity';

// ── Prisma row shapes (from include queries) ──────────────────────────────────

type BundleSnapshotComponentRow = {
  id: string;
  bundleSnapshotId: string;
  productTypeId: string;
  productTypeName: string;
  quantity: number;
};

type BundleSnapshotRow = {
  id: string;
  orderItemId: string;
  bundleId: string;
  bundleName: string;
  bundlePrice: Decimal;
  components: BundleSnapshotComponentRow[];
};

type OrderItemRow = {
  id: string;
  orderId: string;
  type: string;
  priceSnapshot: Decimal;
  productTypeId: string | null;
  bundleId: string | null;
  bundleSnapshot: BundleSnapshotRow | null;
};

type OrderRow = {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string | null;
  status: string;
  notes: string | null;
  items: OrderItemRow[];
};

// ── Mapper ────────────────────────────────────────────────────────────────────

export class OrderMapper {
  static toDomain(row: OrderRow): Order {
    const items = row.items.map((itemRow) => {
      const snapshot = itemRow.bundleSnapshot
        ? BundleSnapshot.reconstitute({
            id: itemRow.bundleSnapshot.id,
            orderItemId: itemRow.bundleSnapshot.orderItemId,
            bundleId: itemRow.bundleSnapshot.bundleId,
            bundleName: itemRow.bundleSnapshot.bundleName,
            bundlePrice: itemRow.bundleSnapshot.bundlePrice,
            components: itemRow.bundleSnapshot.components.map((c) =>
              BundleSnapshotComponent.reconstitute({
                id: c.id,
                // bundleSnapshotId is not part of the domain entity —
                // it exists only in the DB row and is dropped here intentionally
                productTypeId: c.productTypeId,
                productTypeName: c.productTypeName,
                quantity: c.quantity,
              }),
            ),
          })
        : null;

      return OrderItem.reconstitute({
        id: itemRow.id,
        orderId: itemRow.orderId,
        type: itemRow.type as OrderItemType,
        priceSnapshot: itemRow.priceSnapshot,
        productTypeId: itemRow.productTypeId,
        bundleId: itemRow.bundleId,
        bundleSnapshot: snapshot,
      });
    });

    return Order.reconstitute({
      id: row.id,
      tenantId: row.tenantId,
      locationId: row.locationId,
      customerId: row.customerId,
      status: row.status as OrderStatus,
      notes: row.notes,
      items,
    });
  }

  static toPersistence(order: Order) {
    const orderRow = {
      id: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      customerId: order.customerId,
      status: order.currentStatus,
      notes: order.currentNotes,
    };

    const itemRows = [];
    const snapshotRows = [];
    const snapshotComponentRows = [];

    for (const item of order.getItems()) {
      itemRows.push({
        id: item.id,
        orderId: item.orderId,
        type: item.type,
        priceSnapshot: item.priceSnapshot,
        productTypeId: item.productTypeId,
        bundleId: item.bundleId,
      });

      if (item.bundleSnapshot) {
        snapshotRows.push({
          id: item.bundleSnapshot.id,
          orderItemId: item.bundleSnapshot.orderItemId,
          bundleId: item.bundleSnapshot.bundleId,
          bundleName: item.bundleSnapshot.bundleName,
          bundlePrice: item.bundleSnapshot.bundlePrice,
        });

        for (const component of item.bundleSnapshot.components) {
          snapshotComponentRows.push({
            id: component.id,
            // bundleSnapshotId is injected from the parent here —
            // the entity does not carry it, the mapper owns the FK wiring
            bundleSnapshotId: item.bundleSnapshot.id,
            productTypeId: component.productTypeId,
            productTypeName: component.productTypeName,
            quantity: component.quantity,
          });
        }
      }
    }

    return { orderRow, itemRows, snapshotRows, snapshotComponentRows };
  }
}
