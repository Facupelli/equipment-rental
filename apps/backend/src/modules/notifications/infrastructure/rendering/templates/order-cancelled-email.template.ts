import { OrderCancelledEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderOrderCancelledEmailTemplate(payload: OrderCancelledEmailPayload): RenderedEmail {
  const subject = payload.tenantName ? `${payload.tenantName} rental cancelled` : 'Your rental has been cancelled';
  const greeting = payload.recipientName ? `Hi ${payload.recipientName},` : 'Hi,';
  const intro = payload.tenantName
    ? `Your rental with ${payload.tenantName} has been cancelled.`
    : 'Your rental has been cancelled.';

  return {
    subject,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(intro)}</p>`,
      '<p>If you have any questions, please contact the rental provider.</p>',
    ].join(''),
    text: [greeting, '', intro, '', 'If you have any questions, please contact the rental provider.'].join('\n'),
  };
}
