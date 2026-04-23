import * as React from 'react';
import { FulfillmentMethod, OrderStatus } from '@repo/types';

import { EmailLayout } from '../src/modules/notifications/infrastructure/rendering/react-email/components/email-layout';
import { OrderCreatedConfirmationEmailContent } from '../src/modules/notifications/infrastructure/rendering/templates/components/order-created-confirmation-email-content';

export default function OrderCreatedConfirmationPreview() {
  return (
    <EmailLayout
      brandName="Alquileres Centro"
      headerLabel="Confirmación de pedido"
      previewText="Tu pedido #12345 fue creado y está siendo procesado."
    >
      <OrderCreatedConfirmationEmailContent
        orderNumber={12345}
        status={OrderStatus.PENDING_REVIEW}
        fulfillmentMethod={FulfillmentMethod.PICKUP}
        pickupDate="20/05/2025"
        pickupTime="09:00"
        returnDate="22/05/2025"
        returnTime="17:00"
      />
    </EmailLayout>
  );
}
