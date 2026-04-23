import * as React from 'react';
import { FulfillmentMethod, OrderStatus } from '@repo/types';

import { EmailLayout } from '../src/modules/notifications/infrastructure/rendering/react-email/components/email-layout';
import { OrderCreatedByCustomerEmailContent } from '../src/modules/notifications/infrastructure/rendering/templates/components/order-created-by-customer-email-content';

export default function OrderCreatedByCustomerPreview() {
  return (
    <EmailLayout headerLabel="Notificación del sistema" previewText="Nuevo pedido #12345 creado por cliente@email.com.">
      <OrderCreatedByCustomerEmailContent
        orderNumber={12345}
        customerEmail="cliente@email.com"
        status={OrderStatus.PENDING_REVIEW}
        fulfillmentMethod={FulfillmentMethod.PICKUP}
        pickupDate="20/05/2025"
        pickupTime="09:00"
        returnDate="22/05/2025"
        returnTime="17:00"
        locationName="Depósito Centro"
        timezone="America/Argentina/Buenos_Aires"
      />
    </EmailLayout>
  );
}
