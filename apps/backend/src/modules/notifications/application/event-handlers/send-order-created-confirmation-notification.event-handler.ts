import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { TenantContext } from '@repo/schemas';

import { FindCustomerForAuthByIdQuery } from 'src/modules/customer/public/queries/find-customer-for-auth-by-id.query';
import { CustomerForAuthReadModel } from 'src/modules/customer/public/read-models/customer-for-auth.read-model';
import { OrderCreatedByCustomerEvent } from 'src/modules/order/public/events/order-created-by-customer.event';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';

import { NotificationType } from '../../domain/notification-type.enum';
import { NotificationOrchestrator } from '../notification-orchestrator.service';

function formatMinutesFromMidnight(minutes: number): string {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');

  return `${hour}:${minute}`;
}

@Injectable()
export class SendOrderCreatedConfirmationNotificationHandler {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly notificationOrchestrator: NotificationOrchestrator,
  ) {}

  @OnEvent(OrderCreatedByCustomerEvent.EVENT_NAME, { async: true })
  async handle(event: OrderCreatedByCustomerEvent): Promise<void> {
    const [customer, tenant] = await Promise.all([
      this.queryBus.execute<FindCustomerForAuthByIdQuery, CustomerForAuthReadModel | null>(
        new FindCustomerForAuthByIdQuery(event.customerId),
      ),
      this.queryBus.execute<FindTenantByIdQuery, TenantContext | null>(new FindTenantByIdQuery(event.tenantId)),
    ]);

    if (!customer || customer.deletedAt || !customer.isActive) {
      return;
    }

    await this.notificationOrchestrator.dispatch({
      tenantId: event.tenantId,
      notificationType: NotificationType.ORDER_CREATED_CONFIRMATION,
      emailRecipients: [{ email: customer.email }],
      payload: {
        tenantName: tenant?.name,
        orderNumber: event.orderNumber,
        status: event.status,
        fulfillmentMethod: event.fulfillmentMethod,
        pickupDate: event.pickupDate,
        pickupTime: formatMinutesFromMidnight(event.pickupTime),
        returnDate: event.returnDate,
        returnTime: formatMinutesFromMidnight(event.returnTime),
      },
      metadata: {
        orderId: event.aggregateId,
      },
      idempotencyKey: `order-created-confirmation:${event.aggregateId}`,
    });
  }
}
