import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { TenantContext } from '@repo/schemas';

import { FindCustomerForAuthByIdQuery } from 'src/modules/customer/public/queries/find-customer-for-auth-by-id.query';
import { CustomerForAuthReadModel } from 'src/modules/customer/public/read-models/customer-for-auth.read-model';
import { OrderCreatedByCustomerEvent } from 'src/modules/order/public/events/order-created-by-customer.event';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';
import {
  GetLocationContextQuery,
  LocationContextReadModel,
} from 'src/modules/tenant/public/queries/get-location-context.query';
import { FindTenantAdminNotificationRecipientsQuery } from 'src/modules/users/public/queries/find-tenant-admin-notification-recipients.query';
import { TenantAdminNotificationRecipientReadModel } from 'src/modules/users/public/read-models/tenant-admin-notification-recipient.read-model';

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
export class SendOrderCreatedByCustomerNotificationHandler {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly notificationOrchestrator: NotificationOrchestrator,
  ) {}

  @OnEvent(OrderCreatedByCustomerEvent.EVENT_NAME, { async: true })
  async handle(event: OrderCreatedByCustomerEvent): Promise<void> {
    const [customer, tenant, location, recipients] = await Promise.all([
      this.queryBus.execute<FindCustomerForAuthByIdQuery, CustomerForAuthReadModel | null>(
        new FindCustomerForAuthByIdQuery(event.customerId),
      ),
      this.queryBus.execute<FindTenantByIdQuery, TenantContext | null>(new FindTenantByIdQuery(event.tenantId)),
      this.queryBus.execute<GetLocationContextQuery, LocationContextReadModel | null>(
        new GetLocationContextQuery(event.tenantId, event.locationId),
      ),
      this.queryBus.execute<FindTenantAdminNotificationRecipientsQuery, TenantAdminNotificationRecipientReadModel[]>(
        new FindTenantAdminNotificationRecipientsQuery(event.tenantId),
      ),
    ]);

    if (!customer || customer.deletedAt || !customer.isActive || recipients.length === 0) {
      return;
    }

    await this.notificationOrchestrator.dispatch({
      tenantId: event.tenantId,
      notificationType: NotificationType.ORDER_CREATED_BY_CUSTOMER,
      emailRecipients: recipients.map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
      })),
      payload: {
        tenantName: tenant?.name,
        orderNumber: event.orderNumber,
        customerEmail: customer.email,
        status: event.status,
        fulfillmentMethod: event.fulfillmentMethod,
        pickupDate: event.pickupDate,
        pickupTime: formatMinutesFromMidnight(event.pickupTime),
        returnDate: event.returnDate,
        returnTime: formatMinutesFromMidnight(event.returnTime),
        timezone: location?.effectiveTimezone,
      },
      metadata: {
        orderId: event.aggregateId,
      },
      idempotencyKey: `order-created-by-customer:${event.aggregateId}`,
    });
  }
}
