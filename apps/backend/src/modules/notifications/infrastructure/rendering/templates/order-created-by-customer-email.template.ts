import { OrderCreatedByCustomerEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderOrderCreatedByCustomerEmailTemplate(payload: OrderCreatedByCustomerEmailPayload): RenderedEmail {
  const subject = `New order #${payload.orderNumber} received`;
  const intro = payload.tenantName
    ? `A customer placed a new order with ${payload.tenantName}.`
    : 'A customer placed a new order.';
  const locationLine = payload.locationName ? `Location: ${payload.locationName}` : null;
  const timezoneLine = payload.timezone ? `Timezone: ${payload.timezone}` : null;

  return {
    subject,
    html: [
      '<p>Hi,</p>',
      `<p>${escapeHtml(intro)}</p>`,
      '<p>',
      `Order number: <strong>${escapeHtml(String(payload.orderNumber))}</strong><br />`,
      `Customer email: ${escapeHtml(payload.customerEmail)}<br />`,
      `Status: ${escapeHtml(payload.status)}<br />`,
      `Fulfillment method: ${escapeHtml(payload.fulfillmentMethod)}<br />`,
      `Pickup: ${escapeHtml(payload.pickupDate)} ${escapeHtml(payload.pickupTime)}<br />`,
      `Return: ${escapeHtml(payload.returnDate)} ${escapeHtml(payload.returnTime)}`,
      locationLine ? `<br />${escapeHtml(locationLine)}` : '',
      timezoneLine ? `<br />${escapeHtml(timezoneLine)}` : '',
      '</p>',
      '<p>Please review the order in the admin panel.</p>',
    ].join(''),
    text: [
      'Hi,',
      '',
      intro,
      '',
      `Order number: ${payload.orderNumber}`,
      `Customer email: ${payload.customerEmail}`,
      `Status: ${payload.status}`,
      `Fulfillment method: ${payload.fulfillmentMethod}`,
      `Pickup: ${payload.pickupDate} ${payload.pickupTime}`,
      `Return: ${payload.returnDate} ${payload.returnTime}`,
      locationLine,
      timezoneLine,
      '',
      'Please review the order in the admin panel.',
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n'),
  };
}
