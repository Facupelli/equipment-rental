import * as React from 'react';

import { EmailLayout } from '../src/modules/notifications/infrastructure/rendering/react-email/components/email-layout';
import { OrderCancelledEmailContent } from '../src/modules/notifications/infrastructure/rendering/templates/components/order-cancelled-email-content';

export default function OrderCancelledPreview() {
  return (
    <EmailLayout headerLabel="Información importante" previewText="Te informamos que tu pedido ha sido cancelado.">
      <OrderCancelledEmailContent tenantName="Depiqo" recipientName="Facu" />
    </EmailLayout>
  );
}
