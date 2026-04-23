import { PasswordResetEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';

function formatExpiration(expiresAt?: Date): string | null {
  if (!expiresAt) {
    return null;
  }

  return expiresAt.toUTCString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderPasswordResetEmailTemplate(payload: PasswordResetEmailPayload): RenderedEmail {
  const subject = payload.tenantName ? `Reset your ${payload.tenantName} password` : 'Reset your password';
  const greeting = payload.recipientName ? `Hi ${payload.recipientName},` : 'Hi,';
  const escapedResetUrl = escapeHtml(payload.resetUrl);
  const expiration = formatExpiration(payload.expiresAt);
  const expirationLine = expiration ? `This link expires on ${expiration}.` : null;

  return {
    subject,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      '<p>We received a request to reset your password.</p>',
      `<p><a href="${escapedResetUrl}">Reset your password</a></p>`,
      expirationLine ? `<p>${escapeHtml(expirationLine)}</p>` : null,
      '<p>If you did not request this change, you can safely ignore this email.</p>',
    ]
      .filter((line): line is string => line !== null)
      .join(''),
    text: [
      greeting,
      '',
      'We received a request to reset your password.',
      '',
      `Reset your password: ${payload.resetUrl}`,
      expirationLine,
      '',
      'If you did not request this change, you can safely ignore this email.',
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  };
}
