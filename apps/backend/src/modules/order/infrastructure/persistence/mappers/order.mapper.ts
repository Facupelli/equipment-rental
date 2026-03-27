import { JsonValue } from '@prisma/client/runtime/client';
import { ContractBasis, OrderStatus, OrderItemType } from '@repo/types';
import Decimal from 'decimal.js';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import { OrderItemOwnerSplit, SplitStatus } from 'src/modules/order/domain/entities/order-item-owner-split.entity';
import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.value-object';

// ── Prisma row shapes (from include queries) ──────────────────────────────────

type BundleSnapshotComponentRow = {
  id: string;
  bundleSnapshotId: string;
  productTypeId: string;
  productTypeName: string;
  quantity: number;
  pricePerUnit: Decimal;
};

type BundleSnapshotRow = {
  id: string;
  orderItemId: string;
  bundleId: string;
  bundleName: string;
  bundlePrice: Decimal;
  components: BundleSnapshotComponentRow[];
};

type OrderItemOwnerSplitRow = {
  id: string;
  orderItemId: string;
  assetId: string;
  ownerId: string;
  contractId: string;
  status: string;
  ownerShare: Decimal;
  rentalShare: Decimal;
  basis: string;
  grossAmount: Decimal;
  netAmount: Decimal;
  ownerAmount: Decimal;
  rentalAmount: Decimal;
};

type OrderItemRow = {
  id: string;
  orderId: string;
  type: string;
  priceSnapshot: JsonValue;
  productTypeId: string | null;
  bundleId: string | null;
  bundleSnapshot: BundleSnapshotRow | null;
  ownerSplits: OrderItemOwnerSplitRow[];
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
      const bundleSnapshot = itemRow.bundleSnapshot
        ? BundleSnapshot.reconstitute({
            id: itemRow.bundleSnapshot.id,
            orderItemId: itemRow.bundleSnapshot.orderItemId,
            bundleId: itemRow.bundleSnapshot.bundleId,
            bundleName: itemRow.bundleSnapshot.bundleName,
            bundlePrice: itemRow.bundleSnapshot.bundlePrice,
            components: itemRow.bundleSnapshot.components.map((c) =>
              BundleSnapshotComponent.reconstitute({
                id: c.id,
                productTypeId: c.productTypeId,
                productTypeName: c.productTypeName,
                quantity: c.quantity,
                pricePerUnit: c.pricePerUnit,
              }),
            ),
          })
        : null;

      const ownerSplits = itemRow.ownerSplits.map((s) =>
        OrderItemOwnerSplit.reconstitute({
          id: s.id,
          orderItemId: s.orderItemId,
          assetId: s.assetId,
          ownerId: s.ownerId,
          contractId: s.contractId,
          status: s.status as SplitStatus,
          ownerShare: s.ownerShare,
          rentalShare: s.rentalShare,
          basis: s.basis as ContractBasis,
          grossAmount: s.grossAmount,
          netAmount: s.netAmount,
          ownerAmount: s.ownerAmount,
          rentalAmount: s.rentalAmount,
        }),
      );

      return OrderItem.reconstitute({
        id: itemRow.id,
        orderId: itemRow.orderId,
        type: itemRow.type as OrderItemType,
        priceSnapshot: PriceSnapshot.fromJSON(itemRow.priceSnapshot),
        productTypeId: itemRow.productTypeId,
        bundleId: itemRow.bundleId,
        bundleSnapshot,
        ownerSplits,
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
    const splitRows = [];

    for (const item of order.getItems()) {
      itemRows.push({
        id: item.id,
        orderId: item.orderId,
        type: item.type,
        priceSnapshot: item.priceSnapshot.toJSON(),
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
            bundleSnapshotId: item.bundleSnapshot.id,
            productTypeId: component.productTypeId,
            productTypeName: component.productTypeName,
            quantity: component.quantity,
            pricePerUnit: component.pricePerUnit,
          });
        }
      }

      for (const split of item.ownerSplits) {
        splitRows.push({
          id: split.id,
          orderItemId: split.orderItemId,
          assetId: split.assetId,
          ownerId: split.ownerId,
          contractId: split.contractId,
          status: split.status,
          ownerShare: split.ownerShare,
          rentalShare: split.rentalShare,
          basis: split.basis,
          grossAmount: split.grossAmount,
          netAmount: split.netAmount,
          ownerAmount: split.ownerAmount,
          rentalAmount: split.rentalAmount,
        });
      }
    }

    return { orderRow, itemRows, snapshotRows, snapshotComponentRows, splitRows };
  }
}
