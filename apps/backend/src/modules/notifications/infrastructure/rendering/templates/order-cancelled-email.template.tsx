import * as React from 'react';

import { OrderCancelledEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';
import { EmailLayout } from '../react-email/components/email-layout';
import { renderReactEmail } from '../react-email/render-react-email';
import { OrderCancelledEmailContent } from './components/order-cancelled-email-content';

export async function renderOrderCancelledEmailTemplate(payload: OrderCancelledEmailPayload): Promise<RenderedEmail> {
  return await renderReactEmail({
    subject: 'Tu pedido fue cancelado',
    component: (
      <EmailLayout headerLabel="Información importante" previewText="Te informamos que tu pedido ha sido cancelado.">
        <OrderCancelledEmailContent tenantName={payload.tenantName} recipientName={payload.recipientName} />
      </EmailLayout>
    ),
  });
}
