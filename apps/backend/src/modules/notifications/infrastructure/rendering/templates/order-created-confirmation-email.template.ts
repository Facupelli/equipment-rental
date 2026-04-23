import { OrderCreatedConfirmationEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderOrderCreatedConfirmationEmailTemplate(
  payload: OrderCreatedConfirmationEmailPayload,
): RenderedEmail {
  const subject = payload.tenantName
    ? `${payload.tenantName} received your order #${payload.orderNumber}`
    : `Your order #${payload.orderNumber} was received`;
  const intro = payload.tenantName
    ? `Your order has been successfully created and ${payload.tenantName} is aware of it.`
    : 'Your order has been successfully created and the rental is aware of it.';

  return {
    subject,
    html: [
      '<p>Hi,</p>',
      `<p>${escapeHtml(intro)}</p>`,
      '<p>',
      `Order number: <strong>${escapeHtml(String(payload.orderNumber))}</strong><br />`,
      `Status: ${escapeHtml(payload.status)}<br />`,
      `Fulfillment method: ${escapeHtml(payload.fulfillmentMethod)}<br />`,
      `Pickup: ${escapeHtml(payload.pickupDate)} ${escapeHtml(payload.pickupTime)}<br />`,
      `Return: ${escapeHtml(payload.returnDate)} ${escapeHtml(payload.returnTime)}`,
      '</p>',
      '<p>We will contact you if anything else is needed.</p>',
    ].join(''),
    text: [
      'Hi,',
      '',
      intro,
      '',
      `Order number: ${payload.orderNumber}`,
      `Status: ${payload.status}`,
      `Fulfillment method: ${payload.fulfillmentMethod}`,
      `Pickup: ${payload.pickupDate} ${payload.pickupTime}`,
      `Return: ${payload.returnDate} ${payload.returnTime}`,
      '',
      'We will contact you if anything else is needed.',
    ].join('\n'),
  };
}
