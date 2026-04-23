import * as React from 'react';

import { OrderCreatedByCustomerEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';
import { EmailLayout } from '../react-email/components/email-layout';
import { renderReactEmail } from '../react-email/render-react-email';
import { OrderCreatedByCustomerEmailContent } from './components/order-created-by-customer-email-content';

export async function renderOrderCreatedByCustomerEmailTemplate(
  payload: OrderCreatedByCustomerEmailPayload,
): Promise<RenderedEmail> {
  return await renderReactEmail({
    subject: `Nuevo pedido #${payload.orderNumber} recibido`,
    component: (
      <EmailLayout
        headerLabel="Notificación del sistema"
        previewText={`Nuevo pedido #${payload.orderNumber} creado por ${payload.customerEmail}.`}
      >
        <OrderCreatedByCustomerEmailContent
          orderNumber={payload.orderNumber}
          customerEmail={payload.customerEmail}
          status={payload.status}
          fulfillmentMethod={payload.fulfillmentMethod}
          pickupDate={payload.pickupDate}
          pickupTime={payload.pickupTime}
          returnDate={payload.returnDate}
          returnTime={payload.returnTime}
          locationName={payload.locationName}
          timezone={payload.timezone}
        />
      </EmailLayout>
    ),
  });
}
