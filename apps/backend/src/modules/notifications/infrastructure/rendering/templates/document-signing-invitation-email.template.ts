import { DocumentSigningInvitationEmailPayload, RenderedEmail } from '../../../application/ports/email-renderer.port';

const expirationDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderDocumentSigningInvitationEmailTemplate(
  payload: DocumentSigningInvitationEmailPayload,
): RenderedEmail {
  const subject = payload.tenantName
    ? `${payload.tenantName}: revisa y firma tu acuerdo de alquiler`
    : 'Revisa y firma tu acuerdo de alquiler';
  const replacementLine = payload.isReplacement
    ? 'Este correo reemplaza cualquier invitacion de firma anterior. Usa solo este enlace.'
    : null;
  const expirationLine = `Este enlace estara disponible hasta ${expirationDateFormatter.format(payload.expiresAt)} UTC.`;

  return {
    subject,
    html: [
      '<p>Hola,</p>',
      `<p>Te enviamos este correo para que revises y firmes tu ${escapeHtml(payload.documentLabel)}.</p>`,
      `<p>Documento: <strong>${escapeHtml(payload.documentNumber)}</strong></p>`,
      `<p><a href="${escapeHtml(payload.signingUrl)}">Revisar y firmar el acuerdo</a></p>`,
      replacementLine ? `<p>${escapeHtml(replacementLine)}</p>` : null,
      `<p>${escapeHtml(expirationLine)}</p>`,
      '<p>Si no esperabas esta solicitud, ponte en contacto con el rental antes de continuar.</p>',
    ]
      .filter((line): line is string => line !== null)
      .join(''),
    text: [
      'Hola,',
      '',
      `Te enviamos este correo para que revises y firmes tu ${payload.documentLabel}.`,
      `Documento: ${payload.documentNumber}`,
      '',
      `Revisar y firmar el acuerdo: ${payload.signingUrl}`,
      replacementLine,
      expirationLine,
      '',
      'Si no esperabas esta solicitud, ponte en contacto con el rental antes de continuar.',
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  };
}
