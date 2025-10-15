import { ReservationOrderItem } from "src/modules/booking/domain/entities/reservation-order-item.entity";
import { ReservationOrderSchema } from "./reservation-order.schema";
import { ReservationOrder } from "src/modules/booking/domain/entities/reservation-order.entity";
import { ReservationOrderItemSchema } from "./reservation-order-item.schema";

export const ReservationOrderMapper = {
  toEntity(schema: ReservationOrderSchema): ReservationOrder {
    return new ReservationOrder({
      id: schema.id,
      customerId: schema.customer_id,
      status: schema.status,
      startDatetime: schema.start_datetime,
      endDatetime: schema.end_datetime,
      createdAt: schema.created_at,
      updatedAt: schema.updated_at,
      items:
        schema.items?.map((item) =>
          ReservationOrderItemMapper.toEntity(item)
        ) || [],
    });
  },

  toSchema(entity: ReservationOrder): ReservationOrderSchema {
    const schema = new ReservationOrderSchema();
    schema.id = entity.id;
    schema.customer_id = entity.customerId;
    schema.status = entity.status;
    schema.start_datetime = entity.startDatetime;
    schema.end_datetime = entity.endDatetime;
    schema.created_at = entity.createdAt;
    schema.updated_at = entity.updatedAt;

    if (entity.items) {
      schema.items = entity.items.map((item) =>
        ReservationOrderItemMapper.toSchema(item)
      );
    }

    return schema;
  },
};

export const ReservationOrderItemMapper = {
  toEntity(schema: ReservationOrderItemSchema): ReservationOrderItem {
    return new ReservationOrderItem({
      id: schema.id,
      orderId: schema.order_id,
      itemId: schema.item_id,
      quantity: schema.quantity,
      createdAt: schema.created_at,
      updatedAt: schema.updated_at,
    });
  },

  toSchema(entity: ReservationOrderItem): ReservationOrderItemSchema {
    const schema = new ReservationOrderItemSchema();
    schema.id = entity.id;
    schema.order_id = entity.orderId;
    schema.item_id = entity.itemId;
    schema.quantity = entity.quantity;
    schema.created_at = entity.createdAt;
    schema.updated_at = entity.updatedAt;
    return schema;
  },
};
