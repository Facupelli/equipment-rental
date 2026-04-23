import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { TenantContext } from '@repo/schemas';
import { FindCustomerForAuthByIdQuery } from 'src/modules/customer/public/queries/find-customer-for-auth-by-id.query';
import { CustomerForAuthReadModel } from 'src/modules/customer/public/read-models/customer-for-auth.read-model';
import { OrderCancelledEvent } from 'src/modules/order/public/events/order-cancelled.event';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';

import { NotificationType } from '../../domain/notification-type.enum';
import { NotificationOrchestrator } from '../notification-orchestrator.service';

@Injectable()
export class SendOrderCancelledNotificationHandler {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly notificationOrchestrator: NotificationOrchestrator,
  ) {}

  @OnEvent(OrderCancelledEvent.EVENT_NAME, { async: true })
  async handle(event: OrderCancelledEvent): Promise<void> {
    if (!event.customerId) {
      return;
    }

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
      notificationType: NotificationType.ORDER_CANCELLED,
      emailRecipients: [{ email: customer.email }],
      payload: {
        tenantName: tenant?.name,
      },
      metadata: {
        orderId: event.aggregateId,
      },
      idempotencyKey: `order-cancelled:${event.aggregateId}`,
    });
  }
}
