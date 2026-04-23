import * as React from 'react';

import { OrderCreatedConfirmationEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';
import { EmailLayout } from '../react-email/components/email-layout';
import { renderReactEmail } from '../react-email/render-react-email';
import { OrderCreatedConfirmationEmailContent } from './components/order-created-confirmation-email-content';

export async function renderOrderCreatedConfirmationEmailTemplate(
  payload: OrderCreatedConfirmationEmailPayload,
): Promise<RenderedEmail> {
  return await renderReactEmail({
    subject: `Tu pedido #${payload.orderNumber} fue creado`,
    component: (
      <EmailLayout
        brandName={payload.tenantName}
        headerLabel="Confirmación de pedido"
        previewText={`Tu pedido #${payload.orderNumber} fue creado y está siendo procesado.`}
      >
        <OrderCreatedConfirmationEmailContent
          orderNumber={payload.orderNumber}
          status={payload.status}
          fulfillmentMethod={payload.fulfillmentMethod}
          pickupDate={payload.pickupDate}
          pickupTime={payload.pickupTime}
          returnDate={payload.returnDate}
          returnTime={payload.returnTime}
        />
      </EmailLayout>
    ),
  });
}
